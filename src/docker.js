// Lógica de gerenciamento de projetos docker compose (v2) sobre SSH.
//
// Este módulo é análogo ao index.js (SSH puro): NÃO executa nada — apenas monta
// strings de comando seguras e faz o parsing das saídas. A execução continua
// pelo runner (createRemoteRunner), que serializa por host e limita concorrência.
//
// Segurança: todos os argumentos de shell passam por shellQuote (aspas simples),
// e nomes de serviço/arquivos vindos da descoberta são validados (regex + a
// allowlist mantida no main process) antes de compor qualquer comando.

// ---- Citação de shell -----------------------------------------------------

// Envolve um valor em aspas simples POSIX, escapando aspas simples internas.
// Dentro de aspas simples nenhum metacaractere de shell é interpretado.
function shellQuote(value) {
    return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

// Nome de serviço do compose: começa com alfanumérico, depois alfanum/_.-
const SERVICE_RE = /^[A-Za-z0-9][A-Za-z0-9_.\-]*$/;
function isValidServiceName(service) {
    return typeof service === 'string' && service.length > 0 && service.length <= 128 && SERVICE_RE.test(service);
}

// ---- Montagem de comandos --------------------------------------------------

// Grace period (segundos) passado ao docker compose antes de forçar a parada
// (SIGKILL). O padrão do compose é 10s, o que faz o "Parar" parecer lento; 3s
// dá margem para um encerramento limpo sem a espera longa.
const STOP_TIMEOUT = 3;

// Descobre os arquivos compose sob o diretório base. Cobre dois formatos:
//   <base>/docker-compose.yml          (projeto único, nível 1)
//   <base>/<projeto>/docker-compose.yml (vários projetos, nível 2)
// Retorna um caminho de arquivo compose por linha.
// composeDir já foi validado por vault.isValidComposeDir antes de chegar aqui.
function discoverCommand(composeDir) {
    const dir = shellQuote(composeDir);
    return (
        `find ${dir} -mindepth 1 -maxdepth 2 ` +
        `\\( -name docker-compose.yml -o -name docker-compose.yaml ` +
        `-o -name compose.yml -o -name compose.yaml \\) -print 2>/dev/null`
    );
}

// Consulta o estado dos serviços de um projeto. Usa -f <arquivo> (evita cd e
// dependência do nome do projeto) e -a para incluir serviços parados (exited),
// que de outra forma não apareceriam. --format json é suportado no compose v2.
function psCommand(composeFile) {
    return `docker compose -f ${shellQuote(composeFile)} ps -a --format json 2>/dev/null`;
}

// Ações no nível do PROJETO (todos os serviços). 2>&1 para capturar erro de
// permissão (usuário fora do grupo docker) na saída.
function projectCommand(composeFile, action) {
    const f = shellQuote(composeFile);
    switch (action) {
        case 'up':
            return `docker compose -f ${f} up -d 2>&1`;
        case 'down':
            return `docker compose -f ${f} down -t ${STOP_TIMEOUT} 2>&1`;
        case 'restart':
            return `docker compose -f ${f} restart -t ${STOP_TIMEOUT} 2>&1`;
        default:
            throw new Error(`Ação de projeto inválida: ${action}`);
    }
}

// Ações no nível do SERVIÇO individual. O chamador DEVE validar `service`
// contra a allowlist descoberta; aqui reforçamos com regex + citação.
function serviceCommand(composeFile, service, action) {
    if (!isValidServiceName(service)) {
        throw new Error(`Serviço inválido: "${service}".`);
    }
    const f = shellQuote(composeFile);
    const s = shellQuote(service);
    switch (action) {
        case 'up':
            return `docker compose -f ${f} up -d ${s} 2>&1`;
        case 'stop':
            return `docker compose -f ${f} stop -t ${STOP_TIMEOUT} ${s} 2>&1`;
        case 'restart':
            return `docker compose -f ${f} restart -t ${STOP_TIMEOUT} ${s} 2>&1`;
        default:
            throw new Error(`Ação de serviço inválida: ${action}`);
    }
}

// Normaliza o valor de --tail (nº de linhas históricas). Default 100, teto 5000
// para evitar despejar arquivos de log gigantes de uma vez.
function normalizeTail(tail) {
    const n = parseInt(tail, 10);
    if (!Number.isInteger(n) || n < 0) return 100;
    return Math.min(n, 5000);
}

// Monta o comando de streaming de logs (docker compose logs -f).
// `service` é opcional: sem service = todos os serviços do projeto.
// 2>&1 para trazer também o que o docker escreve em stderr. O chamador (main)
// DEVE validar composeFile/service contra a allowlist descoberta antes de usar.
function logsCommand(composeFile, service, tail) {
    const f = shellQuote(composeFile);
    // --ansi always: força cor mesmo sem TTY (o exec do ssh2 não aloca terminal,
    // então o compose desligaria a cor por padrão). O flag é global (antes do
    // subcomando). O renderer interpreta os códigos ANSI resultantes.
    let cmd = `docker compose --ansi always -f ${f} logs -f --tail=${normalizeTail(tail)}`;
    if (service) {
        if (!isValidServiceName(service)) {
            throw new Error(`Serviço inválido: "${service}".`);
        }
        cmd += ` ${shellQuote(service)}`;
    }
    return cmd + ' 2>&1';
}

// ---- Parsing ---------------------------------------------------------------

// Extrai a lista de arquivos compose da saída do discoverCommand.
function parseDiscoverOutput(output) {
    if (!output) return [];
    return output
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
}

// Nome do projeto = nome da pasta que contém o arquivo compose.
function projectNameFromFile(composeFile) {
    const parts = String(composeFile).split('/').filter(Boolean);
    // .../<projeto>/<arquivo-compose>
    return parts.length >= 2 ? parts[parts.length - 2] : String(composeFile);
}

// Normaliza uma entrada do `docker compose ps --format json`.
// Campos relevantes (compose v2): Service, State, Health, Name.
function normalizePsEntry(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const service = obj.Service || obj.service || '';
    if (!service) return null;
    return {
        service: String(service),
        state: String(obj.State || obj.state || '').toLowerCase(),
        health: String(obj.Health || obj.health || '').toLowerCase(),
        name: String(obj.Name || obj.name || ''),
    };
}

// Parser tolerante do `ps --format json`. Aceita: (a) um array JSON único, ou
// (b) NDJSON (um objeto JSON por linha) — ambos ocorrem conforme a versão.
function parseComposePs(output) {
    if (!output || !output.trim()) return [];
    const txt = output.trim();
    try {
        const parsed = JSON.parse(txt);
        if (Array.isArray(parsed)) return parsed.map(normalizePsEntry).filter(Boolean);
        if (parsed && typeof parsed === 'object') {
            const one = normalizePsEntry(parsed);
            return one ? [one] : [];
        }
    } catch (_) {
        // não é um JSON único — trata como NDJSON abaixo
    }
    return txt
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
            try {
                return normalizePsEntry(JSON.parse(l));
            } catch (_) {
                return null;
            }
        })
        .filter(Boolean);
}

// ---- Mapeamento de estado --------------------------------------------------

// Converte o estado de um container do compose para os estados da UI existente
// (STATUS_VIEW: running | stopped | pending | error | unknown).
function mapDockerState(entry) {
    const st = String(entry && entry.state || '').toLowerCase();
    if (st === 'running') {
        return entry.health === 'unhealthy' ? 'error' : 'running';
    }
    if (st === 'restarting' || st === 'created' || st === 'removing' || st === 'paused') {
        return 'pending';
    }
    if (st === 'exited' || st === 'dead') {
        return 'stopped';
    }
    return 'unknown';
}

// Agrega uma lista de estados individuais em um único estado (projeto/servidor):
// todos running => running; todos stopped => stopped; nenhum => unknown;
// qualquer error => error; caso contrário (misto/pendente) => pending.
function aggregateState(states) {
    const list = (states || []).filter(Boolean);
    if (list.length === 0) return 'unknown';
    if (list.some((s) => s === 'error')) return 'error';
    if (list.every((s) => s === 'running')) return 'running';
    if (list.every((s) => s === 'stopped')) return 'stopped';
    return 'pending';
}

module.exports = {
    shellQuote,
    isValidServiceName,
    discoverCommand,
    psCommand,
    projectCommand,
    serviceCommand,
    normalizeTail,
    logsCommand,
    parseDiscoverOutput,
    projectNameFromFile,
    parseComposePs,
    mapDockerState,
    aggregateState,
};
