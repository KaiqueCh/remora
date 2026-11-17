const test = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('node:events');
const { createRemoteRunner, executeRemoteCommand, isTransientError } = require('../src/index');

const tick = () => new Promise((r) => setImmediate(r));
async function ticks(n = 5) {
    for (let i = 0; i < n; i++) await tick();
}
// O backoff do retry usa setTimeout (que pode disparar depois dos setImmediate).
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// exec falso: guarda as chamadas para o teste decidir quando cada uma termina.
function manualExec() {
    const calls = [];
    const exec = (server, command, cb, _hk, opts) => {
        calls.push({ server, command, cb, opts });
    };
    return { calls, exec };
}

test('runner: mesma lane é serializada, lanes diferentes rodam em paralelo', async () => {
    const { calls, exec } = manualExec();
    const runner = createRemoteRunner({ exec, maxConcurrent: 8, retries: 0 });
    const a = { id: 'a', host: 'h', port: 22 };
    const b = { id: 'b', host: 'h', port: 22 }; // mesmo host, outro serviço
    runner.schedule(a, 'a1', () => {});
    runner.schedule(a, 'a2', () => {});
    runner.schedule(b, 'b1', () => {});
    await ticks();
    assert.deepStrictEqual(calls.map((c) => c.command), ['a1', 'b1']);

    calls[0].cb(null, 'ok');
    await ticks();
    assert.deepStrictEqual(calls.map((c) => c.command), ['a1', 'b1', 'a2']);
});

test('runner: sem id, a lane cai para host:port; lane explícita tem precedência', async () => {
    const { calls, exec } = manualExec();
    const runner = createRemoteRunner({ exec, maxConcurrent: 8, retries: 0 });
    const s1 = { host: 'h', port: 22 };
    const s2 = { host: 'h', port: '22' };
    runner.schedule(s1, 'x1', () => {});
    runner.schedule(s2, 'x2', () => {}); // mesmo host:port → espera x1
    runner.schedule(s1, 'y1', () => {}, null, { lane: 'outra' });
    await ticks();
    assert.deepStrictEqual(calls.map((c) => c.command), ['x1', 'y1']);
});

test('runner: prioridade high passa à frente da fila normal', async () => {
    const { calls, exec } = manualExec();
    const runner = createRemoteRunner({ exec, maxConcurrent: 1, retries: 0 });
    const srv = (id) => ({ id, host: 'h', port: 22 });
    runner.schedule(srv('busy'), 'busy', () => {});
    runner.schedule(srv('n1'), 'n1', () => {});
    runner.schedule(srv('n2'), 'n2', () => {});
    runner.schedule(srv('h'), 'h', () => {}, null, { priority: 'high' });
    await ticks();
    assert.deepStrictEqual(calls.map((c) => c.command), ['busy']);
    assert.deepStrictEqual(runner.stats().waitingHigh, 1);
    assert.deepStrictEqual(runner.stats().waitingNormal, 2);

    calls[0].cb(null, '');
    await ticks();
    assert.deepStrictEqual(calls.map((c) => c.command), ['busy', 'h']);
    assert.strictEqual(calls[1].opts.priority, 'high');
});

test('runner: erro transitório é refeito; erro de autenticação não', async () => {
    const { calls, exec } = manualExec();
    const runner = createRemoteRunner({ exec, maxConcurrent: 4, retries: 2, retryDelayMs: 0 });
    const results = [];
    runner.schedule({ id: 't', host: 'h' }, 'cmd', (err, out) => results.push({ err, out }));
    await ticks();
    calls[0].cb(Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }));
    await wait(20);
    assert.strictEqual(calls.length, 2);
    calls[1].cb(null, 'ok');
    await ticks();
    assert.deepStrictEqual(results, [{ err: null, out: 'ok' }]);

    runner.schedule({ id: 'u', host: 'h' }, 'cmd', (err) => results.push({ err }));
    await ticks();
    const authErr = Object.assign(new Error('All configured authentication methods failed'), {
        level: 'client-authentication',
    });
    calls[2].cb(authErr);
    await ticks();
    assert.strictEqual(calls.length, 3, 'não deve refazer erro de autenticação');
    assert.strictEqual(results[1].err, authErr);
});

test('runner: opts.retries sobrescreve o padrão', async () => {
    const { calls, exec } = manualExec();
    const runner = createRemoteRunner({ exec, maxConcurrent: 4, retries: 2, retryDelayMs: 0 });
    let got;
    runner.schedule({ id: 'r', host: 'h' }, 'cmd', (err) => (got = err), null, { retries: 0 });
    await ticks();
    calls[0].cb(Object.assign(new Error('x'), { transient: true }));
    await ticks();
    assert.strictEqual(calls.length, 1);
    assert.ok(got);
});

test('runner: callback que lança não quebra a lane nem gera unhandled rejection', async () => {
    const unhandled = [];
    const onUnhandled = (e) => unhandled.push(e);
    process.on('unhandledRejection', onUnhandled);
    const origError = console.error;
    console.error = () => {};
    try {
        const { calls, exec } = manualExec();
        const runner = createRemoteRunner({ exec, maxConcurrent: 4, retries: 0 });
        const s = { id: 'x', host: 'h' };
        runner.schedule(s, 'c1', () => {
            throw new Error('boom');
        });
        let second = null;
        runner.schedule(s, 'c2', (err, out) => (second = out));
        await ticks();
        calls[0].cb(null, 'one');
        await ticks();
        calls[1].cb(null, 'two');
        await ticks();
        assert.strictEqual(second, 'two');
        assert.deepStrictEqual(unhandled, []);
    } finally {
        console.error = origError;
        process.removeListener('unhandledRejection', onUnhandled);
    }
});

test('runner: lanes concluídas são removidas do mapa', async () => {
    const { calls, exec } = manualExec();
    const runner = createRemoteRunner({ exec, maxConcurrent: 4, retries: 0 });
    runner.schedule({ id: 'z', host: 'h' }, 'c', () => {});
    await ticks();
    assert.strictEqual(runner.stats().lanes, 1);
    calls[0].cb(null, '');
    await ticks();
    assert.strictEqual(runner.stats().lanes, 0);
});

// ---- executeRemoteCommand: callback único --------------------------------

class FakeStream extends EventEmitter {
    constructor() {
        super();
        this.stderr = new EventEmitter();
    }
}

// Client falso: reproduz o RST do sshd Windows (ECONNRESET) após o end().
class FakeClient extends EventEmitter {
    constructor({ resetOnEnd = true } = {}) {
        super();
        this.resetOnEnd = resetOnEnd;
        this.ended = false;
    }
    connect(cfg) {
        this.cfg = cfg;
        setImmediate(() => this.emit('ready'));
        return this;
    }
    exec(cmd, cb) {
        this.cmd = cmd;
        this.stream = new FakeStream();
        setImmediate(() => cb(undefined, this.stream));
    }
    end() {
        this.ended = true;
        setImmediate(() => {
            if (this.resetOnEnd) {
                this.emit('error', Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }));
            }
            this.emit('close');
        });
    }
}

function quietConsole() {
    const saved = { log: console.log, warn: console.warn, error: console.error };
    const warns = [];
    const errors = [];
    console.log = () => {};
    console.warn = (...a) => warns.push(a.join(' '));
    console.error = (...a) => errors.push(a.join(' '));
    return {
        warns,
        errors,
        restore() {
            Object.assign(console, saved);
        },
    };
}

test('executeRemoteCommand: ECONNRESET após a conclusão não gera 2º callback nem erro', async () => {
    const con = quietConsole();
    try {
        const fake = new FakeClient();
        const calls = [];
        executeRemoteCommand({ host: 'h', port: 22 }, 'sc query x', (err, out) => calls.push({ err, out }), null, {
            createClient: () => fake,
        });
        await ticks();
        fake.stream.emit('data', Buffer.from('STATE : 4 RUNNING\r\n'));
        fake.stream.emit('close');
        await ticks();
        assert.strictEqual(calls.length, 1);
        assert.strictEqual(calls[0].err, null);
        assert.strictEqual(calls[0].out, 'STATE : 4 RUNNING');
        assert.ok(fake.ended);
        assert.ok(con.warns.some((w) => /ECONNRESET.*ignorado/.test(w)), 'deve registrar o reset como ignorado');
        assert.ok(!con.errors.some((e) => /ECONNRESET/.test(e)), 'não deve registrar como erro');
    } finally {
        con.restore();
    }
});

test('executeRemoteCommand: queda no meio do comando falha UMA vez (não vira sucesso parcial)', async () => {
    const con = quietConsole();
    try {
        const fake = new FakeClient({ resetOnEnd: false });
        const calls = [];
        executeRemoteCommand({ host: 'h' }, 'cmd', (err, out) => calls.push({ err, out }), null, {
            createClient: () => fake,
        });
        await ticks();
        fake.stream.emit('data', Buffer.from('parcial'));
        // ssh2: 'close' do Client vem ANTES do 'close' dos canais
        fake.emit('close');
        fake.stream.emit('close');
        await ticks();
        assert.strictEqual(calls.length, 1);
        assert.ok(calls[0].err);
        assert.ok(isTransientError(calls[0].err));
    } finally {
        con.restore();
    }
});

test('executeRemoteCommand: erro antes da conclusão é reportado com a fase', async () => {
    const con = quietConsole();
    try {
        const fake = new FakeClient({ resetOnEnd: false });
        const calls = [];
        executeRemoteCommand({ host: 'h' }, 'cmd', (err) => calls.push(err), null, { createClient: () => fake });
        await ticks();
        fake.emit('error', Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }));
        fake.emit('close');
        fake.stream.emit('close');
        await ticks();
        assert.strictEqual(calls.length, 1);
        assert.strictEqual(calls[0].code, 'ECONNRESET');
        assert.ok(con.errors.some((e) => /fase: execução/.test(e)));
    } finally {
        con.restore();
    }
});
