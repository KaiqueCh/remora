// Testes da lógica pura de docker.js (sem SSH/Electron).
// Executar: node --test  (ou node test/docker.test.js)
const test = require('node:test');
const assert = require('node:assert');
const d = require('../src/docker');

test('shellQuote envolve em aspas simples e escapa aspas', () => {
    assert.strictEqual(d.shellQuote('abc'), `'abc'`);
    assert.strictEqual(d.shellQuote("a'b"), `'a'\\''b'`);
});

test('discoverCommand cita o diretório e busca compose files no nível base e 1º subnível', () => {
    const cmd = d.discoverCommand('/kingposto');
    assert.match(cmd, /find '\/kingposto' -mindepth 1 -maxdepth 2/);
    assert.match(cmd, /docker-compose\.yml/);
    assert.match(cmd, /compose\.yaml/);
});

test('psCommand usa -f com o arquivo citado, -a e formato json', () => {
    const cmd = d.psCommand('/kingposto/app/docker-compose.yml');
    assert.strictEqual(
        cmd,
        `docker compose -f '/kingposto/app/docker-compose.yml' ps -a --format json 2>/dev/null`
    );
});

test('projectCommand monta up/down/restart', () => {
    const f = '/kingposto/app/docker-compose.yml';
    assert.match(d.projectCommand(f, 'up'), /up -d 2>&1$/);
    assert.match(d.projectCommand(f, 'down'), /down -t 3 2>&1$/);
    assert.match(d.projectCommand(f, 'restart'), /restart -t 3 2>&1$/);
    assert.throws(() => d.projectCommand(f, 'evil'));
});

test('serviceCommand valida nome e monta comando', () => {
    const f = '/kingposto/app/docker-compose.yml';
    assert.match(d.serviceCommand(f, 'nginx', 'restart'), /restart -t 3 'nginx' 2>&1$/);
    assert.match(d.serviceCommand(f, 'api', 'stop'), /stop -t 3 'api' 2>&1$/);
    // injeção via nome de serviço é rejeitada
    assert.throws(() => d.serviceCommand(f, 'x; rm -rf /', 'up'));
    assert.throws(() => d.serviceCommand(f, '$(id)', 'up'));
});

test('logsCommand monta streaming por serviço e por projeto', () => {
    const f = '/kingposto/docker-compose.yml';
    // serviço específico
    assert.match(
        d.logsCommand(f, 'docker', 100),
        /docker compose --ansi always -f '\/kingposto\/docker-compose\.yml' logs -f --tail=100 'docker' 2>&1$/
    );
    // projeto inteiro (sem serviço) — não inclui nome de serviço no fim
    const proj = d.logsCommand(f, '', 100);
    assert.match(proj, /logs -f --tail=100 2>&1$/);
    assert.doesNotMatch(proj, /--tail=100 '/);
});

test('logsCommand normaliza tail e rejeita serviço inválido', () => {
    const f = '/kingposto/docker-compose.yml';
    assert.match(d.logsCommand(f, '', 'abc'), /--tail=100 /); // inválido → 100
    assert.match(d.logsCommand(f, '', 99999), /--tail=5000 /); // satura no teto
    assert.strictEqual(d.normalizeTail(-5), 100);
    assert.strictEqual(d.normalizeTail(250), 250);
    // injeção via nome de serviço é rejeitada
    assert.throws(() => d.logsCommand(f, 'x; rm -rf /', 100));
    assert.throws(() => d.logsCommand(f, '$(id)', 100));
});

test('parseDiscoverOutput separa linhas', () => {
    const out = '/kingposto/app/docker-compose.yml\n/kingposto/etl/compose.yml\n';
    assert.deepStrictEqual(d.parseDiscoverOutput(out), [
        '/kingposto/app/docker-compose.yml',
        '/kingposto/etl/compose.yml',
    ]);
    assert.deepStrictEqual(d.parseDiscoverOutput(''), []);
});

test('projectNameFromFile extrai a pasta pai', () => {
    assert.strictEqual(d.projectNameFromFile('/kingposto/app/docker-compose.yml'), 'app');
    assert.strictEqual(d.projectNameFromFile('/kingposto/etl/compose.yaml'), 'etl');
});

test('parseComposePs entende array JSON único', () => {
    const out = JSON.stringify([
        { Service: 'api', State: 'running', Health: '', Name: 'app-api-1' },
        { Service: 'db', State: 'exited', Health: '', Name: 'app-db-1' },
    ]);
    const rows = d.parseComposePs(out);
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].service, 'api');
    assert.strictEqual(rows[0].state, 'running');
    assert.strictEqual(rows[1].state, 'exited');
});

test('parseComposePs entende NDJSON (um objeto por linha)', () => {
    const out =
        '{"Service":"api","State":"running","Health":"healthy","Name":"app-api-1"}\n' +
        '{"Service":"nginx","State":"restarting","Health":"","Name":"app-nginx-1"}';
    const rows = d.parseComposePs(out);
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[1].service, 'nginx');
    assert.strictEqual(rows[1].state, 'restarting');
});

test('parseComposePs tolera saída vazia e linhas inválidas', () => {
    assert.deepStrictEqual(d.parseComposePs(''), []);
    assert.deepStrictEqual(d.parseComposePs('   '), []);
    const out = 'lixo nao json\n{"Service":"api","State":"running"}';
    const rows = d.parseComposePs(out);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].service, 'api');
});

test('mapDockerState mapeia estados do compose para a UI', () => {
    assert.strictEqual(d.mapDockerState({ state: 'running' }), 'running');
    assert.strictEqual(d.mapDockerState({ state: 'running', health: 'unhealthy' }), 'error');
    assert.strictEqual(d.mapDockerState({ state: 'exited' }), 'stopped');
    assert.strictEqual(d.mapDockerState({ state: 'dead' }), 'stopped');
    assert.strictEqual(d.mapDockerState({ state: 'restarting' }), 'pending');
    assert.strictEqual(d.mapDockerState({ state: 'paused' }), 'pending');
    assert.strictEqual(d.mapDockerState({ state: 'weird' }), 'unknown');
});

test('aggregateState agrega estados', () => {
    assert.strictEqual(d.aggregateState([]), 'unknown');
    assert.strictEqual(d.aggregateState(['running', 'running']), 'running');
    assert.strictEqual(d.aggregateState(['stopped', 'stopped']), 'stopped');
    assert.strictEqual(d.aggregateState(['running', 'stopped']), 'pending');
    assert.strictEqual(d.aggregateState(['running', 'error']), 'error');
});
