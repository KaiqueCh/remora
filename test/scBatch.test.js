const test = require('node:test');
const assert = require('node:assert');
const {
    scQueryBatchCommand,
    chunkScQueryBatch,
    parseScQueryBatch,
    scBatchHasMarkers,
    isTransientError,
} = require('../src/index');

// Saída real (resumida) do `sc query` em en-US e pt-BR, com CRLF.
const SC_RUNNING_EN = [
    'SERVICE_NAME: .TOTVS_A',
    '        TYPE               : 10  WIN32_OWN_PROCESS',
    '        STATE              : 4  RUNNING',
    '                                (STOPPABLE, NOT_PAUSABLE, IGNORES_SHUTDOWN)',
].join('\r\n');
const SC_STOPPED_PT = [
    'NOME_DO_SERVICO: .TOTVS_B',
    '        TIPO               : 10  WIN32_OWN_PROCESS',
    '        ESTADO             : 1  STOPPED',
].join('\r\n');
const SC_STOP_PENDING = '        STATE              : 3  STOP_PENDING';
const SC_NOT_FOUND = '[SC] EnumQueryServicesStatus:OpenService FAILED 1060:\r\n\r\nThe specified service does not exist as an installed service.';

test('scQueryBatchCommand monta echo de marcador + sc query por serviço, encadeados com &', () => {
    assert.strictEqual(
        scQueryBatchCommand(['.TOTVS_A', 'svc b']),
        'echo @@SS0@@ & sc query ".TOTVS_A" & echo @@SS1@@ & sc query "svc b"'
    );
});

test('scQueryBatchCommand rejeita lista vazia e nomes inválidos', () => {
    assert.throws(() => scQueryBatchCommand([]));
    assert.throws(() => scQueryBatchCommand(['ok', 'a"&calc']));
    assert.throws(() => scQueryBatchCommand(['a;b']));
});

test('chunkScQueryBatch respeita maxChars/maxItems e preserva a ordem', () => {
    const names = Array.from({ length: 100 }, (_, i) => `SVC_${String(i).padStart(3, '0')}_${'x'.repeat(190)}`);
    const chunks = chunkScQueryBatch(names, { maxChars: 6000, maxItems: 30 });
    assert.ok(chunks.length > 1);
    chunks.forEach((chunk) => {
        assert.ok(chunk.length > 0 && chunk.length <= 30);
        assert.ok(scQueryBatchCommand(chunk).length <= 6000);
    });
    assert.deepStrictEqual(chunks.flat(), names);
});

test('chunkScQueryBatch: lista pequena cabe num único lote', () => {
    const names = Array.from({ length: 25 }, (_, i) => `.TOTVS_SVC_${i}`);
    assert.deepStrictEqual(chunkScQueryBatch(names), [names]);
    assert.deepStrictEqual(chunkScQueryBatch([]), []);
});

test('parseScQueryBatch separa os segmentos pelos marcadores (en-US, pt-BR, pendente, 1060)', () => {
    const output = [
        '@@SS0@@ ',
        SC_RUNNING_EN,
        '@@SS1@@ ',
        SC_STOPPED_PT,
        '@@SS2@@ ',
        SC_STOP_PENDING,
        '@@SS3@@ ',
        SC_NOT_FOUND,
    ].join('\r\n');
    assert.deepStrictEqual(parseScQueryBatch(output, 4), ['running', 'stopped', 'pending', 'unknown']);
});

test('parseScQueryBatch: segmento ausente → unknown; marcador fora da faixa é ignorado', () => {
    const output = ['@@SS0@@', SC_RUNNING_EN, '@@SS7@@', SC_STOPPED_PT].join('\r\n');
    assert.deepStrictEqual(parseScQueryBatch(output, 2), ['running', 'unknown']);
});

test('parseScQueryBatch: saída vazia → tudo unknown', () => {
    assert.deepStrictEqual(parseScQueryBatch('', 3), ['unknown', 'unknown', 'unknown']);
    assert.deepStrictEqual(parseScQueryBatch(undefined, 1), ['unknown']);
});

test('scBatchHasMarkers detecta quando o shell não executou o lote (ex.: PowerShell)', () => {
    assert.ok(scBatchHasMarkers('@@SS0@@ \r\n' + SC_RUNNING_EN));
    const psError =
        "At line:1 char:15\r\n+ echo @@SS0@@ & sc query \".X\"\r\n+               ~\r\nThe ampersand (&) character is not allowed.";
    assert.ok(!scBatchHasMarkers(psError));
    assert.ok(!scBatchHasMarkers(''));
});

test('isTransientError: flag transient e erro de autenticação', () => {
    assert.ok(isTransientError(Object.assign(new Error('x'), { transient: true })));
    assert.ok(!isTransientError(Object.assign(new Error('read ECONNRESET'), { level: 'client-authentication' })));
    assert.ok(!isTransientError(Object.assign(new Error('All configured authentication methods failed'), { level: 'client-authentication' })));
    assert.ok(isTransientError(Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })));
    assert.ok(!isTransientError(new Error('Host denied (verification failed)')));
});
