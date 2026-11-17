// Pool de conexões SSH persistentes.
//
// Em vez de abrir uma conexão por comando (TCP + troca de chaves + autenticação
// a cada `sc query` — lento com usuário de domínio no Windows), mantém UMA
// conexão por identidade (usuário@host:porta + senha) e executa vários comandos
// nela em canais paralelos (limite `maxChannelsPerConn`; o MaxSessions padrão
// do OpenSSH é 10). A conexão é aberta sob demanda e fechada após `idleMs` sem uso.
//
// Garantias:
//  - cada callback de exec é chamado exatamente UMA vez (e sempre de forma assíncrona);
//  - queda da conexão falha todos os pedidos dela com erro transitório (o retry
//    do runner reconecta numa conexão nova);
//  - erros do socket depois de um encerramento intencional (ex.: o RST/ECONNRESET
//    que o sshd do Windows envia ao fecharmos) são apenas registrados;
//  - falha de autenticação não é refeita e entra em cooldown (evita bloquear a
//    conta no AD com tentativas repetidas a cada ciclo de polling).

const crypto = require('crypto');
const { Client } = require('ssh2');
const { hostVerifierFor } = require('./index');
const { normalizePort } = require('./vault');

// Canal recusado pelo servidor (ex.: MaxSessions) ou sem canal local livre.
const CHANNEL_REFUSED_RE = /Channel open failure|No free channels/i;

// Rótulo legível da conexão (para logs; sem senha).
function connectionLabel(server) {
    return `${server.username}@${server.host}:${normalizePort(server.port)}`;
}

// Identidade da conexão. Inclui um hash da senha (só em memória) para que editar
// a senha de um servidor não reaproveite uma sessão autenticada com a antiga.
function connectionKey(server) {
    const pw = crypto.createHash('sha256').update(String(server.password || '')).digest('hex').slice(0, 16);
    return `${connectionLabel(server)}#${pw}`;
}

function isAuthError(err) {
    return Boolean(err && err.level === 'client-authentication');
}

/**
 * @param opts.hostKeyStore        store de host keys (verificação anti-MITM / TOFU)
 * @param opts.maxChannelsPerConn  canais simultâneos por conexão (default 4)
 * @param opts.idleMs              fecha a conexão após esse tempo ociosa (default 60s)
 * @param opts.readyTimeout        tempo limite do handshake (default 20s)
 * @param opts.keepaliveInterval   intervalo de keepalive (default 10s)
 * @param opts.keepaliveCountMax   keepalives sem resposta até derrubar (default 3)
 * @param opts.authFailCooldownMs  pausa após falha de autenticação (default 5min)
 * @param opts.createClient        fábrica do Client ssh2 (injetável p/ testes)
 * @param opts.logger              destino dos logs (default console)
 * @returns { exec, closeAll, stats }
 */
function createConnectionPool(opts = {}) {
    const hostKeyStore = opts.hostKeyStore;
    const maxChannelsPerConn = opts.maxChannelsPerConn || 4;
    const idleMs = opts.idleMs != null ? opts.idleMs : 60000;
    const readyTimeout = opts.readyTimeout || 20000;
    const keepaliveInterval = opts.keepaliveInterval != null ? opts.keepaliveInterval : 10000;
    const keepaliveCountMax = opts.keepaliveCountMax != null ? opts.keepaliveCountMax : 3;
    const authFailCooldownMs = opts.authFailCooldownMs != null ? opts.authFailCooldownMs : 300000;
    const createClient = opts.createClient || (() => new Client());
    const logger = opts.logger || console;

    const entries = new Map(); // identidade -> conexão ativa (connecting | ready)
    const authFailures = new Map(); // identidade -> { at, until }
    let connectsTotal = 0;
    let connectFailures = 0;

    function log(level, message) {
        const fn = logger[level] || logger.log;
        try {
            fn.call(logger, message);
        } catch (_) {
            /* log nunca derruba o pool */
        }
    }

    // ---- Pedidos (jobs) ----------------------------------------------------

    // Responde o pedido uma única vez, sempre de forma assíncrona.
    function settle(job, err, output) {
        if (job.settled) return;
        job.settled = true;
        if (job.timer) {
            clearTimeout(job.timer);
            job.timer = null;
        }
        setImmediate(() => {
            try {
                job.callback(err, output);
            } catch (e) {
                log('error', `[ssh] erro no callback do comando: ${(e && e.stack) || e}`);
            }
        });
    }

    // Libera o canal ocupado pelo pedido (separado do settle: num timeout o
    // pedido é respondido na hora, mas o canal só volta quando de fato fechar).
    function releaseSlot(entry, job) {
        if (!job.slotHeld) return;
        job.slotHeld = false;
        entry.active--;
        entry.inflight.delete(job);
        if (entry.state === 'ready') {
            pump(entry);
            armIdleIfIdle(entry);
        }
    }

    function failAll(entry, err) {
        for (const job of entry.inflight) {
            job.slotHeld = false;
            settle(job, err);
        }
        entry.inflight.clear();
        entry.active = 0;
        const queued = entry.queue.high.concat(entry.queue.normal);
        entry.queue.high = [];
        entry.queue.normal = [];
        queued.forEach((job) => settle(job, err));
    }

    // ---- Ciclo de vida da conexão -------------------------------------------

    function clearTimers(entry) {
        if (entry.idleTimer) {
            clearTimeout(entry.idleTimer);
            entry.idleTimer = null;
        }
        if (entry.closeTimer) {
            clearTimeout(entry.closeTimer);
            entry.closeTimer = null;
        }
    }

    function createEntry(key, server) {
        const entry = {
            key,
            label: connectionLabel(server),
            server: { ...server },
            client: null,
            state: 'connecting', // connecting → ready → closing → dead
            cap: maxChannelsPerConn,
            active: 0,
            queue: { high: [], normal: [] },
            inflight: new Set(),
            idleTimer: null,
            closeTimer: null,
            openedAt: Date.now(),
            reason: '',
        };
        entries.set(key, entry);
        connectsTotal++;
        return entry;
    }

    function beginConnect(entry) {
        const { server } = entry;
        try {
            const client = createClient();
            entry.client = client;
            client
                .on('ready', () => onReady(entry))
                .on('error', (err) => onConnError(entry, err))
                .on('close', () => onConnClose(entry))
                // Servidores com PAM oferecem keyboard-interactive em vez de password
                // puro: respondemos cada prompt com a senha (igual ao executeRemoteCommand).
                .on('keyboard-interactive', (_name, _instr, _lang, prompts, finish) => {
                    finish(prompts.map(() => server.password || ''));
                });
            client.connect({
                host: server.host,
                port: normalizePort(server.port),
                username: server.username,
                password: server.password,
                tryKeyboard: true,
                readyTimeout,
                keepaliveInterval,
                keepaliveCountMax,
                hostVerifier: hostVerifierFor(server, hostKeyStore),
            });
        } catch (e) {
            markDead(entry, e);
        }
    }

    function onReady(entry) {
        if (entry.state === 'closing') {
            // fechada (closeAll) enquanto conectava: encerra agora que há socket
            try {
                entry.client.end();
            } catch (_) {
                /* ignora */
            }
            return;
        }
        if (entry.state !== 'connecting') return;
        entry.state = 'ready';
        log('log', `[ssh] conectado ${entry.label} em ${Date.now() - entry.openedAt}ms.`);
        pump(entry);
        armIdleIfIdle(entry);
    }

    function onConnError(entry, err) {
        if (entry.state === 'closing' || entry.state === 'dead') {
            // Ex.: o sshd do Windows reseta o TCP (ECONNRESET) quando encerramos.
            log('debug', `[ssh] ${entry.label}: ${err.message} após encerramento da conexão (ignorado).`);
            return;
        }
        const busy = entry.inflight.size + entry.queue.high.length + entry.queue.normal.length;
        const phase = entry.state === 'connecting' ? 'handshake' : busy ? `execução, ${busy} pedido(s)` : 'ociosa';
        log(phase === 'ociosa' ? 'warn' : 'error', `Erro na conexão SSH com ${entry.label} (fase: ${phase}): ${err.message}`);
        if (entry.state === 'connecting') {
            connectFailures++;
            if (isAuthError(err)) {
                authFailures.set(entry.key, { at: Date.now(), until: Date.now() + authFailCooldownMs });
            }
        } else {
            // a conexão caiu depois de pronta: vale reconectar e tentar de novo
            err.transient = true;
        }
        markDead(entry, err);
    }

    function onConnClose(entry) {
        if (entry.closeTimer) {
            clearTimeout(entry.closeTimer);
            entry.closeTimer = null;
        }
        if (entry.state === 'dead') return;
        if (entry.state === 'closing') {
            entry.state = 'dead';
            failAll(entry, Object.assign(new Error(`Conexão SSH encerrada (${entry.reason}).`), { code: 'EPOOLCLOSED' }));
            return;
        }
        // Fechou sem erro prévio (servidor encerrou, keepalive…)
        log('warn', `[ssh] ${entry.label}: conexão encerrada pelo servidor.`);
        markDead(
            entry,
            Object.assign(new Error('Conexão SSH encerrada pelo servidor.'), { code: 'ESSHCLOSED', transient: true })
        );
    }

    // Conexão inutilizável: sai do mapa, falha tudo o que dependia dela e é destruída.
    function markDead(entry, err) {
        if (entry.state === 'dead') return;
        entry.state = 'dead';
        if (entries.get(entry.key) === entry) entries.delete(entry.key);
        clearTimers(entry);
        failAll(entry, err);
        try {
            if (entry.client) entry.client.destroy();
        } catch (_) {
            /* ignora */
        }
    }

    // Encerramento intencional (ocioso / app fechando).
    function closeEntry(entry, reason) {
        if (entry.state === 'closing' || entry.state === 'dead') return;
        entry.state = 'closing';
        entry.reason = reason;
        if (entries.get(entry.key) === entry) entries.delete(entry.key);
        clearTimers(entry);
        const err = Object.assign(new Error(`Conexão SSH encerrada (${reason}).`), { code: 'EPOOLCLOSED' });
        const queued = entry.queue.high.concat(entry.queue.normal);
        entry.queue.high = [];
        entry.queue.normal = [];
        queued.forEach((job) => settle(job, err));
        // os pedidos em andamento falham no 'close' da conexão
        try {
            entry.client.end();
        } catch (_) {
            /* ignora */
        }
        entry.closeTimer = setTimeout(() => {
            entry.closeTimer = null;
            try {
                entry.client.destroy();
            } catch (_) {
                /* ignora */
            }
        }, 2000);
        if (entry.closeTimer.unref) entry.closeTimer.unref();
    }

    function armIdleIfIdle(entry) {
        if (entry.state !== 'ready' || entry.idleTimer) return;
        if (entry.active > 0 || entry.queue.high.length || entry.queue.normal.length) return;
        entry.idleTimer = setTimeout(() => {
            entry.idleTimer = null;
            closeEntry(entry, 'ociosa');
        }, idleMs);
        if (entry.idleTimer.unref) entry.idleTimer.unref();
    }

    // ---- Execução -----------------------------------------------------------

    function pump(entry) {
        while (entry.state === 'ready' && entry.active < entry.cap) {
            const job = entry.queue.high.shift() || entry.queue.normal.shift();
            if (!job) break;
            if (job.settled) continue;
            start(entry, job);
        }
    }

    function start(entry, job) {
        entry.active++;
        entry.inflight.add(job);
        job.slotHeld = true;
        if (job.timeoutMs > 0) {
            job.timer = setTimeout(() => {
                job.timer = null;
                settle(job, Object.assign(new Error(`Tempo limite de ${job.timeoutMs}ms excedido.`), { code: 'ETIMEDOUT' }));
                // o canal (se já aberto) é fechado; o slot volta no 'close'
                if (job.stream) {
                    try {
                        job.stream.close();
                    } catch (_) {
                        /* ignora */
                    }
                }
            }, job.timeoutMs);
        }

        let output = '';
        try {
            entry.client.exec(job.command, (err, stream) => {
                if (err) {
                    if (CHANNEL_REFUSED_RE.test(err.message || '')) {
                        // Servidor recusou o canal (ex.: MaxSessions baixo): mantém a
                        // conexão, reduz o paralelismo e deixa o runner tentar de novo.
                        err.transient = true;
                        entry.cap = Math.max(1, entry.active - 1);
                        log('warn', `[ssh] ${entry.label}: canal recusado (${err.message}); limite reduzido para ${entry.cap}.`);
                    }
                    releaseSlot(entry, job);
                    settle(job, err);
                    return;
                }
                job.stream = stream;
                // 'data' é anexado já: o 'close' do canal só vem após o 'end' (stream fluindo)
                stream
                    .on('data', (data) => {
                        output += data.toString();
                    })
                    .on('error', (e) => settle(job, e))
                    .on('close', () => {
                        releaseSlot(entry, job);
                        settle(job, null, output.trim());
                    });
                stream.stderr.on('data', (data) => {
                    log('error', `Erro em ${entry.server.host}: ${data.toString()}`);
                });
                if (job.settled) {
                    // estourou o tempo antes do canal abrir
                    try {
                        stream.close();
                    } catch (_) {
                        /* ignora */
                    }
                }
            });
        } catch (e) {
            // ex.: "Not connected" — o socket morreu sem avisarmos ainda
            e.transient = true;
            markDead(entry, e);
        }
    }

    /**
     * Executa um comando na conexão persistente da identidade do servidor.
     * Mesma assinatura posicional de executeRemoteCommand (encaixa no runner).
     * @param execOpts.priority  'high' | 'normal'
     * @param execOpts.timeoutMs tempo limite do comando (0 = sem limite)
     */
    function exec(server, command, callback, _hostKeyStore, execOpts = {}) {
        const job = {
            command,
            callback,
            priority: execOpts.priority === 'high' ? 'high' : 'normal',
            timeoutMs: execOpts.timeoutMs || 0,
            settled: false,
            slotHeld: false,
            stream: null,
            timer: null,
        };
        const key = connectionKey(server);

        const fail = authFailures.get(key);
        if (fail) {
            const now = Date.now();
            if (now < fail.until) {
                const err = new Error(
                    `Autenticação SSH falhou há ${Math.round((now - fail.at) / 1000)}s para ${connectionLabel(server)}; ` +
                        `verifique usuário/senha (nova tentativa automática em ${Math.ceil((fail.until - now) / 1000)}s).`
                );
                err.level = 'client-authentication';
                settle(job, err);
                return;
            }
            authFailures.delete(key);
        }

        let entry = entries.get(key);
        const isNew = !entry;
        if (isNew) entry = createEntry(key, server);
        if (entry.idleTimer) {
            clearTimeout(entry.idleTimer);
            entry.idleTimer = null;
        }
        (job.priority === 'high' ? entry.queue.high : entry.queue.normal).push(job);
        if (isNew) beginConnect(entry);
        else pump(entry);
    }

    function closeAll(reason = 'encerramento') {
        [...entries.values()].forEach((entry) => closeEntry(entry, reason));
    }

    function stats() {
        let activeChannels = 0;
        let queued = 0;
        entries.forEach((e) => {
            activeChannels += e.active;
            queued += e.queue.high.length + e.queue.normal.length;
        });
        return { connectsTotal, connectFailures, open: entries.size, activeChannels, queued };
    }

    return { exec, closeAll, stats };
}

module.exports = { createConnectionPool, connectionKey, connectionLabel };
