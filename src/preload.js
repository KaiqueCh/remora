const { contextBridge, ipcRenderer } = require('electron');

// Ponte para o frontend acessar as funções do backend.
// Nenhum método retorna senha em texto plano (o backend devolve apenas hasPassword).
contextBridge.exposeInMainWorld('api', {
    // Versão do app (via IPC — preload roda em sandbox e não pode require de arquivos)
    getAppVersion: () => ipcRenderer.invoke('app:version'),

    // Preferências do app (intervalo de atualização, etc.)
    getSettings: () => ipcRenderer.invoke('settings:get'),
    updateSettings: (patch) => ipcRenderer.invoke('settings:set', patch),

    // Grupos
    listGroups: () => ipcRenderer.invoke('groups:list'),
    createGroup: (name) => ipcRenderer.invoke('groups:create', name),
    renameGroup: (id, name) => ipcRenderer.invoke('groups:rename', id, name),
    setGroupCritical: (id, critical) => ipcRenderer.invoke('groups:setCritical', id, critical),
    deleteGroup: (id) => ipcRenderer.invoke('groups:delete', id),

    // Servidores
    addServer: (groupId, data) => ipcRenderer.invoke('servers:add', groupId, data),
    updateServer: (groupId, serverId, data) => ipcRenderer.invoke('servers:update', groupId, serverId, data),
    removeServer: (groupId, serverId) => ipcRenderer.invoke('servers:remove', groupId, serverId),

    // Importação
    importFile: () => ipcRenderer.invoke('import:file'),

    // Ações (operam sobre o grupo selecionado)
    startService: (groupId) => ipcRenderer.send('start-service', groupId),
    stopService: (groupId) => ipcRenderer.send('stop-service', groupId),
    restartService: (groupId) => ipcRenderer.send('restart-service', groupId),

    // Ação individual num servidor Windows: { groupId, serverId, action }
    serviceAction: (payload) => ipcRenderer.send('service:action', payload),

    // Monitoramento de status (sc query)
    checkStatus: (groupId) => ipcRenderer.send('check-status', groupId),
    onStatus: (callback) => ipcRenderer.on('status', (_event, s) => callback(s)),

    // Docker: descoberta (invoke → árvore de projetos/serviços), atualização
    // leve (só `ps`) e ações
    dockerDiscover: (groupId, serverId) => ipcRenderer.invoke('docker:discover', groupId, serverId),
    dockerRefresh: (groupId, serverId) => ipcRenderer.invoke('docker:refresh', groupId, serverId),
    dockerTest: (groupId, serverId, cfg) => ipcRenderer.invoke('docker:test', groupId, serverId, cfg),
    dockerAction: (payload) => ipcRenderer.send('docker:action', payload),

    // Streaming de logs em tempo real (docker compose logs -f / tail do console.log).
    // Canais de dados/fim são neutros (logs:data / logs:end), por sessionId.
    dockerLogsStart: (payload) => ipcRenderer.invoke('docker:logs:start', payload),
    serviceLogsStart: (payload) => ipcRenderer.invoke('service:logs:start', payload),
    logsStop: (sessionId) => ipcRenderer.send('logs:stop', { sessionId }),
    // Salva o log exibido em arquivo (diálogo nativo). payload: { defaultName, content }
    saveLogs: (payload) => ipcRenderer.invoke('logs:save', payload),
    onLogsData: (callback) => ipcRenderer.on('logs:data', (_event, d) => callback(d)),
    onLogsEnd: (callback) => ipcRenderer.on('logs:end', (_event, d) => callback(d)),

    // Logs estruturados: { level, host, service, message }
    onLog: (callback) => ipcRenderer.on('log', (event, entry) => callback(entry)),
});
