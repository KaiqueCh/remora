const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// Preferências do app (não são segredo). JSON puro na pasta de dados do usuário —
// diferente do vault (cifrado), pois o tamanho de janela/intervalo é lido no boot e
// não deve depender do safeStorage.
function settingsPath() {
    return path.join(app.getPath('userData'), 'settings.json');
}

const DEFAULTS = () => ({ version: 1, pollIntervalSeconds: 30 });

// Intervalo de polling em segundos: 0 (desligado) ou >= 5. Qualquer outra coisa → 30.
function sanitizePollSeconds(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 30;
    const s = Math.floor(n);
    if (s === 0) return 0;
    if (s >= 5 && s <= 3600) return s;
    return 30;
}

function normalize(store) {
    const base = DEFAULTS();
    if (!store || typeof store !== 'object') return base;
    base.pollIntervalSeconds = sanitizePollSeconds(store.pollIntervalSeconds);
    return base;
}

// Lê as preferências. Nunca lança: em erro (arquivo ausente/corrompido) retorna defaults.
function getSettings() {
    try {
        const file = settingsPath();
        if (!fs.existsSync(file)) return DEFAULTS();
        const raw = fs.readFileSync(file, 'utf8');
        return normalize(JSON.parse(raw));
    } catch {
        return DEFAULTS();
    }
}

// Aplica um patch parcial, saneia e persiste. Retorna o objeto final.
function updateSettings(patch) {
    const merged = normalize({ ...getSettings(), ...(patch || {}) });
    try {
        fs.writeFileSync(settingsPath(), JSON.stringify(merged, null, 2));
    } catch {
        // Persistência é best-effort; retorna o valor efetivo mesmo se a gravação falhar.
    }
    return merged;
}

module.exports = { getSettings, updateSettings, sanitizePollSeconds, settingsPath };
