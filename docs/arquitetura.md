# Arquitetura

Documentação técnica do **Remora**. O app segue uma arquitetura Electron em camadas, com
isolamento de contexto: o renderer nunca acessa o sistema diretamente — tudo passa pela ponte
`preload.js` e pelos handlers IPC do processo principal.

## Camadas e fluxo

```
┌ RENDERER (src/ui) ─────────────────────────────────────────────┐
│  index.html + renderer.js + style.css                          │
│  chama window.api.*  ·  escuta onLog/onStatus/onLogsData/...    │
└───────────────────────────┬────────────────────────────────────┘
                            │ contextBridge (sandbox)
┌ PRELOAD (src/preload.js) ─┴────────────────────────────────────┐
│  mapeia window.api.* → ipcRenderer.invoke/send/on              │
└───────────────────────────┬────────────────────────────────────┘
                            │ IPC
┌ MAIN (src/main.js) ───────┴────────────────────────────────────┐
│  handlers IPC · runner de concorrência · cache de descoberta    │
│  · sessões de log · host key store (TOFU)                       │
└───┬──────────────┬──────────────────┬────────────────┬────────┘
    │              │                  │                │
 vault.js      docker.js          index.js        settings.js
(credenciais) (comandos+parsers) (SSH: exec/stream) (preferências)
```

## `src/main.js` — processo principal e IPC

Cria a janela com tamanho dinâmico — até 960×900, limitado à área útil da tela (exclui a taskbar),
mínimo 720×640 — centralizada, com `contextIsolation` + `sandbox` e preload habilitado; desabilita
o menu nativo e verifica a disponibilidade de criptografia no `ready`. Ao fechar (e no `before-quit`),
encerra todas as sessões de log e as conexões do pool SSH.

Componentes internos:

- **Host key store** — `{ get(host,port), set(host,port,fp) }` sobre `vault.getHostKey/setHostKey`
  (verificação TOFU anti-MITM).
- **Pool SSH** — `createConnectionPool({ maxChannelsPerConn: 4, idleMs: 60000 })` (ver `src/sshPool.js`):
  uma conexão persistente por identidade, reaproveitada por todos os comandos.
- **Runner de concorrência** — `createRemoteRunner({ maxConcurrent: 8, retries: 2, retryDelayMs: 800, exec: sshPool.exec })`.
  Serializa comandos por *lane* (por padrão, o servidor/serviço cadastrado), atende primeiro a
  prioridade `high` (ações do usuário) e reexecuta erros transitórios. Todos os handlers agendam trabalho por ele.
- **Status em lote** — `check-status` agrupa os serviços Windows por conexão e consulta todos num único
  comando (`scQueryBatchCommand`). Um ciclo novo é ignorado enquanto o anterior do mesmo grupo não
  termina (`statusInFlight`, com watchdog de 120 s).
- **Proteção de status obsoleto** — `actionsInFlight`/`actionGen`: um ciclo de status agendado antes de uma
  ação não sobrescreve o estado publicado pela ação. No reinício, o `sc start` só é enviado após o
  serviço confirmar `STOPPED` (`waitForServiceState`, até 30 s).
- **Cache de descoberta** — `discoveredByServer: Map<serverId, { files:Set, services:Map }>`, usado
  como **allowlist**: só arquivos/serviços descobertos podem ser acionados.
- **Sessões de log** — `logSessions: Map<sessionId, {...}>`, no máximo 3 simultâneas (LRU).

### Canais IPC (invoke — request/response)

| Canal | Função |
| ----- | ------ |
| `app:version` | Versão do app. |
| `settings:get` / `settings:set` | Lê/atualiza as preferências do app (intervalo de atualização). |
| `groups:list` / `groups:create` / `groups:rename` / `groups:setCritical` / `groups:delete` | CRUD de grupos. |
| `servers:add` / `servers:update` / `servers:remove` | CRUD de servidores. |
| `import:file` | Abre diálogo, parseia `.ini`/`.json`, cria grupo com servidores. |
| `docker:discover` | Descobre projetos e estados (árvore completa). |
| `docker:refresh` | Atualização leve reaproveitando o cache de arquivos. |
| `docker:test` | Testa SSH + `docker compose version` e lista projetos. |
| `docker:logs:start` / `service:logs:start` | Inicia sessão de streaming de logs; retorna `{ sessionId }`. |

### Canais IPC (send — fire-and-forget, resposta por eventos)

| Canal | Função |
| ----- | ------ |
| `start-service` / `stop-service` / `restart-service` | Ação em lote nos serviços Windows do grupo. |
| `service:action` | Ação individual `{ groupId, serverId, action }`. |
| `check-status` | Consulta `sc query` em lote (um comando por conexão) e emite `status` por servidor. |
| `docker:action` | Ação Docker `{ scope, composeFile, service, action }` (valida allowlist). |
| `logs:stop` | Encerra uma sessão de log. |

### Eventos emitidos ao renderer

- `log` — `{ level: 'info'|'ok'|'warn'|'error', host, service, message }`
- `status` — estado de um servidor/projeto/serviço.
- `logs:data` — `{ sessionId, chunk }`
- `logs:end` — `{ sessionId, reason, message? }`

## `src/index.js` — camada SSH

- **`executeRemoteCommand(cfg, cmd, cb, hostKeyStore)`** — abre conexão dedicada, executa um comando,
  acumula stdout e chama `cb(err, output)` **uma única vez**. Um ECONNRESET depois da conclusão (o
  sshd do Windows reseta o TCP ao encerrarmos) é só registrado; queda antes do fim vira erro
  transitório (nunca sucesso com saída parcial). Suporta `keyboard-interactive` (PAM). O app usa o pool;
  esta função segue como `exec` padrão do runner.
- **`openStream(cfg, cmd, handlers, hostKeyStore)`** — canal de longa duração para `logs -f`/`tail -f`;
  encaminha cada *chunk* via `onData` e retorna `{ close() }`. Também suporta keyboard-interactive.
- **TOFU** — `fingerprintOf(key)` (SHA256) e `hostVerifierFor(cfg, store)`: registra a impressão
  digital na primeira conexão e rejeita mudanças depois (anti-MITM).
- **`createRemoteRunner(opts)`** — concorrência limitada, serialização por lane, fila com prioridade
  (`schedule(server, cmd, cb, onRetry, { priority, lane, timeoutMs, retries })`) e retry com backoff
  linear para erros transitórios (`isTransientError`: ECONNRESET/ETIMEDOUT/EPIPE/ECONNABORTED ou
  `err.transient`; falha de autenticação nunca é refeita).
- **Parsers de import** — `parseServersFromIni`, `parseServersFromJson`.
- **Windows** — `serviceLogCommand(folder, tail)` (tail do `console.log` via PowerShell),
  `summarizeScOutput`, `parseServiceState` (mapeia estado do `sc query`).
- **Status em lote** — `scQueryBatchCommand(names)` (`echo @@SS<i>@@ & sc query "<nome>"` encadeados
  com `&`), `chunkScQueryBatch` (lotes que cabem no limite do cmd.exe), `parseScQueryBatch(output, n)`
  e `scBatchHasMarkers` (detecta shell padrão diferente do cmd.exe).

## `src/sshPool.js` — pool de conexões SSH

- **`createConnectionPool(opts)`** → `{ exec, closeAll, stats }`. `exec` tem a mesma assinatura de
  `executeRemoteCommand` e é injetado no runner.
- **Identidade** — `connectionKey(server)` = `usuário@host:porta` + hash da senha (só em memória):
  editar a senha não reaproveita sessão antiga.
- **Canais** — até `maxChannelsPerConn` (4) comandos simultâneos por conexão; canal recusado pelo
  servidor (MaxSessions) reduz o limite daquela conexão e o pedido é refeito.
- **Ciclo de vida** — conexão aberta sob demanda, fechada após `idleMs` (60 s) ociosa; keepalive de
  10 s. Queda da conexão falha os pedidos dela com erro transitório (o retry reconecta). Erros do
  socket depois de um encerramento intencional são ignorados.
- **Autenticação** — falha de autenticação põe a identidade em *cooldown* (5 min) para não bloquear a
  conta no AD com tentativas a cada ciclo de polling.

## `src/docker.js` — comandos e parsers do Docker Compose

Toda entrada é validada e citada com `shellQuote` antes de compor comandos.

- **Builders** — `discoverCommand(dir)` (find até 2 níveis), `psCommand(file)` (`ps -a --format json`),
  `projectCommand(file, action)` (`up -d`/`down`/`restart`), `serviceCommand(file, service, action)`,
  `logsCommand(file, service, tail)` (`--ansi always … logs -f --tail=N`).
- **Parsers** — `parseDiscoverOutput`, `projectNameFromFile`, `parseComposePs` (aceita array JSON ou
  NDJSON), `normalizePsEntry`.
- **Estado** — `mapDockerState(entry)` (running/stopped/pending/error/unknown) e
  `aggregateState(states)` (combina estados de vários serviços em um só).
- **Validação** — `isValidServiceName` (`^[A-Za-z0-9][A-Za-z0-9_.\-]*$`).

## `src/settings.js` — preferências do app

Preferências **não sensíveis** em JSON puro (`userData/settings.json`), separadas do vault
(cifrado) porque são lidas no boot e não devem depender do `safeStorage`.

- **Modelo** — `{ version, pollIntervalSeconds }`. Intervalo de polling do status: `0` (desligado)
  ou `5`–`3600` segundos; qualquer valor inválido cai no padrão `30`.
- **API** — `getSettings()` (nunca lança: retorna defaults em erro) e `updateSettings(patch)`
  (merge parcial + sanitização + persistência best-effort; retorna o objeto final).

## `src/vault.js` — credenciais e validação

- **Armazenamento** — arquivo criptografado em `userData/vault.enc` via `safeStorage`
  (DPAPI no Windows). Formato: `{ version, groups, hostKeys }`.
- **Modelo** — grupo `{ id, name, critical, servers[] }`; servidor
  `{ id, type: 'windows'|'docker', host, port, username, password, serviceName?, servicePath?, composeDir? }`.
- **Sanitização** — a versão enviada ao renderer **nunca inclui a senha**, apenas `hasPassword`.
- **Validadores** — `isValidHost`, `isValidComposeDir` (absoluto POSIX, sem `..`), `isValidWindowsPath`
  (drive `C:\…`, sem `..`/metacaracteres), `isValidServiceName`, `normalizePort` (1–65535, padrão 22).
- **CRUD** — `listGroups`, `createGroup`, `renameGroup`, `setGroupCritical`, `deleteGroup`,
  `addServer`, `updateServer`, `removeServer`, `createGroupWithServers`.
- **Uso interno** — `getGroupServers(groupId)` retorna servidores **com senha** (não exposto por IPC).
- **Host keys (TOFU)** — `getHostKey`, `setHostKey`, indexados por `host:port`.

## API `window.api` (preload)

Métodos (promessas): `getAppVersion`, `getSettings`, `updateSettings`, `listGroups`,
`createGroup`, `renameGroup`, `setGroupCritical`, `deleteGroup`, `addServer`, `updateServer`,
`removeServer`, `importFile`, `dockerDiscover`, `dockerRefresh`, `dockerTest`, `dockerLogsStart`,
`serviceLogsStart`.

Disparos (send): `startService`, `stopService`, `restartService`, `serviceAction`, `checkStatus`,
`dockerAction`, `logsStop`.

Listeners (eventos): `onLog`, `onStatus`, `onLogsData`, `onLogsEnd`.

## Testes

- `test/docker.test.js` — builders e parsers do Docker (shellQuote, discover/ps/project/service/logs,
  parseComposePs, mapDockerState, aggregateState, etc.).
- `test/windows.test.js` — `isValidWindowsPath` (bloqueia traversal/injeção) e `serviceLogCommand`.
- `test/scBatch.test.js` — montagem, fatiamento e parse do status em lote; `isTransientError`.
- `test/runner.test.js` — lanes, prioridade, retry e callback único do `executeRemoteCommand`.
- `test/sshPool.test.js` — reuso de conexão, limite de canais, ociosidade, quedas, cooldown de
  autenticação, timeout e `closeAll` (com um Client ssh2 falso).

Execute com `npm test` (`node --test`).
