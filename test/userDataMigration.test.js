const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { migrateLegacyUserData } = require('../src/userDataMigration');

function tmpAppData() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'remora-mig-'));
}

function write(dir, file, content) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
}

test('migração: copia vault, settings e Local State da pasta antiga', () => {
    const appData = tmpAppData();
    const legacy = path.join(appData, 'script-sinapse');
    const userData = path.join(appData, 'Remora');
    write(legacy, 'vault.enc', 'cifrado');
    write(legacy, 'settings.json', '{"pollIntervalSeconds":10}');
    write(legacy, 'Local State', '{"os_crypt":{}}');
    write(legacy, 'Cache.bin', 'lixo'); // não deve ser copiado

    assert.strictEqual(migrateLegacyUserData({ appData, userData }), legacy);
    assert.strictEqual(fs.readFileSync(path.join(userData, 'vault.enc'), 'utf8'), 'cifrado');
    assert.ok(fs.existsSync(path.join(userData, 'settings.json')));
    assert.ok(fs.existsSync(path.join(userData, 'Local State')));
    assert.ok(!fs.existsSync(path.join(userData, 'Cache.bin')));
    assert.ok(fs.existsSync(path.join(legacy, 'vault.enc')), 'a pasta antiga é preservada');
});

test('migração: não sobrescreve quando a pasta nova já tem dados', () => {
    const appData = tmpAppData();
    const userData = path.join(appData, 'Remora');
    write(path.join(appData, 'script-sinapse'), 'vault.enc', 'antigo');
    write(userData, 'vault.enc', 'novo');

    assert.strictEqual(migrateLegacyUserData({ appData, userData }), null);
    assert.strictEqual(fs.readFileSync(path.join(userData, 'vault.enc'), 'utf8'), 'novo');
});

test('migração: usa a próxima pasta antiga e ignora as sem dados', () => {
    const appData = tmpAppData();
    const userData = path.join(appData, 'Remora');
    write(path.join(appData, 'script-sinapse'), 'Local State', '{}'); // só cache do Chromium
    write(path.join(appData, 'Gerenciador de Serviços'), 'settings.json', '{}');

    assert.strictEqual(
        migrateLegacyUserData({ appData, userData }),
        path.join(appData, 'Gerenciador de Serviços')
    );
    assert.ok(fs.existsSync(path.join(userData, 'settings.json')));
});

test('migração: sem pasta antiga não faz nada', () => {
    const appData = tmpAppData();
    const userData = path.join(appData, 'Remora');
    assert.strictEqual(migrateLegacyUserData({ appData, userData }), null);
    assert.ok(!fs.existsSync(userData));
});
