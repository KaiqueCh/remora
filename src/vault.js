const { app, safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Caminho do arquivo cifrado (na pasta de dados do usuário do app)
function vaultPath() {
    return path.join(app.getPath('userData'), 'vault.enc');
}

const EMPTY_STORE = () => ({ version: 1, groups: [], hostKeys: {} });

// Validação de nome de serviço (espelha a do backend SSH). Evita injeção de comando.
const SERVICE_NAME_RE = /^[A-Za-z0-9_.\- ]+$/;
function isValidServiceName(name) {
    return typeof name === 'string' && name.length > 0 && name.length <= 256 && SERVICE_NAME_RE.test(name);
}

// Host: hostname ou IP simples, sem espaços nem caracteres de shell.
const HOST_RE = /^[A-Za-z0-9_.\-]+$/;
function isValidHost(host) {
    return typeof host === 'string' && host.length > 0 && host.length <= 255 && HOST_RE.test(host);
}

// Diretório base do compose (docker): caminho absoluto POSIX, sem espaços,
// sem metacaracteres de shell e sem "..". Restritivo por segurança (anti-injeção).
const COMPOSE_DIR_RE = /^\/[A-Za-z0-9_.\-\/]*$/;
function isValidComposeDir(dir) {
    return (
        typeof dir === 'string' &&
        dir.length > 0 &&
        dir.length <= 512 &&
        dir.startsWith('/') &&
        !dir.includes('..') &&
        !/\/{2,}/.test(dir) &&
        COMPOSE_DIR_RE.test(dir)
    );
}

// Caminho (pasta) do serviço Windows: letra de unidade + caracteres seguros,
// sem "..". Restritivo por segurança (o caminho entra num comando PowerShell).
// Proíbe aspas, `, $, ;, &, |, <, >, %.
const WIN_PATH_RE = /^[A-Za-z]:[\\/][A-Za-z0-9 _.\-()\\/]*$/;
function isValidWindowsPath(p) {
    return (
        typeof p === 'string' &&
        p.length > 0 &&
        p.length <= 512 &&
        !p.includes('..') &&
        WIN_PATH_RE.test(p)
    );
}

function normalizePort(port) {
    const n = parseInt(port, 10);
    if (!Number.isInteger(n) || n < 1 || n > 65535) return 22;
    return n;
}

// ---- Criptografia ----------------------------------------------------------

function isAvailable() {
    try {
        return safeStorage.isEncryptionAvailable();
    } catch (_) {
        return false;
    }
}

function load() {
    const file = vaultPath();
    if (!fs.existsSync(file)) return EMPTY_STORE();
    if (!isAvailable()) {
        throw new Error('Criptografia (safeStorage) indisponível nesta máquina/conta.');
    }
    const buf = fs.readFileSync(file);
    const json = safeStorage.decryptString(buf);
    const store = JSON.parse(json);
    // saneamento defensivo
    if (!store || typeof store !== 'object') return EMPTY_STORE();
    store.version = store.version || 1;
    store.groups = Array.isArray(store.groups) ? store.groups : [];
    store.hostKeys = store.hostKeys && typeof store.hostKeys === 'object' ? store.hostKeys : {};
    return store;
}

function save(store) {
    if (!isAvailable()) {
        throw new Error('Criptografia (safeStorage) indisponível: gravação de credenciais bloqueada.');
    }
    const encrypted = safeStorage.encryptString(JSON.stringify(store));
    fs.writeFileSync(vaultPath(), encrypted);
}

// ---- Helpers internos ------------------------------------------------------

function findGroup(store, groupId) {
    return store.groups.find((g) => g.id === groupId);
}

// Remove a senha antes de enviar ao renderer (nunca expor texto plano na UI)
function sanitizeGroup(group) {
    return {
        id: group.id,
        name: group.name,
        critical: Boolean(group.critical),
        servers: (group.servers || []).map((s) => ({
            id: s.id,
            type: s.type || 'windows',
            host: s.host,
            port: s.port,
            username: s.username,
            serviceName: s.serviceName,
            servicePath: s.servicePath,
            composeDir: s.composeDir,
            hasPassword: Boolean(s.password),
        })),
    };
}

// Valida e normaliza um objeto de servidor vindo da UI/importação.
// `existing` (opcional) permite manter a senha atual quando não é informada nova.
// O campo `type` discrimina serviço Windows (default) de host docker; ausência
// de `type` (dados legados) é interpretada como 'windows' para retrocompatibilidade.
function buildServer(data, existing) {
    // O tipo informado explicitamente tem precedência (permite converter entre
    // windows↔docker na edição); na ausência, mantém o existente ou 'windows'.
    const type =
        data.type === 'docker' || data.type === 'windows'
            ? data.type
            : (existing && existing.type) || 'windows';

    const host = String(data.host || '').trim();
    if (!isValidHost(host)) {
        throw new Error(`Host inválido: "${host}". Use apenas letras, números, ponto e hífen.`);
    }
    const username = String(data.username || '').trim();
    if (!username) throw new Error('Usuário é obrigatório.');

    // Senha: usa a nova se informada; senão mantém a existente (edição).
    let password = existing ? existing.password : '';
    if (data.password !== undefined && data.password !== null && data.password !== '') {
        password = String(data.password);
    }

    const base = {
        id: existing ? existing.id : crypto.randomUUID(),
        type,
        host,
        port: normalizePort(data.port),
        username,
        password,
    };

    if (type === 'docker') {
        // Diretório base dos projetos compose (ex.: /kingposto), sem barra final.
        const composeDir = String(data.composeDir || '').replace(/\/+$/, '');
        if (!isValidComposeDir(composeDir)) {
            throw new Error(
                `Diretório compose inválido: "${composeDir}". Use um caminho absoluto seguro (ex.: /kingposto).`
            );
        }
        return { ...base, composeDir };
    }

    const serviceName = String(data.serviceName || '').trim();
    if (!isValidServiceName(serviceName)) {
        throw new Error(`Nome de serviço inválido: "${serviceName}". Caracteres não permitidos.`);
    }
    // Caminho da pasta do serviço (opcional): habilita o log em tempo real
    // (<pasta>\console.log). Sem barra final. Se informado, precisa ser válido.
    const servicePath = String(data.servicePath || '').trim().replace(/[\\/]+$/, '');
    if (servicePath && !isValidWindowsPath(servicePath)) {
        throw new Error(
            `Caminho do serviço inválido: "${servicePath}". Use um caminho Windows seguro (ex.: C:\\services\\meuapp).`
        );
    }
    return { ...base, serviceName, servicePath };
}

// ---- CRUD de grupos --------------------------------------------------------

function listGroups() {
    const store = load();
    return store.groups.map(sanitizeGroup);
}

function createGroup(name) {
    const store = load();
    const clean = String(name || '').trim();
    if (!clean) throw new Error('Nome do grupo é obrigatório.');
    const group = { id: crypto.randomUUID(), name: clean, critical: false, servers: [] };
    store.groups.push(group);
    save(store);
    return sanitizeGroup(group);
}

function renameGroup(groupId, name) {
    const store = load();
    const group = findGroup(store, groupId);
    if (!group) throw new Error('Grupo não encontrado.');
    const clean = String(name || '').trim();
    if (!clean) throw new Error('Nome do grupo é obrigatório.');
    group.name = clean;
    save(store);
    return sanitizeGroup(group);
}

// Marca/desmarca um grupo como CRÍTICO (operações exigem confirmação na UI).
function setGroupCritical(groupId, critical) {
    const store = load();
    const group = findGroup(store, groupId);
    if (!group) throw new Error('Grupo não encontrado.');
    group.critical = Boolean(critical);
    save(store);
    return sanitizeGroup(group);
}

function deleteGroup(groupId) {
    const store = load();
    const before = store.groups.length;
    store.groups = store.groups.filter((g) => g.id !== groupId);
    if (store.groups.length === before) throw new Error('Grupo não encontrado.');
    save(store);
    return true;
}

// ---- CRUD de servidores ----------------------------------------------------

function addServer(groupId, data) {
    const store = load();
    const group = findGroup(store, groupId);
    if (!group) throw new Error('Grupo não encontrado.');
    const server = buildServer(data, null);
    group.servers.push(server);
    save(store);
    return sanitizeGroup(group);
}

function updateServer(groupId, serverId, data) {
    const store = load();
    const group = findGroup(store, groupId);
    if (!group) throw new Error('Grupo não encontrado.');
    const idx = group.servers.findIndex((s) => s.id === serverId);
    if (idx === -1) throw new Error('Servidor não encontrado.');
    group.servers[idx] = buildServer(data, group.servers[idx]);
    save(store);
    return sanitizeGroup(group);
}

function removeServer(groupId, serverId) {
    const store = load();
    const group = findGroup(store, groupId);
    if (!group) throw new Error('Grupo não encontrado.');
    const before = group.servers.length;
    group.servers = group.servers.filter((s) => s.id !== serverId);
    if (group.servers.length === before) throw new Error('Servidor não encontrado.');
    save(store);
    return sanitizeGroup(group);
}

// Cria um grupo já com uma lista de servidores (usado na importação).
function createGroupWithServers(name, servers) {
    const store = load();
    const clean = String(name || '').trim() || 'Importado';
    const group = { id: crypto.randomUUID(), name: clean, critical: false, servers: [] };
    const errors = [];
    servers.forEach((s, i) => {
        try {
            group.servers.push(buildServer(s, null));
        } catch (e) {
            errors.push(`Servidor #${i + 1}: ${e.message}`);
        }
    });
    store.groups.push(group);
    save(store);
    return { group: sanitizeGroup(group), imported: group.servers.length, errors };
}

// Uso interno do processo main: retorna servidores COM senha para executar comandos.
function getGroupServers(groupId) {
    const store = load();
    const group = findGroup(store, groupId);
    if (!group) throw new Error('Grupo não encontrado.');
    return group.servers.map((s) => ({ ...s }));
}

// ---- Host keys (verificação anti-MITM) ------------------------------------

function hostKeyId(host, port) {
    return `${host}:${normalizePort(port)}`;
}

function getHostKey(host, port) {
    const store = load();
    return store.hostKeys[hostKeyId(host, port)] || null;
}

function setHostKey(host, port, fingerprint) {
    const store = load();
    store.hostKeys[hostKeyId(host, port)] = fingerprint;
    save(store);
}

module.exports = {
    isAvailable,
    isValidServiceName,
    isValidHost,
    isValidComposeDir,
    isValidWindowsPath,
    normalizePort,
    listGroups,
    createGroup,
    renameGroup,
    setGroupCritical,
    deleteGroup,
    addServer,
    updateServer,
    removeServer,
    createGroupWithServers,
    getGroupServers,
    getHostKey,
    setHostKey,
};
