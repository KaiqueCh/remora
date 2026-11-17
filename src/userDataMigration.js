const fs = require('fs');
const path = require('path');

// Migração da pasta de dados do usuário após a renomeação do app para "Remora".
//
// O Electron deriva `userData` do nome do app; com o rename ela passou de
// `%APPDATA%\script-sinapse` (ou `Gerenciador de Serviços`, em builds antigos)
// para `%APPDATA%\Remora`. Sem migração, o usuário perderia os servidores
// cadastrados. Copiamos (nunca movemos) apenas o necessário:
//   - vault.enc      → credenciais cifradas
//   - settings.json  → preferências
//   - Local State    → guarda a chave do safeStorage (protegida por DPAPI);
//                      sem ela o vault.enc copiado seria indecifrável.
//
// Precisa rodar ANTES do evento `ready` (o Chromium lê o Local State na inicialização).

const LEGACY_DIR_NAMES = ['script-sinapse', 'Gerenciador de Serviços'];
const MIGRATED_FILES = ['vault.enc', 'settings.json', 'Local State'];
const DATA_FILES = ['vault.enc', 'settings.json'];

function hasAppData(dir) {
    return DATA_FILES.some((f) => fs.existsSync(path.join(dir, f)));
}

// Retorna a pasta antiga usada na migração, ou null se nada foi copiado.
function migrateLegacyUserData({ appData, userData, legacyNames = LEGACY_DIR_NAMES }) {
    if (hasAppData(userData)) return null; // já tem dados próprios: não sobrescreve

    for (const name of legacyNames) {
        const legacy = path.join(appData, name);
        if (path.resolve(legacy) === path.resolve(userData) || !hasAppData(legacy)) continue;

        fs.mkdirSync(userData, { recursive: true });
        for (const file of MIGRATED_FILES) {
            const src = path.join(legacy, file);
            if (fs.existsSync(src)) fs.copyFileSync(src, path.join(userData, file));
        }
        return legacy;
    }
    return null;
}

module.exports = { migrateLegacyUserData, LEGACY_DIR_NAMES };
