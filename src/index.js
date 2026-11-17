const { Client } = require('ssh2');
const crypto = require('crypto');
const { StringDecoder } = require('string_decoder');
const ini = require('ini');
const { normalizePort, isValidServiceName } = require('./vault');

// ---- Parsers de importação -------------------------------------------------

// Converte o objeto de configuração (formato .ini) numa lista de servidores.
function serversFromConfigObject(config) {
    return Object.keys(config)
        .map((key) => config[key])
        .filter((entry) => entry && typeof entry === 'object' && entry.host)
        .map((entry) => ({
            host: entry.host,
            port: normalizePort(entry.port),
            username: entry.username,
            password: entry.password,
            serviceName: entry.serviceName,
        }));
}

function parseServersFromIni(content) {
    const config = ini.parse(content);
    return serversFromConfigObject(config);
}

// Aceita: array de servidores, objeto no shape {groups:[...]} ou objeto tipo .ini
function parseServersFromJson(content) {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
        return data.filter((s) => s && s.host).map((s) => ({
            host: s.host,
            port: normalizePort(s.port),
            username: s.username,
            password: s.password,
            serviceName: s.serviceName,
        }));
    }
    if (data && Array.isArray(data.groups)) {
        // achata todos os grupos numa única lista de servidores
        return data.groups
            .flatMap((g) => (Array.isArray(g.servers) ? g.servers : []))
            .filter((s) => s && s.host)
            .map((s) => ({
                host: s.host,
                port: normalizePort(s.port),
                username: s.username,
                password: s.password,
                serviceName: s.serviceName,
            }));
    }
    if (data && typeof data === 'object') {
        return serversFromConfigObject(data);
    }
    return [];
}

// ---- Execução remota via SSH (com verificação de host key) -----------------

// Calcula o fingerprint SHA256 da chave do host, no formato "SHA256:base64".
function fingerprintOf(key) {
    const hash = crypto.createHash('sha256').update(key).digest('base64').replace(/=+$/, '');
    return `SHA256:${hash}`;
}

// Verificação anti-MITM (TOFU): confia na 1ª conexão e registra a chave; rejeita
// se a chave do host mudar depois. Compartilhado por executeRemoteCommand e openStream.
function hostVerifierFor(serverConfig, hostKeyStore) {
    return (key) => {
        if (!hostKeyStore) return true; // sem store: comportamento legado
        const fp = fingerprintOf(key);
        const known = hostKeyStore.get(serverConfig.host, serverConfig.port);
        if (!known) {
            hostKeyStore.set(serverConfig.host, serverConfig.port, fp);
            console.log(`Host key registrada para ${serverConfig.host}: ${fp}`);
            return true;
        }
        if (known === fp) return true;
        console.error(
            `HOST KEY DIVERGENTE para ${serverConfig.host}! Esperado ${known}, recebido ${fp}. Conexão rejeitada (possível MITM).`
        );
        return false;
    };
}

/**
 * Executa um comando remoto via SSH numa conexão dedicada (abre, executa, fecha).
 * O app usa o pool (sshPool.js); esta função segue como exec padrão do runner.
 * @param serverConfig { host, port, username, password, serviceName }
 * @param command comando já montado
 * @param callback (err, output) — chamado UMA única vez
 * @param hostKeyStore { get(host,port), set(host,port,fp) } para TOFU anti-MITM
 * @param opts.createClient fábrica do Client ssh2 (injetável p/ testes)
 */
function executeRemoteCommand(serverConfig, command, callback, hostKeyStore, opts = {}) {
    console.log(`Conectando a ${serverConfig.host}...`);
    const conn = opts.createClient ? opts.createClient() : new Client();

    // Fase atual: o log de erro diz ONDE a conexão caiu. O sshd do Windows
    // costuma resetar o TCP (ECONNRESET) depois do fim do comando, quando
    // encerramos a conexão — nesse caso o erro é inofensivo e só é registrado.
    let phase = 'conexão';
    let done = false;
    const finish = (err, output) => {
        if (done) return;
        done = true;
        phase = 'concluído';
        callback(err, output);
    };

    conn
        .on('ready', () => {
            phase = 'execução';
            console.log(`Conexão SSH estabelecida com ${serverConfig.host}.`);
            conn.exec(command, (err, stream) => {
                if (err) {
                    finish(err);
                    conn.end();
                    return;
                }
                let output = '';
                stream
                    .on('close', () => {
                        finish(null, output.trim());
                        conn.end();
                    })
                    .on('data', (data) => {
                        output += data.toString();
                    })
                    .stderr.on('data', (data) => {
                        console.error(`Erro em ${serverConfig.host}:`, data.toString());
                    });
            });
        })
        .on('error', (err) => {
            if (done) {
                console.warn(`[ssh] ${serverConfig.host}: ${err.message} após a conclusão do comando (ignorado).`);
                return;
            }
            console.error(`Erro na conexão SSH com ${serverConfig.host} (fase: ${phase}):`, err.message);
            finish(err);
        })
        // O ssh2 emite o 'close' do Client ANTES de fechar os canais: se o
        // comando ainda não terminou, a saída parcial NÃO pode virar sucesso.
        .on('close', () => {
            finish(Object.assign(new Error('Conexão SSH encerrada antes do fim do comando.'), { transient: true }));
        })
        // Servidores com PAM oferecem keyboard-interactive em vez de password puro.
        // Respondemos cada prompt com a senha (mesmo comportamento do cliente OpenSSH).
        .on('keyboard-interactive', (_name, _instr, _lang, prompts, finish) => {
            finish(prompts.map(() => serverConfig.password || ''));
        })
        .connect({
            host: serverConfig.host,
            port: normalizePort(serverConfig.port),
            username: serverConfig.username,
            password: serverConfig.password,
            tryKeyboard: true,
            readyTimeout: 20000,
            keepaliveInterval: 10000,
            hostVerifier: hostVerifierFor(serverConfig, hostKeyStore),
        });
}

/**
 * Agrupa pedaços de texto de alta frequência (ex.: 1 linha por chunk no tail
 * do console.log) e entrega um único bloco a cada `intervalMs`. Evita inundar
 * o renderer com centenas de mensagens IPC por segundo. Se acumular mais que
 * `maxChars` entre entregas, mantém só o final (o painel podaria o resto).
 *
 * @param emit (text:string) => void
 * @returns { push(text), flush(), cancel() }
 */
function createChunkCoalescer(emit, { intervalMs = 80, maxChars = 1000000 } = {}) {
    let parts = [];
    let size = 0;
    let timer = null;

    function flush() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        if (!parts.length) return;
        const text = parts.join('');
        parts = [];
        size = 0;
        emit(text);
    }

    return {
        push(text) {
            if (!text) return;
            parts.push(text);
            size += text.length;
            if (size > maxChars * 2) {
                const tail = parts.join('').slice(-maxChars);
                parts = [tail];
                size = tail.length;
            }
            if (!timer) timer = setTimeout(flush, intervalMs);
        },
        flush,
        cancel() {
            if (timer) clearTimeout(timer);
            timer = null;
            parts = [];
            size = 0;
        },
    };
}

/**
 * Abre um canal SSH de longa duração para comandos de STREAMING (ex.:
 * `docker compose logs -f`). Diferente de executeRemoteCommand, NÃO acumula a
 * saída nem chama um callback único no fim: encaminha cada pedaço via
 * handlers.onData e fica aberto até handle.close() (ou o processo remoto morrer).
 *
 * NÃO passa pelo runner de concorrência (seguraria um slot indefinidamente).
 *
 * @param serverConfig { host, port, username, password }
 * @param command comando já montado (ex.: docker.logsCommand(...))
 * @param handlers { onData(chunk:string), onClose(), onError(err) }
 * @param hostKeyStore store de host keys (verificação anti-MITM)
 * @returns { close() } encerra o stream e a conexão
 */
function openStream(serverConfig, command, handlers, hostKeyStore) {
    const onData = (handlers && handlers.onData) || (() => {});
    const onClose = (handlers && handlers.onClose) || (() => {});
    const onError = (handlers && handlers.onError) || (() => {});

    const conn = new Client();
    let activeStream = null;
    let closed = false;

    function cleanup() {
        try {
            if (activeStream) activeStream.close();
        } catch (_) {
            /* ignora */
        }
        try {
            conn.end();
        } catch (_) {
            /* ignora */
        }
    }

    conn
        .on('ready', () => {
            conn.exec(command, (err, stream) => {
                if (err) {
                    if (!closed) onError(err);
                    cleanup();
                    return;
                }
                activeStream = stream;
                // Decodificador por canal: um caractere UTF-8 (ç, ã…) pode vir
                // partido entre dois pacotes; toString() isolado viraria "�".
                const outDecoder = new StringDecoder('utf8');
                const errDecoder = new StringDecoder('utf8');
                stream
                    .on('close', () => {
                        if (!closed) {
                            closed = true;
                            onClose();
                        }
                        conn.end();
                    })
                    .on('data', (data) => onData(outDecoder.write(data)))
                    .stderr.on('data', (data) => onData(errDecoder.write(data)));
            });
        })
        .on('error', (err) => {
            if (!closed) {
                closed = true;
                onError(err);
            }
        })
        // Idem executeRemoteCommand: suporta servidores PAM (keyboard-interactive).
        .on('keyboard-interactive', (_name, _instr, _lang, prompts, finish) => {
            finish(prompts.map(() => serverConfig.password || ''));
        })
        .connect({
            host: serverConfig.host,
            port: normalizePort(serverConfig.port),
            username: serverConfig.username,
            password: serverConfig.password,
            tryKeyboard: true,
            readyTimeout: 20000,
            keepaliveInterval: 10000,
            hostVerifier: hostVerifierFor(serverConfig, hostKeyStore),
        });

    return {
        close() {
            closed = true;
            cleanup();
        },
    };
}

// Normaliza o nº de linhas do tail: default 100, teto 5000.
function normalizeTail(tail) {
    return Number.isInteger(tail) && tail >= 0 ? Math.min(tail, 5000) : 100;
}

// Monta o comando de *tail -f* do console.log de um serviço Windows via
// PowerShell (independe do shell padrão do OpenSSH). `folder` já foi validado
// por vault.isValidWindowsPath antes de chegar aqui.
function serviceLogCommand(folder, tail) {
    const n = normalizeTail(tail);
    const dir = String(folder).replace(/[\\/]+$/, '');
    const full = (dir + '\\console.log').replace(/'/g, "''"); // escape defensivo p/ aspas simples do PS
    return `powershell -NoProfile -NonInteractive -Command "Get-Content -LiteralPath '${full}' -Tail ${n} -Wait -Encoding utf8"`;
}

// Igual ao serviceLogCommand, mas SEM caminho conhecido: descobre a pasta do
// serviço pelo nome e faz o tail na MESMA conexão (um único comando PowerShell),
// evitando um round-trip/conexão SSH extra. Lê a PathName (ImagePath) via CIM
// (neutro de idioma), extrai o diretório do executável e tail-a o console.log.
//
// Extração do exe robusta aos 3 formatos de ImagePath:
//   "C:\Program Files\app\appserver.exe" -service   (com aspas)
//   C:\Program Files\app\appserver.exe -service      (sem aspas, com espaço)
//   C:\app\appserver.exe -service                    (sem aspas, sem espaço)
// Quando há aspas, pega o conteúdo entre elas; senão, casa tudo até o primeiro
// ".exe" (não pode quebrar no espaço, senão "C:\Program Files\..." vira "C:\").
//
// `serviceName` já é validado por vault.isValidServiceName (proíbe aspas, `,
// $, ;, & etc.); ainda assim escapamos aspas simples defensivamente. Usamos
// [char]34 no lugar de aspas duplas literais para não fechar o -Command.
function serviceLogAutoCommand(serviceName, tail) {
    const n = normalizeTail(tail);
    const name = String(serviceName).replace(/'/g, "''");
    const ps = [
        `$q=[char]34`,
        `$svc=Get-CimInstance Win32_Service | Where-Object Name -eq '${name}'`,
        `$p=if($svc){([string]$svc.PathName).Trim()}else{''}`,
        `if($p.StartsWith($q)){$exe=$p.Substring(1).Split($q)[0]}elseif($p -match '(?i)^(.+?\\.exe)\\b'){$exe=$matches[1]}else{$exe=($p -split ' ')[0]}`,
        `$dir=if($exe){Split-Path -Parent $exe}else{''}`,
        `if($dir){Get-Content -LiteralPath (Join-Path $dir 'console.log') -Tail ${n} -Wait -Encoding utf8}else{Write-Output 'Servico nao encontrado ou caminho de instalacao invalido.'}`,
    ].join('; ');
    return `powershell -NoProfile -NonInteractive -Command "${ps}"`;
}

// ---- Runner com concorrência limitada + serialização por host + retry ------

// Erros transitórios que valem uma nova tentativa (o sshd costuma resetar sob carga).
// Falha de autenticação nunca é refeita (evita bloquear a conta no AD).
const TRANSIENT_CODES = ['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNABORTED'];
function isTransientError(err) {
    if (!err) return false;
    if (err.level === 'client-authentication') return false;
    if (err.transient === true) return true;
    if (err.code && TRANSIENT_CODES.includes(err.code)) return true;
    return /ECONNRESET|timed out|timeout/i.test(err.message || '');
}

/**
 * Cria um agendador de comandos remotos que:
 *  - limita o total de execuções simultâneas (maxConcurrent);
 *  - serializa comandos da MESMA lane (por padrão, o mesmo serviço/servidor
 *    cadastrado — serviços diferentes no mesmo host rodam em paralelo, limitados
 *    pelos canais do pool de conexões);
 *  - atende primeiro a prioridade 'high' (ações do usuário passam à frente do polling);
 *  - reexecuta em erros transitórios com backoff.
 *
 * @param opts.maxConcurrent  máx. de execuções simultâneas (default 4)
 * @param opts.retries        tentativas extras em erro transitório (default 2)
 * @param opts.retryDelayMs   base do backoff linear (default 800ms)
 * @param opts.hostKeyStore   store de host keys (verificação anti-MITM)
 * @param opts.exec           função de execução (injetável p/ testes); default executeRemoteCommand
 */
function createRemoteRunner(opts = {}) {
    const maxConcurrent = opts.maxConcurrent || 4;
    const retries = opts.retries != null ? opts.retries : 2;
    const retryDelayMs = opts.retryDelayMs != null ? opts.retryDelayMs : 800;
    const hostKeyStore = opts.hostKeyStore;
    const exec = opts.exec || executeRemoteCommand;

    let active = 0;
    const waiting = { high: [], normal: [] };
    const laneChains = new Map(); // lane -> Promise (encadeia por lane)

    function acquireSlot(priority) {
        if (active < maxConcurrent) {
            active++;
            return Promise.resolve();
        }
        const queue = priority === 'high' ? waiting.high : waiting.normal;
        return new Promise((resolve) => queue.push(resolve));
    }
    function releaseSlot() {
        active--;
        const next = waiting.high.shift() || waiting.normal.shift();
        if (next) {
            active++;
            next();
        }
    }

    function runOnce(server, command, execOpts) {
        return new Promise((resolve) => {
            exec(server, command, (err, output) => resolve({ err, output }), hostKeyStore, execOpts);
        });
    }

    async function withRetry(server, command, onRetry, execOpts, maxRetries) {
        let attempt = 0;
        for (;;) {
            const { err, output } = await runOnce(server, command, execOpts);
            if (!err || !isTransientError(err) || attempt >= maxRetries) return { err, output };
            attempt++;
            if (typeof onRetry === 'function') onRetry(server, attempt, err);
            await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
        }
    }

    function laneOf(server, lane) {
        if (lane) return lane;
        if (server.id) return `srv:${server.id}`;
        return `${server.host}:${normalizePort(server.port)}`;
    }

    /**
     * Agenda um comando. `callback(err, output)` é chamado uma única vez ao final.
     * `onRetry(server, attempt, err)` (opcional) é chamado a cada nova tentativa.
     * @param opts.priority  'high' | 'normal' (default)
     * @param opts.lane      chave de serialização (default: servidor cadastrado)
     * @param opts.timeoutMs tempo limite repassado ao exec (0 = sem limite)
     * @param opts.retries   sobrescreve o nº de tentativas extras
     */
    function schedule(server, command, callback, onRetry, opts = {}) {
        const priority = opts.priority === 'high' ? 'high' : 'normal';
        const maxRetries = opts.retries != null ? opts.retries : retries;
        const execOpts = { priority, timeoutMs: opts.timeoutMs || 0 };
        const key = laneOf(server, opts.lane);
        const prev = laneChains.get(key) || Promise.resolve();
        const run = prev.then(async () => {
            await acquireSlot(priority);
            try {
                const { err, output } = await withRetry(server, command, onRetry, execOpts, maxRetries);
                try {
                    callback(err, output);
                } catch (e) {
                    console.error('Erro no callback do comando remoto:', e);
                }
            } finally {
                releaseSlot();
            }
        });
        // mantém a cadeia da lane mesmo se algo falhar (não quebra próximas chamadas)
        const tail = run.catch(() => {});
        laneChains.set(key, tail);
        // remove a lane ao terminar, se ninguém entrou na fila depois (evita crescer sem limite)
        tail.then(() => {
            if (laneChains.get(key) === tail) laneChains.delete(key);
        });
        return run;
    }

    function stats() {
        return {
            active,
            waitingHigh: waiting.high.length,
            waitingNormal: waiting.normal.length,
            lanes: laneChains.size,
        };
    }

    return { schedule, stats };
}

module.exports = {
    executeRemoteCommand,
    hostVerifierFor,
    openStream,
    serviceLogCommand,
    serviceLogAutoCommand,
    createChunkCoalescer,
    createRemoteRunner,
    isTransientError,
    parseServersFromIni,
    parseServersFromJson,
    fingerprintOf,
    summarizeScOutput,
    parseServiceState,
    scQueryBatchCommand,
    chunkScQueryBatch,
    parseScQueryBatch,
    scBatchHasMarkers,
};

// Resumir saída do comando `sc` para mensagens mais enxutas
function summarizeScOutput(output) {
    if (!output) return '';
    const low = output.toLowerCase();

    const failedMatch = output.match(/StartService\s+FAILED\s+(\d+)/i);
    if (failedMatch) {
        const code = failedMatch[1];
        if (code === '1056') return `Falha ${code}: já em execução`;
        return `Falha ${code}`;
    }

    if (low.includes('uma cópia deste servi') || (low.includes('already') && low.includes('running'))) {
        return 'Já em execução';
    }

    const pidMatch = output.match(/PID\s*[:|]?\s*(\d+)/i);
    if (pidMatch) return `OK (PID ${pidMatch[1]})`;

    if (low.includes('start_pending') || low.includes('estado') || low.includes('tipo')) {
        return 'OK';
    }

    // fallback: primeira linha limpa (limitada)
    const firstLine = output.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0] || '';
    return firstLine.length > 200 ? firstLine.slice(0, 200) + '...' : firstLine;
}

// Extrai o estado do serviço a partir da saída de `sc query`.
// Usa o CÓDIGO NUMÉRICO do estado (confiável em qualquer idioma do Windows;
// pt-BR imprime "ESTADO", en-US imprime "STATE"):
//   1 STOPPED · 2 START_PENDING · 3 STOP_PENDING · 4 RUNNING · 5-7 (continua/pausa)
function parseServiceState(output) {
    if (!output) return 'unknown';
    const m = output.match(/(?:STATE|ESTADO)\s*:\s*(\d+)/i);
    if (!m) return 'unknown';
    switch (m[1]) {
        case '4':
            return 'running';
        case '1':
            return 'stopped';
        case '2':
        case '3':
            return 'pending';
        default:
            return 'unknown';
    }
}

// ---- Consulta de status em lote (vários serviços numa única execução) ------
//
// Um único `cmd` consulta N serviços: antes de cada `sc query` é ecoado um
// marcador com o ÍNDICE do serviço (nunca o nome), e a saída é fatiada por esses
// marcadores. Os comandos são ligados com `&` (não `&&`) para que um serviço
// inexistente (erro 1060) não interrompa os seguintes. Pressupõe cmd.exe como
// shell padrão do OpenSSH — o mesmo que o `sc` avulso já pressupõe.

const SC_BATCH_MARKER_RE = /^@@SS(\d+)@@$/;

function scQueryBatchPart(name, index) {
    return `echo @@SS${index}@@ & sc query "${name}"`;
}

function scQueryBatchCommand(names) {
    if (!Array.isArray(names) || names.length === 0) {
        throw new Error('Lote de serviços vazio.');
    }
    return names
        .map((name, i) => {
            if (!isValidServiceName(name)) throw new Error(`Nome de serviço inválido: "${name}".`);
            return scQueryBatchPart(name, i);
        })
        .join(' & ');
}

// Divide a lista em lotes cujo comando cabe com folga no limite do cmd.exe
// (8191 caracteres). Preserva a ordem.
function chunkScQueryBatch(names, { maxChars = 6000, maxItems = 30 } = {}) {
    const chunks = [];
    let chunk = [];
    let length = 0;
    names.forEach((name) => {
        let partLen = scQueryBatchPart(name, chunk.length).length + (chunk.length ? 3 : 0); // ' & '
        if (chunk.length && (chunk.length >= maxItems || length + partLen > maxChars)) {
            chunks.push(chunk);
            chunk = [];
            length = 0;
            partLen = scQueryBatchPart(name, 0).length;
        }
        length += partLen;
        chunk.push(name);
    });
    if (chunk.length) chunks.push(chunk);
    return chunks;
}

// Fatia a saída do lote pelos marcadores e devolve o estado de cada serviço
// (mesma ordem do lote). Segmento ausente → 'unknown'.
function parseScQueryBatch(output, count) {
    const segments = new Array(count).fill(null);
    let current = -1;
    String(output || '')
        .split(/\r?\n/)
        .forEach((raw) => {
            const line = raw.trim();
            const m = line.match(SC_BATCH_MARKER_RE);
            if (m) {
                const idx = Number(m[1]);
                current = idx < count ? idx : -1;
                if (current >= 0) segments[current] = '';
                return;
            }
            if (current >= 0) segments[current] += line + '\n';
        });
    return segments.map((seg) => (seg == null ? 'unknown' : parseServiceState(seg)));
}

// Sem nenhum marcador na saída, o shell remoto não executou o lote (ex.: shell
// padrão PowerShell, onde `&` não encadeia comandos).
function scBatchHasMarkers(output) {
    return /^@@SS\d+@@\s*$/m.test(String(output || ''));
}
