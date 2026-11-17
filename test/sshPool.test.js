const test = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('node:events');
const { createConnectionPool, connectionKey } = require('../src/sshPool');
const { isTransientError } = require('../src/index');

const tick = () => new Promise((r) => setImmediate(r));
async function ticks(n = 6) {
    for (let i = 0; i < n; i++) await tick();
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const SRV = { host: '172.17.0.4', port: 22, username: 'usuario', password: 's3nha' };

const econnreset = () => Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' });

class FakeStream extends EventEmitter {
    constructor() {
        super();
        this.stderr = new EventEmitter();
        this.closeCalled = false;
    }
    finish(out) {
        if (out) this.emit('data', Buffer.from(out));
        this.emit('close', 0);
    }
    close() {
        this.closeCalled = true;
        setImmediate(() => this.emit('close'));
    }
}

// Client falso (mesma superfície usada do ssh2: connect/exec/end/destroy + eventos).
class FakeClient extends EventEmitter {
    constructor(scenario) {
        super();
        this.scenario = scenario;
        this.execs = [];
        this.ended = false;
        this.destroyed = false;
        this.dead = false;
    }
    connect(cfg) {
        this.cfg = cfg;
        setImmediate(() => {
            const err = this.scenario.connectError && this.scenario.connectError();
            if (err) {
                this.emit('error', err);
                this.emit('close');
                return;
            }
            this.emit('ready');
        });
        return this;
    }
    exec(cmd, cb) {
        if (this.ended || this.destroyed || this.dead || this.scenario.execThrows) {
            throw new Error('Not connected');
        }
        const stream = new FakeStream();
        this.execs.push({ cmd, cb, stream });
        if (this.scenario.refuse && this.scenario.refuse(cmd)) {
            setImmediate(() => cb(Object.assign(new Error('(SSH) Channel open failure: open failed'), { reason: 1 })));
            return;
        }
        setImmediate(() => cb(undefined, stream));
    }
    end() {
        if (this.ended) return;
        this.ended = true;
        setImmediate(() => {
            if (this.scenario.resetOnEnd) this.emit('error', econnreset()); // RST do sshd Windows
            this.emit('close');
        });
    }
    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        setImmediate(() => this.emit('close'));
    }
    // Queda do socket: 'error' → 'close' do Client → 'close' dos canais (ordem do ssh2)
    drop(err) {
        this.dead = true;
        this.emit('error', err);
        this.emit('close');
        this.execs.forEach((e) => e.stream.emit('close'));
    }
}

function fakeFactory(scenario = {}) {
    const clients = [];
    const createClient = () => {
        const c = new FakeClient(scenario);
        clients.push(c);
        return c;
    };
    return { clients, createClient };
}

function spyLogger() {
    const lines = { log: [], warn: [], error: [], debug: [] };
    const logger = { lines };
    Object.keys(lines).forEach((k) => {
        logger[k] = (...a) => lines[k].push(a.join(' '));
    });
    return logger;
}

function newPool(scenario, opts = {}) {
    const { clients, createClient } = fakeFactory(scenario);
    const logger = spyLogger();
    const pool = createConnectionPool({ createClient, logger, idleMs: 60000, ...opts });
    return { pool, clients, logger };
}

test('pool: N execs na mesma identidade usam 1 conexão (inclusive os pedidos durante o connecting)', async () => {
    const { pool, clients } = newPool({}, { maxChannelsPerConn: 8 });
    const results = [];
    for (let i = 0; i < 5; i++) pool.exec(SRV, `cmd${i}`, (err, out) => results.push([err, out]));
    await ticks();
    assert.strictEqual(clients.length, 1);
    assert.strictEqual(clients[0].execs.length, 5);
    clients[0].execs.forEach((e, i) => e.stream.finish(`out${i}\r\n`));
    await ticks();
    assert.deepStrictEqual(results, [0, 1, 2, 3, 4].map((i) => [null, `out${i}`]));
    assert.strictEqual(pool.stats().connectsTotal, 1);
    pool.closeAll();
});

test('pool: identidade = usuário@host:porta + senha; a chave não expõe a senha', async () => {
    const { pool, clients } = newPool();
    pool.exec(SRV, 'a', () => {});
    pool.exec({ ...SRV, password: 'outra' }, 'b', () => {});
    pool.exec({ ...SRV, port: 2222 }, 'c', () => {});
    pool.exec({ ...SRV, username: 'outro' }, 'd', () => {});
    pool.exec({ ...SRV }, 'e', () => {});
    await ticks();
    assert.strictEqual(clients.length, 4);
    assert.ok(!connectionKey(SRV).includes('s3nha'));
    assert.notStrictEqual(connectionKey(SRV), connectionKey({ ...SRV, password: 'outra' }));
    pool.closeAll();
});

test('pool: respeita o limite de canais e atende high antes de normal', async () => {
    const { pool, clients } = newPool({}, { maxChannelsPerConn: 4 });
    for (let i = 0; i < 6; i++) pool.exec(SRV, `n${i}`, () => {});
    await ticks();
    const c = clients[0];
    assert.deepStrictEqual(c.execs.map((e) => e.cmd), ['n0', 'n1', 'n2', 'n3']);
    // canais lotados: o pedido 'high' entra atrás de n4/n5, mas sai primeiro
    pool.exec(SRV, 'h', () => {}, null, { priority: 'high' });
    await ticks();
    assert.strictEqual(pool.stats().queued, 3);
    c.execs[0].stream.finish('');
    await ticks();
    assert.deepStrictEqual(c.execs.map((e) => e.cmd), ['n0', 'n1', 'n2', 'n3', 'h']);
    pool.closeAll();
});

test('pool: fecha a conexão ociosa e reconecta no próximo exec', async () => {
    const { pool, clients } = newPool({}, { idleMs: 20 });
    pool.exec(SRV, 'a', () => {});
    await ticks();
    clients[0].execs[0].stream.finish('ok');
    await wait(60);
    assert.ok(clients[0].ended, 'deveria ter encerrado a conexão ociosa');
    assert.strictEqual(pool.stats().open, 0);
    pool.exec(SRV, 'b', () => {});
    await ticks();
    assert.strictEqual(clients.length, 2);
    pool.closeAll();
});

test('pool: queda da conexão falha cada pedido UMA vez (transitório) e o próximo reconecta', async () => {
    const { pool, clients } = newPool({}, { maxChannelsPerConn: 3 });
    const calls = [];
    for (let i = 0; i < 5; i++) pool.exec(SRV, `c${i}`, (err, out) => calls.push({ i, err, out }));
    await ticks();
    assert.strictEqual(clients[0].execs.length, 3);
    clients[0].drop(econnreset());
    await ticks();
    assert.strictEqual(calls.length, 5);
    assert.ok(calls.every((c) => c.err && isTransientError(c.err)));
    // 'close' tardio dos canais não gera novo callback
    clients[0].execs.forEach((e) => e.stream.emit('close'));
    await ticks();
    assert.strictEqual(calls.length, 5);

    pool.exec(SRV, 'novo', () => {});
    await ticks();
    assert.strictEqual(clients.length, 2);
    pool.closeAll();
});

test('pool: ECONNRESET após encerramento intencional é ignorado (sem callback, sem log de erro)', async () => {
    const { pool, clients, logger } = newPool({ resetOnEnd: true }, { idleMs: 20 });
    const calls = [];
    pool.exec(SRV, 'a', (err, out) => calls.push({ err, out }));
    await ticks();
    clients[0].execs[0].stream.finish('ok');
    await wait(60);
    assert.ok(clients[0].ended);
    assert.deepStrictEqual(calls, [{ err: null, out: 'ok' }]);
    assert.deepStrictEqual(logger.lines.error, []);
    assert.ok(logger.lines.debug.some((l) => /ECONNRESET.*ignorado/.test(l)));
});

test('pool: falha de autenticação não é transitória e entra em cooldown (sem nova tentativa)', async () => {
    const authErr = () =>
        Object.assign(new Error('All configured authentication methods failed'), { level: 'client-authentication' });
    const { pool, clients } = newPool({ connectError: authErr });
    let first;
    pool.exec(SRV, 'a', (err) => (first = err));
    await ticks();
    assert.ok(first);
    assert.ok(!isTransientError(first));

    let second;
    pool.exec(SRV, 'b', (err) => (second = err));
    await ticks();
    assert.ok(second, 'deve falhar sem conectar');
    assert.strictEqual(clients.length, 1, 'cooldown: não deve abrir nova conexão');
    assert.ok(!isTransientError(second));

    // senha editada → outra identidade → tenta na hora
    pool.exec({ ...SRV, password: 'corrigida' }, 'c', () => {});
    await ticks();
    assert.strictEqual(clients.length, 2);
});

test('pool: canal recusado falha só aquele pedido, mantém a conexão e reduz o limite', async () => {
    const { pool, clients } = newPool({ refuse: (cmd) => cmd === 'bad' }, { maxChannelsPerConn: 4 });
    const calls = {};
    ['a', 'bad', 'c'].forEach((cmd) => pool.exec(SRV, cmd, (err, out) => (calls[cmd] = { err, out })));
    await ticks();
    assert.ok(calls.bad && calls.bad.err && isTransientError(calls.bad.err));
    assert.ok(!clients[0].ended && !clients[0].destroyed, 'conexão deve ser mantida');

    // limite caiu para 2 (3 ativos - 1): 'd' espera um dos ativos terminar
    pool.exec(SRV, 'd', (err, out) => (calls.d = { err, out }));
    await ticks();
    assert.deepStrictEqual(clients[0].execs.map((e) => e.cmd), ['a', 'bad', 'c']);
    clients[0].execs[0].stream.finish('A');
    await ticks();
    assert.deepStrictEqual(clients[0].execs.map((e) => e.cmd), ['a', 'bad', 'c', 'd']);
    assert.deepStrictEqual(calls.a, { err: null, out: 'A' });
    assert.strictEqual(clients.length, 1);
    pool.closeAll();
});

test('pool: exec que lança (Not connected) derruba a conexão e o próximo reconecta', async () => {
    const { pool, clients } = newPool({ execThrows: true });
    let got;
    pool.exec(SRV, 'a', (err) => (got = err));
    await ticks();
    assert.ok(got && isTransientError(got));
    assert.ok(clients[0].destroyed);
    pool.exec(SRV, 'b', () => {});
    await ticks();
    assert.strictEqual(clients.length, 2);
});

test('pool: timeout responde uma vez, fecha o canal e só libera o slot no close', async () => {
    const { pool, clients } = newPool({}, { maxChannelsPerConn: 1 });
    const calls = [];
    pool.exec(SRV, 'lento', (err) => calls.push(err), null, { timeoutMs: 20 });
    pool.exec(SRV, 'proximo', () => {});
    await ticks();
    assert.deepStrictEqual(clients[0].execs.map((e) => e.cmd), ['lento']);
    await wait(50);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].code, 'ETIMEDOUT');
    assert.ok(isTransientError(calls[0]));
    assert.ok(clients[0].execs[0].stream.closeCalled);
    await ticks();
    assert.deepStrictEqual(clients[0].execs.map((e) => e.cmd), ['lento', 'proximo']);
    assert.strictEqual(calls.length, 1);
    pool.closeAll();
});

test('pool: closeAll falha a fila na hora e os em andamento no close da conexão', async () => {
    const { pool, clients } = newPool({}, { maxChannelsPerConn: 1 });
    const calls = {};
    pool.exec(SRV, 'ativo', (err) => (calls.ativo = (calls.ativo || []).concat([err])));
    pool.exec(SRV, 'fila', (err) => (calls.fila = (calls.fila || []).concat([err])));
    await ticks();
    pool.closeAll('teste');
    await ticks();
    assert.ok(clients[0].ended);
    assert.strictEqual(calls.fila.length, 1);
    assert.strictEqual(calls.fila[0].code, 'EPOOLCLOSED');
    assert.strictEqual(calls.ativo.length, 1);
    assert.strictEqual(calls.ativo[0].code, 'EPOOLCLOSED');
    clients[0].execs[0].stream.emit('close');
    await ticks();
    assert.strictEqual(calls.ativo.length, 1);
    assert.strictEqual(pool.stats().open, 0);
});

test('pool: verifica a host key via hostKeyStore (TOFU)', async () => {
    const store = new Map();
    const hostKeyStore = {
        get: (host, port) => store.get(`${host}:${port}`) || null,
        set: (host, port, fp) => store.set(`${host}:${port}`, fp),
    };
    const { pool, clients } = newPool({}, { hostKeyStore });
    pool.exec(SRV, 'a', () => {});
    await ticks();
    const verify = clients[0].cfg.hostVerifier;
    assert.strictEqual(typeof verify, 'function');
    const quiet = console.log;
    console.log = () => {};
    try {
        assert.strictEqual(verify(Buffer.from('chave-1')), true); // 1ª vez: registra
    } finally {
        console.log = quiet;
    }
    assert.strictEqual(store.size, 1);
    assert.strictEqual(clients[0].cfg.port, 22);
    assert.strictEqual(clients[0].cfg.tryKeyboard, true);
    pool.closeAll();
});
