// Testes da lógica pura de scripts/release.js (sem git/gh/npm).
// Executar: node --test test/release.test.js
const test = require('node:test');
const assert = require('node:assert');
const r = require('../scripts/release');

test('nextVersion sobe patch, minor e major', () => {
    assert.strictEqual(r.nextVersion('2.4.6', 'patch'), '2.4.7');
    assert.strictEqual(r.nextVersion('2.4.6', 'minor'), '2.5.0');
    assert.strictEqual(r.nextVersion('2.4.6', 'major'), '3.0.0');
});

test('nextVersion aceita versão explícita maior que a atual', () => {
    assert.strictEqual(r.nextVersion('2.4.6', '2.10.0'), '2.10.0');
    assert.strictEqual(r.nextVersion('2.4.6', 'v3.0.1'), '3.0.1');
});

test('nextVersion rejeita versão explícita menor ou igual à atual', () => {
    assert.throws(() => r.nextVersion('2.4.6', '2.4.6'), /maior que a atual/);
    assert.throws(() => r.nextVersion('2.4.6', '2.3.9'), /maior que a atual/);
});

test('nextVersion rejeita argumento inválido', () => {
    assert.throws(() => r.nextVersion('2.4.6', 'banana'), /inválid/);
    assert.throws(() => r.nextVersion('2.4.6', '2.5'), /inválid/);
});

test('compareVersions compara numericamente, não como texto', () => {
    assert.ok(r.compareVersions('2.10.0', '2.9.0') > 0);
    assert.ok(r.compareVersions('2.4.6', '2.4.6') === 0);
    assert.ok(r.compareVersions('1.0.0', '2.0.0') < 0);
});

test('setPackageVersion troca só o campo version e preserva a formatação', () => {
    const src = '{\n    "name": "remora",\n    "version": "2.4.6",\n    "x": { "version": "9.9.9" }\n}\n';
    const out = r.setPackageVersion(src, '2.4.7');
    assert.strictEqual(out, '{\n    "name": "remora",\n    "version": "2.4.7",\n    "x": { "version": "9.9.9" }\n}\n');
});

test('setReadmeBadge atualiza o badge de versão', () => {
    const src = 'a\n![versão](https://img.shields.io/badge/vers%C3%A3o-2.4.6-blue)\nb';
    assert.strictEqual(
        r.setReadmeBadge(src, '2.4.7'),
        'a\n![versão](https://img.shields.io/badge/vers%C3%A3o-2.4.7-blue)\nb'
    );
});

test('setReadmeBadge falha se não encontrar o badge', () => {
    assert.throws(() => r.setReadmeBadge('sem badge', '2.4.7'), /Badge de versão/);
});

test('installerName segue o artifactName do NSIS', () => {
    assert.strictEqual(r.installerName('2.4.7'), 'Remora-Setup-2.4.7.exe');
});
