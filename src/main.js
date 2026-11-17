const { app, BrowserWindow, ipcMain, dialog, Menu, screen, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const {
    createRemoteRunner,
    openStream,
    createChunkCoalescer,
    serviceLogCommand,
    serviceLogAutoCommand,
    summarizeScOutput,
    parseServiceState,
    parseServersFromIni,
    parseServersFromJson,
    scQueryBatchCommand,
    chunkScQueryBatch,
    parseScQueryBatch,
    scBatchHasMarkers,
} = require('./index');
const { createConnectionPool, connectionKey } = require('./sshPool');
const docker = require('./docker');
const vault = require('./vault');
const settings = require('./settings');
const { migrateLegacyUserData } = require('./userDataMigration');

// Traz vault/preferências da pasta de dados anterior ao rename (antes do `ready`).
try {
    const from = migrateLegacyUserData({ appData: app.getPath('appData'), userData: app.getPath('userData') });
    if (from) console.log(`[remora] dados migrados de ${from}`);
} catch (err) {
    console.error('[remora] falha ao migrar dados antigos:', err);
}

let mainWindow;

app.on('ready', () => {
    // Remove o menu nativo (File/Edit/View/Help) — sem utilidade neste app
    Menu.setApplicationMenu(null);

    if (!vault.isAvailable()) {
        dialog.showErrorBox(
            'Criptografia indisponível',
            'O armazenamento seguro (safeStorage/DPAPI) não está disponível nesta conta/máquina. ' +
                'O cadastro de servidores ficará indisponível para não gravar credenciais em texto plano.'
        );
    }

    // Tamanho inicial 1280×800 (o layout de barra lateral + tabela foi desenhado
    // para 1024–1600px), limitado à área útil da tela (exclui a taskbar).
    // Mínimo de 900px de largura: abaixo de 1100px a coluna Caminho some.
    const { width: waW, height: waH } = screen.getPrimaryDisplay().workAreaSize;
    const winWidth = Math.min(1280, waW - 40);
    const winHeight = Math.min(800, waH - 40);

    mainWindow = new BrowserWindow({
        width: winWidth,
        height: winHeight,
        minWidth: 900,
        minHeight: 640,
        useContentSize: true, // width/height referem-se à área útil (sem barra de título)
        center: true,
        icon: path.join(__dirname, 'ui', 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false, // desabilitado para garantir a integridade dos arquivos ao executar o backend
        },
    });

    // Links target="_blank" (ex.: GitHub do autor no rodapé) devem abrir no navegador
    // padrão do sistema, não numa janela Electron. Só http/https por segurança.
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        try {
            const { protocol } = new URL(url);
            if (protocol === 'http:' || protocol === 'https:') {
                shell.openExternal(url);
            }
        } catch (_) {
            /* URL inválida — ignora */
        }
        return { action: 'deny' };
    });

    mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
    mainWindow.on('closed', () => {
        closeAllLogSessions();
        sshPool.closeAll('janela fechada');
        mainWindow = null;
    });
});

// Encerra sessões de log e conexões persistentes ao sair (não deixa sessões SSH penduradas).
app.on('before-quit', () => {
    closeAllLogSessions();
    sshPool.closeAll('encerramento do app');
});

// Store de host keys injetado no backend SSH (verificação anti-MITM / TOFU)
const hostKeyStore = {
    get: (host, port) => vault.getHostKey(host, port),
    set: (host, port, fp) => vault.setHostKey(host, port, fp),
};

// Pool de conexões persistentes: 1 conexão SSH por identidade (usuário@host:porta),
// com até 4 canais em paralelo. Elimina o handshake/autenticação a cada comando
// (lento com usuário de domínio) e o ECONNRESET que o sshd do Windows envia a
// cada conexão encerrada.
const sshPool = createConnectionPool({
    hostKeyStore,
    maxChannelsPerConn: 4,
    idleMs: 60000,
});

// Agendador: limita execuções simultâneas, serializa por serviço (lane), dá
// prioridade às ações do usuário sobre o polling e reexecuta em erros transitórios.
const runner = createRemoteRunner({
    maxConcurrent: 8,
    retries: 2,
    retryDelayMs: 800,
    hostKeyStore,
    exec: sshPool.exec,
});

const HIGH = { priority: 'high' };

// Envia ao renderer apenas se a janela ainda existir (respostas SSH podem
// chegar depois de a janela ser fechada).
function safeSend(sender, channel, payload) {
    if (sender && !sender.isDestroyed()) sender.send(channel, payload);
}

// Envia um log estruturado para o frontend (nível controla a cor da linha)
function sendLog(event, level, host, service, message) {
    safeSend(event.sender, 'log', { level, host, service, message });
}

function classifyScSummary(summary) {
    if (/falha/i.test(summary)) return 'error';
    if (/já em execução/i.test(summary)) return 'warn';
    return 'ok';
}

// ---- IPC: cadastro de grupos/servidores (retornos sem senha) --------------

ipcMain.handle('groups:list', () => vault.listGroups());
ipcMain.handle('groups:create', (_e, name) => vault.createGroup(name));
ipcMain.handle('groups:rename', (_e, id, name) => vault.renameGroup(id, name));
ipcMain.handle('groups:setCritical', (_e, id, critical) => vault.setGroupCritical(id, critical));
ipcMain.handle('groups:delete', (_e, id) => vault.deleteGroup(id));

ipcMain.handle('servers:add', (_e, groupId, data) => vault.addServer(groupId, data));
ipcMain.handle('servers:update', (_e, groupId, serverId, data) =>
    vault.updateServer(groupId, serverId, data)
);
ipcMain.handle('servers:remove', (_e, groupId, serverId) =>
    vault.removeServer(groupId, serverId)
);

// ---- IPC: importação de .ini/.json ----------------------------------------

ipcMain.handle('import:file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Importar servidores (.ini ou .json)',
        properties: ['openFile'],
        filters: [
            { name: 'Configurações', extensions: ['ini', 'json'] },
            { name: 'Todos os arquivos', extensions: ['*'] },
        ],
    });
    if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true };
    }

    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();
    const servers = ext === '.json' ? parseServersFromJson(content) : parseServersFromIni(content);

    if (servers.length === 0) {
        return { canceled: false, imported: 0, errors: ['Nenhum servidor válido encontrado no arquivo.'] };
    }

    const groupName = path.basename(filePath, ext);
    const { group, imported, errors } = vault.createGroupWithServers(groupName, servers);
    return { canceled: false, group, imported, errors };
});

// ---- IPC: ações sobre os serviços de um grupo -----------------------------

// Monta o comando `sc` de forma segura (nome citado). A validação de conteúdo
// já ocorre na gravação (vault.buildServer), aqui apenas citamos com aspas.
function scCommand(action, serviceName) {
    return `sc ${action} "${serviceName}"`;
}

function runOnGroup(event, groupId, action) {
    let servers;
    try {
        servers = vault.getGroupServers(groupId);
    } catch (e) {
        sendLog(event, 'error', '', '', `Falha ao carregar grupo: ${e.message}`);
        return;
    }
    if (!servers.length) {
        sendLog(event, 'warn', '', '', 'O grupo selecionado não possui servidores.');
        return;
    }
    // Handlers `sc` aplicam-se apenas a servidores Windows; docker é gerenciado
    // pelos handlers docker:* dedicados.
    servers
        .filter((server) => (server.type || 'windows') === 'windows')
        .forEach((server) => action(server));
}

function onRetry(event) {
    return (server, attempt) => {
        const label = server.serviceName || server.composeDir || '';
        sendLog(event, 'warn', server.host, label, `Conexão instável, tentativa ${attempt}…`);
    };
}

// Ações em andamento por servidor. Polling e ações rodam em lanes diferentes,
// então um ciclo de status agendado ANTES de uma ação poderia chegar depois e
// sobrescrever o estado mais novo publicado pela ação; estes contadores evitam isso.
const actionsInFlight = new Map(); // serverId -> nº de ações em andamento
const actionGen = new Map(); // serverId -> geração (incrementa a cada ação)

function beginAction(serverId) {
    actionsInFlight.set(serverId, (actionsInFlight.get(serverId) || 0) + 1);
    actionGen.set(serverId, (actionGen.get(serverId) || 0) + 1);
}

function endAction(serverId) {
    const n = (actionsInFlight.get(serverId) || 1) - 1;
    if (n > 0) actionsInFlight.set(serverId, n);
    else actionsInFlight.delete(serverId);
}

// Após uma ação, reconsulta o estado (sc query) e emite `status` para a UI
// atualizar a célula do servidor imediatamente (sem esperar o polling).
function pushServiceStatus(event, server, onDone) {
    runner.schedule(
        server,
        scCommand('query', server.serviceName),
        (err, output) => {
            safeSend(event.sender, 'status', {
                key: server.id,
                serverId: server.id,
                host: server.host,
                serviceName: server.serviceName,
                state: err ? 'error' : parseServiceState(output),
            });
            if (onDone) onDone();
        },
        () => {},
        HIGH
    );
}

// Aguarda o serviço chegar a `wanted`. Necessário no reinício: o `sc stop`
// retorna com o serviço ainda em STOP_PENDING e um `sc start` imediato falharia
// (1056). Uma consulta por vez, com pausa entre elas sem ocupar slot do runner.
// Resolve true ao atingir o estado; false em timeout ou estado indeterminável.
function waitForServiceState(server, wanted, { timeoutMs = 30000, intervalMs = 1000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    return new Promise((resolve) => {
        const poll = () => {
            runner.schedule(
                server,
                scCommand('query', server.serviceName),
                (err, output) => {
                    const state = err ? 'error' : parseServiceState(output);
                    if (state === wanted) return resolve(true);
                    // serviço inexistente/saída ilegível: não adianta esperar
                    if (state === 'unknown' || state === 'error' || Date.now() >= deadline) return resolve(false);
                    setTimeout(poll, intervalMs);
                },
                () => {},
                HIGH
            );
        };
        poll();
    });
}

// Executa uma ação (start/stop/restart) num único servidor Windows, com log e
// atualização de status. Compartilhado pelos handlers de grupo e por servidor.
function doServiceAction(event, server, action) {
    if (action !== 'start' && action !== 'stop' && action !== 'restart') {
        sendLog(event, 'error', server.host, server.serviceName || '', `Ação de serviço inválida: ${action}`);
        return;
    }
    beginAction(server.id);
    const done = () => endAction(server.id);

    const finish = (verb, err, output) => {
        if (err) {
            console.error(`Erro ao ${verb} o serviço em ${server.host}: ${err.message}`);
            sendLog(event, 'error', server.host, server.serviceName, `Falha ao ${verb}: ${err.message}`);
        } else {
            const summary = summarizeScOutput(output);
            sendLog(event, classifyScSummary(summary), server.host, server.serviceName, `${verb} → ${summary}`);
        }
        pushServiceStatus(event, server, done);
    };

    if (action === 'start') {
        runner.schedule(server, scCommand('start', server.serviceName), (err, out) => finish('Iniciar', err, out), onRetry(event), HIGH);
    } else if (action === 'stop') {
        runner.schedule(server, scCommand('stop', server.serviceName), (err, out) => finish('Parar', err, out), onRetry(event), HIGH);
    } else {
        runner.schedule(server, scCommand('stop', server.serviceName), (err) => {
            if (err) {
                console.error(`Erro ao parar o serviço em ${server.host}: ${err.message}`);
                sendLog(event, 'error', server.host, server.serviceName, `Falha ao parar (reinício): ${err.message}`);
                pushServiceStatus(event, server, done);
                return;
            }
            sendLog(event, 'info', server.host, server.serviceName, 'Parada solicitada, aguardando o serviço parar…');
            waitForServiceState(server, 'stopped').then((stopped) => {
                if (stopped) {
                    sendLog(event, 'info', server.host, server.serviceName, 'Parado, iniciando novamente…');
                } else {
                    sendLog(event, 'warn', server.host, server.serviceName, 'Parada não confirmada a tempo; tentando iniciar mesmo assim…');
                }
                runner.schedule(server, scCommand('start', server.serviceName), (err2, out2) => finish('Reiniciar', err2, out2), onRetry(event), HIGH);
            });
        }, onRetry(event), HIGH);
    }
}

ipcMain.on('start-service', (event, groupId) => {
    runOnGroup(event, groupId, (server) => doServiceAction(event, server, 'start'));
});

ipcMain.on('stop-service', (event, groupId) => {
    runOnGroup(event, groupId, (server) => doServiceAction(event, server, 'stop'));
});

ipcMain.on('restart-service', (event, groupId) => {
    runOnGroup(event, groupId, (server) => doServiceAction(event, server, 'restart'));
});

// Ação individual num servidor Windows (start/stop/restart).
ipcMain.on('service:action', (event, payload) => {
    const { groupId, serverId, action } = payload || {};
    let server;
    try {
        server = vault.getGroupServers(groupId).find((s) => s.id === serverId);
    } catch (e) {
        sendLog(event, 'error', '', '', `Falha ao carregar grupo: ${e.message}`);
        return;
    }
    if (!server) {
        sendLog(event, 'error', '', '', 'Servidor não encontrado.');
        return;
    }
    if ((server.type || 'windows') !== 'windows') {
        sendLog(event, 'error', server.host, '', 'Servidor não é do tipo Windows.');
        return;
    }
    doServiceAction(event, server, action);
});

// Ciclos de status em andamento por grupo: o polling não empilha um ciclo novo
// enquanto o anterior não terminou (senão a fila cresce sem limite e as ações
// do usuário esperam atrás dela). O watchdog libera um ciclo travado.
const statusInFlight = new Map(); // groupId -> início do ciclo (ms)
const STATUS_CYCLE_WATCHDOG_MS = 120000;

function emitServiceStatus(event, server, state) {
    safeSend(event.sender, 'status', {
        key: server.id,
        serverId: server.id,
        host: server.host,
        serviceName: server.serviceName,
        state,
    });
}

// Consulta o estado dos serviços Windows do grupo e transmite o resultado por
// servidor. Os serviços de uma mesma conexão (usuário@host:porta) são
// consultados num ÚNICO comando em lote (um `sc query` por serviço, separados
// por marcadores). Não gera log no Histórico; apenas alimenta a coluna Status.
ipcMain.on('check-status', (event, groupId) => {
    const startedAt = statusInFlight.get(groupId);
    if (startedAt) {
        const age = Date.now() - startedAt;
        if (age < STATUS_CYCLE_WATCHDOG_MS) {
            console.log(`[status] ciclo anterior ainda em andamento (${age}ms); atualização ignorada.`);
            return;
        }
        console.warn(`[status] ciclo anterior excedeu ${STATUS_CYCLE_WATCHDOG_MS}ms; iniciando um novo.`);
    }

    let servers;
    try {
        servers = vault.getGroupServers(groupId);
    } catch (e) {
        sendLog(event, 'error', '', '', `Falha ao carregar grupo: ${e.message}`);
        return;
    }
    const windows = servers.filter((s) => (s.type || 'windows') === 'windows');

    // Agrupa por identidade de conexão e fatia em lotes que cabem no cmd.exe.
    const byConn = new Map();
    windows.forEach((s) => {
        if (!vault.isValidServiceName(s.serviceName)) {
            emitServiceStatus(event, s, 'error');
            return;
        }
        const key = connectionKey(s);
        if (!byConn.has(key)) byConn.set(key, []);
        byConn.get(key).push(s);
    });
    const batches = [];
    byConn.forEach((list, key) => {
        let offset = 0;
        chunkScQueryBatch(list.map((s) => s.serviceName)).forEach((names, i) => {
            batches.push({
                lane: `status:${key}#${i}`,
                servers: list.slice(offset, offset + names.length),
                command: scQueryBatchCommand(names),
            });
            offset += names.length;
        });
    });
    if (!batches.length) return;

    const t0 = Date.now();
    const connectsBefore = sshPool.stats().connectsTotal;
    statusInFlight.set(groupId, t0);
    let pending = batches.length;

    batches.forEach((batch) => {
        // geração de cada servidor no agendamento (ver actionGen)
        const gens = batch.servers.map((s) => actionGen.get(s.id) || 0);
        runner.schedule(
            batch.servers[0], // todos do lote compartilham a mesma conexão
            batch.command,
            (err, output) => {
                let states;
                if (err) {
                    states = batch.servers.map(() => 'error');
                } else {
                    if (!scBatchHasMarkers(output)) {
                        console.warn(
                            `[status] ${batch.servers[0].host}: resposta sem marcadores — o shell padrão do OpenSSH precisa ser o cmd.exe.`
                        );
                    }
                    states = parseScQueryBatch(output, batch.servers.length);
                }
                batch.servers.forEach((s, i) => {
                    if (actionsInFlight.has(s.id) || (actionGen.get(s.id) || 0) !== gens[i]) return;
                    emitServiceStatus(event, s, states[i]);
                });
                if (--pending === 0) {
                    if (statusInFlight.get(groupId) === t0) statusInFlight.delete(groupId);
                    console.log(
                        `[status] ciclo: ${windows.length} serviço(s), ${batches.length} lote(s), ` +
                            `${sshPool.stats().connectsTotal - connectsBefore} conexão(ões) nova(s), ${Date.now() - t0}ms.`
                    );
                }
            },
            (server, attempt, err) => console.warn(`[status] ${server.host}: tentativa ${attempt} após erro: ${err.message}`),
            { lane: batch.lane, timeoutMs: 60000, retries: 1 }
        );
    });
});

// ---- IPC: gerenciamento de projetos docker compose ------------------------

// Allowlist/cache de descoberta por servidor (mantida no main process). Só é
// permitido agir sobre arquivos compose e serviços previamente descobertos.
// serverId -> { files: Set<composeFile>, services: Map<composeFile, Set<service>> }
const discoveredByServer = new Map();

// Envolve runner.schedule numa Promise para orquestrar descoberta sequencial.
// `opts` (priority, lane…) é repassado ao runner.
function scheduleAsync(server, command, opts) {
    return new Promise((resolve) => {
        runner.schedule(server, command, (err, output) => resolve({ err, output }), () => {}, opts);
    });
}

// Carrega e valida um servidor docker de um grupo (retorna com senha).
function getDockerServer(groupId, serverId) {
    const servers = vault.getGroupServers(groupId);
    const server = servers.find((s) => s.id === serverId);
    if (!server) throw new Error('Servidor não encontrado.');
    if ((server.type || 'windows') !== 'docker') throw new Error('Servidor não é do tipo docker.');
    return server;
}

// Descobre projetos (subpastas com compose) e o estado dos serviços de cada um.
// Atualiza a allowlist em memória e devolve a árvore para a UI.
async function discoverServer(server, opts) {
    const disc = await scheduleAsync(server, docker.discoverCommand(server.composeDir), opts);
    if (disc.err) throw disc.err;
    const files = docker.parseDiscoverOutput(disc.output);

    const projects = [];
    const servicesByFile = new Map();
    for (const file of files) {
        const ps = await scheduleAsync(server, docker.psCommand(file), opts);
        const rows = ps.err ? [] : docker.parseComposePs(ps.output);
        const services = rows.map((r) => ({ service: r.service, state: docker.mapDockerState(r) }));
        servicesByFile.set(file, new Set(services.map((s) => s.service)));
        projects.push({
            composeFile: file,
            name: docker.projectNameFromFile(file),
            services,
            state: docker.aggregateState(services.map((s) => s.state)),
        });
    }

    discoveredByServer.set(server.id, { files: new Set(files), services: servicesByFile });
    const serverState = docker.aggregateState(
        projects.reduce((acc, p) => acc.concat(p.services.map((s) => s.state)), [])
    );
    return {
        serverId: server.id,
        host: server.host,
        composeDir: server.composeDir,
        projects,
        state: serverState,
    };
}

// Versão do app (app.getVersion lê do package.json empacotado).
ipcMain.handle('app:version', () => app.getVersion());

// Preferências do app (intervalo de atualização, etc.)
ipcMain.handle('settings:get', () => settings.getSettings());
ipcMain.handle('settings:set', (_e, patch) => settings.updateSettings(patch));

// Descoberta sob demanda (chamada ao expandir um servidor docker na UI).
ipcMain.handle('docker:discover', async (_e, groupId, serverId) => {
    const server = getDockerServer(groupId, serverId);
    return discoverServer(server, HIGH);
});

// Atualização leve: reusa a lista de arquivos já descoberta e roda apenas `ps`
// (evita o `find` a cada polling). Sem cache, cai para a descoberta completa.
async function refreshServer(server) {
    const cache = discoveredByServer.get(server.id);
    if (!cache || cache.files.size === 0) return discoverServer(server);

    const projects = [];
    for (const file of cache.files) {
        const ps = await scheduleAsync(server, docker.psCommand(file));
        const rows = ps.err ? [] : docker.parseComposePs(ps.output);
        const services = rows.map((r) => ({ service: r.service, state: docker.mapDockerState(r) }));
        cache.services.set(file, new Set(services.map((s) => s.service)));
        projects.push({
            composeFile: file,
            name: docker.projectNameFromFile(file),
            services,
            state: docker.aggregateState(services.map((s) => s.state)),
        });
    }
    const serverState = docker.aggregateState(
        projects.reduce((acc, p) => acc.concat(p.services.map((s) => s.state)), [])
    );
    return {
        serverId: server.id,
        host: server.host,
        composeDir: server.composeDir,
        projects,
        state: serverState,
    };
}

// Atualizações em andamento por servidor docker: chamadas sobrepostas (polling
// mais lento que o intervalo) reaproveitam a mesma em vez de empilhar comandos.
const dockerRefreshInFlight = new Map(); // serverId -> Promise

ipcMain.handle('docker:refresh', async (_e, groupId, serverId) => {
    const server = getDockerServer(groupId, serverId);
    if (dockerRefreshInFlight.has(serverId)) return dockerRefreshInFlight.get(serverId);
    const run = refreshServer(server).finally(() => dockerRefreshInFlight.delete(serverId));
    dockerRefreshInFlight.set(serverId, run);
    return run;
});

// Testa a conexão docker com os dados do formulário (sem precisar salvar):
// confirma SSH, presença do `docker compose` v2 e conta os projetos no diretório.
// Em edição sem nova senha, completa a senha a partir do cadastro.
ipcMain.handle('docker:test', async (_e, groupId, serverId, cfg) => {
    const server = {
        host: String((cfg && cfg.host) || '').trim(),
        port: cfg && cfg.port,
        username: String((cfg && cfg.username) || '').trim(),
        password: (cfg && cfg.password) || '',
        composeDir: String((cfg && cfg.composeDir) || '').replace(/\/+$/, ''),
    };
    if (serverId && !server.password) {
        try {
            const stored = vault.getGroupServers(groupId).find((s) => s.id === serverId);
            if (stored) server.password = stored.password;
        } catch (_) {
            /* ignora: erro de validação vem a seguir */
        }
    }
    if (!vault.isValidHost(server.host)) throw new Error('Host inválido.');
    if (!server.username) throw new Error('Usuário é obrigatório.');
    if (!vault.isValidComposeDir(server.composeDir)) {
        throw new Error('Diretório compose inválido (use caminho absoluto, ex.: /kingposto).');
    }

    const ver = await scheduleAsync(server, 'docker compose version 2>&1', HIGH);
    if (ver.err) throw new Error(`Conexão SSH falhou: ${ver.err.message}`);
    const verOut = String(ver.output || '').trim();
    const firstLine = verOut.split(/\r?\n/)[0] || '';
    if (/permission denied/i.test(verOut)) {
        throw new Error('Sem permissão para usar o docker (adicione o usuário ao grupo docker).');
    }
    if (!/compose version|v2\./i.test(verOut)) {
        throw new Error(`docker compose v2 não encontrado. Resposta: ${firstLine || '(vazia)'}`);
    }

    const disc = await scheduleAsync(server, docker.discoverCommand(server.composeDir), HIGH);
    const files = disc.err ? [] : docker.parseDiscoverOutput(disc.output);
    return {
        version: firstLine,
        projectCount: files.length,
        projects: files.map((f) => docker.projectNameFromFile(f)),
    };
});

function summarizeDockerOutput(output) {
    if (!output || !output.trim()) return 'OK';
    const low = output.toLowerCase();
    if (low.includes('permission denied')) return 'Permissão negada (usuário no grupo docker?)';
    if (/\berror\b|\bfailed\b|cannot|no such/i.test(output)) {
        const errLine = output.split(/\r?\n/).find((l) => /error|failed|cannot|no such/i.test(l));
        return (errLine || output.split(/\r?\n/)[0]).slice(0, 200);
    }
    // Sucesso: última linha não vazia (ex.: "Container app-api-1 Started").
    const lines = output.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    return lines.length ? lines[lines.length - 1].slice(0, 200) : 'OK';
}

function classifyDockerOutput(output) {
    const low = String(output || '').toLowerCase();
    if (low.includes('permission denied') || /\berror\b|\bfailed\b|cannot|no such/i.test(low)) {
        return 'error';
    }
    return 'ok';
}

// Reconsulta o estado de um projeto e emite status por serviço e agregado do
// projeto (chaves compostas para a UI atualizar as células correspondentes).
function refreshProjectStatus(event, server, file) {
    runner.schedule(
        server,
        docker.psCommand(file),
        (err, output) => {
            const rows = err ? [] : docker.parseComposePs(output);
            const services = rows.map((r) => ({ service: r.service, state: docker.mapDockerState(r) }));
            const cache = discoveredByServer.get(server.id);
            if (cache) cache.services.set(file, new Set(services.map((s) => s.service)));
            services.forEach((s) => {
                safeSend(event.sender, 'status', {
                    key: `${server.id}::${file}::${s.service}`,
                    serverId: server.id,
                    state: s.state,
                });
            });
            safeSend(event.sender, 'status', {
                key: `${server.id}::${file}`,
                serverId: server.id,
                state: docker.aggregateState(services.map((s) => s.state)),
            });
        },
        () => {},
        HIGH
    );
}

// Ação docker: escopo 'all' (todos os projetos do servidor), 'project' ou
// 'service'. Valida composeFile/service contra a allowlist antes de agir.
ipcMain.on('docker:action', async (event, payload) => {
    const { groupId, serverId, scope, composeFile, service, action } = payload || {};
    let server;
    try {
        server = getDockerServer(groupId, serverId);
    } catch (e) {
        sendLog(event, 'error', '', '', `Docker: ${e.message}`);
        return;
    }

    let cache = discoveredByServer.get(serverId);
    if (!cache) {
        try {
            await discoverServer(server, HIGH);
            cache = discoveredByServer.get(serverId);
        } catch (e) {
            sendLog(event, 'error', server.host, '', `Falha ao descobrir projetos: ${e.message}`);
            return;
        }
    }

    let targets;
    if (scope === 'all') {
        targets = [...cache.files];
        if (!targets.length) {
            sendLog(event, 'warn', server.host, '', 'Nenhum projeto compose encontrado.');
            return;
        }
    } else if (scope === 'project' || scope === 'service') {
        if (!cache.files.has(composeFile)) {
            sendLog(event, 'error', server.host, '', 'Projeto desconhecido (fora da allowlist).');
            return;
        }
        targets = [composeFile];
    } else {
        sendLog(event, 'error', server.host, '', 'Escopo docker inválido.');
        return;
    }

    targets.forEach((file) => {
        const projName = docker.projectNameFromFile(file);
        let command;
        try {
            if (scope === 'service') {
                const svcSet = cache.services.get(file);
                if (!svcSet || !svcSet.has(service)) {
                    sendLog(event, 'error', server.host, projName, `Serviço desconhecido: ${service}`);
                    return;
                }
                command = docker.serviceCommand(file, service, action);
            } else {
                command = docker.projectCommand(file, action);
            }
        } catch (e) {
            sendLog(event, 'error', server.host, projName, `Comando inválido: ${e.message}`);
            return;
        }

        const label = scope === 'service' ? `${projName}/${service}` : projName;
        runner.schedule(
            server,
            command,
            (err, output) => {
                if (err) {
                    sendLog(event, 'error', server.host, label, `Falha (${action}): ${err.message}`);
                } else {
                    sendLog(event, classifyDockerOutput(output), server.host, label, `${action} → ${summarizeDockerOutput(output)}`);
                }
                refreshProjectStatus(event, server, file);
            },
            onRetry(event),
            HIGH
        );
    });
});

// ---- Streaming de logs (docker compose logs -f) ---------------------------

// Sessões de log ativas: sessionId -> { handle, sender }. Cada sessão é um
// canal SSH dedicado e de longa duração (fora do runner de concorrência).
const logSessions = new Map();
const MAX_LOG_SESSIONS = 3;

function closeLogSession(sessionId) {
    const s = logSessions.get(sessionId);
    if (!s) return;
    logSessions.delete(sessionId);
    s.batch.cancel();
    try {
        s.handle.close();
    } catch (_) {
        /* ignora */
    }
}

function closeAllLogSessions() {
    for (const id of [...logSessions.keys()]) closeLogSession(id);
}

// Abre uma sessão de streaming genérica (docker ou windows). Emite nos canais
// neutros `logs:data`/`logs:end` correlacionados por sessionId. Retorna { sessionId }.
function startLogSession(event, server, command) {
    // Fecha a sessão mais antiga se estourar o limite (mantém o app leve).
    while (logSessions.size >= MAX_LOG_SESSIONS) {
        closeLogSession(logSessions.keys().next().value);
    }

    const sessionId = crypto.randomUUID();
    const sender = event.sender;
    // Agrupa os chunks (no Windows chega ~1 linha por chunk) em poucas mensagens IPC.
    const batch = createChunkCoalescer((chunk) => {
        if (!sender.isDestroyed()) sender.send('logs:data', { sessionId, chunk });
    });

    const handle = openStream(
        server,
        command,
        {
            onData: (chunk) => batch.push(chunk),
            onClose: () => {
                logSessions.delete(sessionId);
                batch.flush();
                if (!sender.isDestroyed()) sender.send('logs:end', { sessionId, reason: 'closed' });
            },
            onError: (err) => {
                logSessions.delete(sessionId);
                batch.flush();
                if (!sender.isDestroyed()) {
                    sender.send('logs:end', { sessionId, reason: 'error', message: err.message });
                }
            },
        },
        hostKeyStore
    );

    logSessions.set(sessionId, { handle, sender, batch });
    return { sessionId };
}

// Logs docker: valida composeFile/service contra a allowlist descoberta (igual
// ao docker:action) e faz o streaming de `docker compose logs -f`.
ipcMain.handle('docker:logs:start', async (event, payload) => {
    const { groupId, serverId, composeFile, service, tail } = payload || {};
    const server = getDockerServer(groupId, serverId);

    let cache = discoveredByServer.get(serverId);
    if (!cache) {
        await discoverServer(server, HIGH);
        cache = discoveredByServer.get(serverId);
    }
    if (!cache || !cache.files.has(composeFile)) {
        throw new Error('Projeto desconhecido (fora da allowlist).');
    }
    if (service) {
        const svcSet = cache.services.get(composeFile);
        if (!svcSet || !svcSet.has(service)) {
            throw new Error(`Serviço desconhecido: ${service}`);
        }
    }

    return startLogSession(event, server, docker.logsCommand(composeFile, service, tail));
});

// Logs de serviço Windows: faz o *tail -f* de <pasta>\console.log numa ÚNICA
// conexão SSH. Se o caminho estiver salvo, usa direto; senão, o próprio comando
// remoto descobre a pasta pelo nome do serviço (ImagePath) e tail-a no mesmo
// PowerShell — sem abrir conexão extra (evita fila no runner e ECONNRESET).
ipcMain.handle('service:logs:start', (event, payload) => {
    const { groupId, serverId, tail } = payload || {};
    const server = vault.getGroupServers(groupId).find((s) => s.id === serverId);
    if (!server) throw new Error('Servidor não encontrado.');
    if ((server.type || 'windows') !== 'windows') throw new Error('Servidor não é do tipo Windows.');

    let command;
    if (server.servicePath && vault.isValidWindowsPath(server.servicePath)) {
        command = serviceLogCommand(server.servicePath, tail);
    } else if (vault.isValidServiceName(server.serviceName)) {
        command = serviceLogAutoCommand(server.serviceName, tail);
    } else {
        throw new Error('Caminho do serviço não configurado e nome de serviço inválido para detecção automática.');
    }

    return startLogSession(event, server, command);
});

ipcMain.on('logs:stop', (_e, payload) => {
    const sessionId = payload && payload.sessionId;
    if (sessionId) closeLogSession(sessionId);
});

// Salva o conteúdo de log atualmente exibido em um arquivo escolhido pelo
// usuário (diálogo nativo "Salvar como"). Espelha o padrão de 'import:file'.
ipcMain.handle('logs:save', async (_e, payload) => {
    const { defaultName, content } = payload || {};
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Salvar log',
        defaultPath: defaultName || 'logs.log',
        filters: [
            { name: 'Arquivo de log', extensions: ['log'] },
            { name: 'Texto', extensions: ['txt'] },
            { name: 'Todos os arquivos', extensions: ['*'] },
        ],
    });
    if (result.canceled || !result.filePath) {
        return { canceled: true };
    }
    try {
        fs.writeFileSync(result.filePath, String(content == null ? '' : content), 'utf-8');
        return { canceled: false, filePath: result.filePath };
    } catch (e) {
        return { canceled: false, error: e.message };
    }
});
