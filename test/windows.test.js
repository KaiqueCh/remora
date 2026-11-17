const test = require('node:test');
const assert = require('node:assert');
const { serviceLogCommand, serviceLogAutoCommand } = require('../src/index');
const { isValidWindowsPath } = require('../src/vault');

test('isValidWindowsPath aceita caminhos Windows seguros', () => {
    assert.ok(isValidWindowsPath('C:\\services\\meuapp'));
    assert.ok(isValidWindowsPath('D:/apps/svc-01'));
    assert.ok(isValidWindowsPath('C:\\Program Files (x86)\\app'));
});

test('isValidWindowsPath rejeita caminhos perigosos ou malformados', () => {
    assert.ok(!isValidWindowsPath('')); // vazio
    assert.ok(!isValidWindowsPath('services\\app')); // sem letra de unidade
    assert.ok(!isValidWindowsPath('C:\\a\\..\\b')); // traversal
    assert.ok(!isValidWindowsPath("C:\\a'; rm")); // aspas/;
    assert.ok(!isValidWindowsPath('C:\\a$env')); // $
    assert.ok(!isValidWindowsPath('C:\\a`b')); // backtick
    assert.ok(!isValidWindowsPath('C:\\a&b')); // &
});

test('serviceLogCommand monta o tail via PowerShell do console.log', () => {
    const cmd = serviceLogCommand('C:\\services\\meuapp', 100);
    assert.match(cmd, /Get-Content -LiteralPath 'C:\\services\\meuapp\\console\.log'/);
    assert.match(cmd, /-Tail 100/);
    assert.match(cmd, /-Wait/);
});

test('serviceLogCommand normaliza tail e remove barra final', () => {
    assert.match(serviceLogCommand('C:\\a\\', 'abc'), /-Tail 100/); // inválido → 100
    assert.match(serviceLogCommand('C:\\a', 99999), /-Tail 5000/); // satura no teto
    // não deve duplicar a barra antes de console.log
    assert.match(serviceLogCommand('C:\\a\\', 10), /'C:\\a\\console\.log'/);
});

test('serviceLogAutoCommand resolve a pasta pelo nome e tail-a numa única invocação', () => {
    const cmd = serviceLogAutoCommand('.TOTVS_BROKER_LC', 100);
    assert.match(cmd, /powershell -NoProfile -NonInteractive -Command/);
    assert.match(cmd, /Get-CimInstance Win32_Service/);
    assert.match(cmd, /Where-Object Name -eq '\.TOTVS_BROKER_LC'/);
    assert.match(cmd, /Split-Path -Parent \$exe/);
    assert.match(cmd, /Join-Path \$dir 'console\.log'/);
    assert.match(cmd, /-Tail 100 -Wait -Encoding utf8/);
});

test('serviceLogAutoCommand extrai o exe até o ".exe" (robusto a espaços no caminho)', () => {
    // Sem esta extração, um ImagePath sem aspas com espaço (C:\Program Files\...)
    // quebraria no espaço e o diretório viraria "C:\".
    const cmd = serviceLogAutoCommand('.SVC', 100);
    assert.ok(cmd.includes('(?i)^(.+?\\.exe)\\b'), 'deve casar o caminho até o primeiro .exe');
    assert.ok(cmd.includes('.StartsWith($q)'), 'deve tratar o caso com aspas separadamente');
});

test('serviceLogAutoCommand não usa aspas duplas literais no corpo (usa [char]34)', () => {
    const cmd = serviceLogAutoCommand('.MEU_SVC', 50);
    // Extrai o conteúdo entre as aspas do -Command e garante ausência de " interno.
    const body = cmd.slice(cmd.indexOf('-Command "') + 10, cmd.length - 1);
    assert.ok(!body.includes('"'), 'o corpo do -Command não pode conter aspas duplas literais');
    assert.match(cmd, /\[char\]34/);
});

test('serviceLogAutoCommand normaliza o tail e escapa aspas simples', () => {
    assert.match(serviceLogAutoCommand('.SVC', 'abc'), /-Tail 100 -Wait/); // inválido → 100
    assert.match(serviceLogAutoCommand('.SVC', 99999), /-Tail 5000 -Wait/); // satura no teto
    assert.match(serviceLogAutoCommand("a'b", 10), /Name -eq 'a''b'/); // escape defensivo
});

test('createChunkCoalescer agrupa os chunks numa única entrega por intervalo', async () => {
    const { createChunkCoalescer } = require('../src/index');
    const out = [];
    const c = createChunkCoalescer((t) => out.push(t), { intervalMs: 20 });
    for (let i = 0; i < 500; i++) c.push(`linha ${i}\r\n`);
    assert.strictEqual(out.length, 0); // nada antes do intervalo
    await new Promise((r) => setTimeout(r, 40));
    assert.strictEqual(out.length, 1);
    assert.ok(out[0].startsWith('linha 0\r\n') && out[0].endsWith('linha 499\r\n'));
});

test('createChunkCoalescer mantém só o final quando acumula além do teto', () => {
    const { createChunkCoalescer } = require('../src/index');
    const out = [];
    const c = createChunkCoalescer((t) => out.push(t), { intervalMs: 1000, maxChars: 100 });
    for (let i = 0; i < 100; i++) c.push(String(i % 10).repeat(10));
    c.flush();
    assert.strictEqual(out.length, 1);
    assert.ok(out[0].length <= 200);
    assert.ok(out[0].endsWith('9'.repeat(10)));
});

test('createChunkCoalescer: flush entrega na hora e cancel descarta o pendente', async () => {
    const { createChunkCoalescer } = require('../src/index');
    const out = [];
    const c = createChunkCoalescer((t) => out.push(t), { intervalMs: 10 });
    c.push('a');
    c.flush();
    assert.deepStrictEqual(out, ['a']);
    c.push('b');
    c.cancel();
    await new Promise((r) => setTimeout(r, 30));
    assert.deepStrictEqual(out, ['a']);
});
