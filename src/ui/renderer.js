/* ===================== Ícones (SVG inline) ===================== */
// Conjunto de contorno lucide (https://lucide.dev, licença ISC), traço 2px.
// O traçado herda a cor do elemento (currentColor). Nada de emoji/unicode.
const ICON_PATHS = {
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  square: '<rect width="18" height="18" x="3" y="3" rx="2"/>',
  'rotate-cw': '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
  'align-left': '<path d="M21 6H3"/><path d="M15 12H3"/><path d="M17 18H3"/>',
  'more-vertical': '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  'key-round':
    '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
  package:
    '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  'sliders-horizontal':
    '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>',
  'triangle-alert':
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'trash-2':
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'refresh-cw':
    '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  pencil:
    '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  eraser:
    '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  'circle-x': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'loader-circle': '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
};

function iconSvg(name) {
  const inner = ICON_PATHS[name];
  if (!inner) return '';
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    inner +
    '</svg>'
  );
}

// Aplica um ícone a qualquer elemento marcado com data-icon="nome".
function hydrateIcons(root) {
  (root || document).querySelectorAll('[data-icon]').forEach((el) => {
    const svg = iconSvg(el.getAttribute('data-icon'));
    if (svg) el.insertAdjacentHTML('afterbegin', svg);
  });
}

/* ===================== Frase de humor aleatória (sob o nome do app) ===================== */
// Sorteada a cada abertura; fica no topo da barra lateral, abaixo do nome.
(function initSubtitle() {
  const COFFEE_PHRASES = [
    'Primeiro o café. Depois o deploy.',
    'Café é meu ambiente de produção.',
    'Sem café, só tem rollback.',
    'Café: minha dependência favorita.',
    'Commit. Push. Café.',
    'O café passou, o deploy nem tanto.',
    'Café forte, código mais forte.',
    'Deploy sem café é bug anunciado.',
    'Meu código roda a café.',
    'Sem café, nem o Git ajuda.',
    'Café resolve. O resto a gente debuga.',
    'O bug acordou antes do café.',
    'Não é bug, é feature temporária.',
    'Funciona na minha máquina.',
    'Hoje tem deploy, amanhã tem rollback.',
    'Café quente, produção fria.',
    'Debug é terapia com café.',
    'Mais café, menos reunião.',
    'Café em uma mão, teclado na outra.',
    'O cache mente, o café não.',
    'Café é o verdadeiro DevOps.',
    'Sem logs, sem paz.',
    'Meu CI é Café Integrado.',
    'Meu CD é Café Delivery.',
    'Café: uptime de 99,99%.',
    'Deploy de sexta é pedido de demissão.',
    'Dormir é opcional. Café não.',
    'Ctrl + S salva arquivos. Café salva vidas.',
    'O café compila até esperança.',
    'Keep Calm and Drink Coffee.',
    'Código limpo, caneca suja.',
    'Menos bugs, mais café.',
    'Café: combustível do desenvolvedor.',
    'Se tem café, tem solução.',
    'A vida é curta demais para deploy sem café.',
    'Todo bug merece um café antes.',
    'A documentação acaba, o café também.',
    'Reiniciou? Então toma um café.',
    'Café é o patch da segunda-feira.',
    'Git blame, café e paciência.',
  ];

  window.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('brand-tagline');
    if (el) el.textContent = COFFEE_PHRASES[Math.floor(Math.random() * COFFEE_PHRASES.length)];
  });
})();

/* ===================== Estado ===================== */
let groups = [];
let groupsLoaded = false; // cadastro lido do cofre (antes disso: skeleton)
let groupsError = null; // falha ao ler o cofre (mensagem exibida na tabela)
let currentGroupId = null;
// Estado por chave: windows => serverId; docker projeto => serverId::composeFile;
// docker serviço => serverId::composeFile::service.
let statusByKey = {}; // key -> 'running' | 'stopped' | 'pending' | 'error' | 'unknown'
let statusTimer = null;
// Intervalo do polling em ms; configurável pelo usuário. 0 = desligado (só manual).
let statusPollMs = 30000;

// Converte segundos (config do usuário) para ms de polling: 0 desliga; >=5 vale;
// qualquer outra coisa cai no padrão de 30s.
function normalizePollMs(seconds) {
  const n = Number(seconds);
  if (n === 0) return 0;
  if (Number.isFinite(n) && n >= 5) return Math.floor(n) * 1000;
  return 30000;
}

// Estado da árvore docker (descoberta sob demanda ao expandir)
let dockerTreeByServer = {}; // serverId -> { projects: [{composeFile,name,services:[]}] }
const expandedServers = new Set(); // serverIds docker expandidos
const discoveringServers = new Set(); // descobertas em andamento (evita chamadas duplicadas)
const refreshingDocker = new Set(); // atualizações (polling) em andamento — não empilha ticks

// Leituras recebidas nesta sessão do grupo: diferencia "ainda lendo" de "desconhecido".
const statusSeen = new Set(); // chaves de status que já receberam leitura
const dockerOffline = new Set(); // servidores docker cuja última leitura falhou (SSH)
let lastReadAt = null; // hora da última leitura de status (ms)

// Busca e filtro da barra de ferramentas
let searchQuery = '';
let statusFilter = 'all'; // all | running | partial | offline

// Última saúde vista de cada grupo nesta sessão (só o grupo aberto é consultado)
const groupHealth = {}; // groupId -> ok | warn | err | off | none

// Servidores selecionados para ações em lote (do grupo aberto)
const selectedServers = new Set();

// Limpa todo o estado de docker/status (troca de grupo)
function resetTreeState() {
  statusByKey = {};
  dockerTreeByServer = {};
  expandedServers.clear();
  discoveringServers.clear();
  statusSeen.clear();
  dockerOffline.clear();
  selectedServers.clear();
  busy.forEach((entry) => clearTimeout(entry.timer));
  busy.clear();
  clearRowErrors();
  lastReadAt = null;
}

// Esquece o estado de um servidor (removido ou com cadastro alterado).
// `removed`: o servidor saiu do cadastro (só então sai também da seleção).
function forgetServerState(serverId, { removed = false } = {}) {
  const prefix = serverId + '::';
  Object.keys(statusByKey).forEach((k) => {
    if (k === serverId || k.startsWith(prefix)) delete statusByKey[k];
  });
  [...statusSeen].forEach((k) => {
    if (k === serverId || k.startsWith(prefix)) statusSeen.delete(k);
  });
  delete dockerTreeByServer[serverId];
  expandedServers.delete(serverId);
  dockerOffline.delete(serverId);
  if (removed) selectedServers.delete(serverId);
  clearBusyServer(serverId);
  delete rowErrors[serverId];
  offlineNotified.delete(serverId);
}

/* ===================== Status derivado (linha, resumo, saúde, filtros) ===================== */
// Estado de exibição de um servidor. `tone` define a cor (pílula/saúde) e o
// texto acompanha sempre a cor (nunca só a cor indica o estado).
const SERVER_VIEW = {
  loading: { label: 'Lendo…', tone: 'off' },
  running: { label: 'Ativo', tone: 'ok' },
  partial: { label: 'Parcial', tone: 'warn' },
  restarting: { label: 'Reiniciando…', tone: 'warn' }, // ação disparada pela UI (rótulo de BUSY_LABEL)
  transition: { label: 'Em transição…', tone: 'warn' }, // START/STOP_PENDING, restarting/created no docker
  stopped: { label: 'Parado', tone: 'off' },
  offline: { label: 'Sem conexão', tone: 'err' },
  failing: { label: 'Com falha', tone: 'err' },
  unknown: { label: 'Desconhecido', tone: 'off' },
};

function isDockerServer(s) {
  return (s.type || 'windows') === 'docker';
}

// Converte o estado lido (statusByKey) no estado de exibição do servidor.
// Windows: 'error' = falha de SSH (sem conexão); 'pending' = START/STOP_PENDING.
// Docker:  agregado dos containers; 'pending' = misto (parcial); 'error' = unhealthy.
function serverView(s) {
  if (busy.has(s.id)) return 'restarting'; // ação em andamento (rótulo vem de BUSY_LABEL)
  return serverReadView(s);
}

// Estado lido do servidor, sem considerar ação em andamento. É o que os
// filtros usam: a linha não some da lista no instante em que a ação começa.
function serverReadView(s) {
  if (isDockerServer(s) && dockerOffline.has(s.id)) return 'offline';
  if (!statusSeen.has(s.id)) return 'loading';
  const st = statusByKey[s.id];
  if (isDockerServer(s)) {
    const tree = dockerTreeByServer[s.id];
    if (tree && (!tree.projects || tree.projects.length === 0)) return 'unknown';
    const containers = dockerContainers(s.id);
    if (containers) return dockerViewOf(containers.map((c) => c.state));
    return { running: 'running', stopped: 'stopped', pending: 'transition', error: 'failing' }[st] || 'unknown';
  }
  return { running: 'running', stopped: 'stopped', pending: 'transition', error: 'offline' }[st] || 'unknown';
}

// Containers do servidor (ordem do compose), com o estado mais recente lido.
// null quando a árvore ainda não foi lida.
function dockerContainers(serverId) {
  const tree = dockerTreeByServer[serverId];
  if (!tree) return null;
  const list = [];
  (tree.projects || []).forEach((p) => {
    (p.services || []).forEach((svc) => {
      const key = `${serverId}::${p.composeFile}::${svc.service}`;
      list.push({ project: p, service: svc.service, key, state: statusByKey[key] || svc.state || 'unknown' });
    });
  });
  return list;
}

// Estado de exibição a partir dos containers: Ativo (todos rodando), Parado
// (todos parados ou nenhum container), Reiniciando (em transição, sem parados),
// Com falha (algum unhealthy) e Parcial (algum parado entre os ativos).
function dockerViewOf(states) {
  if (states.length === 0) return 'stopped';
  if (states.some((st) => st === 'error')) return 'failing';
  if (states.every((st) => st === 'running')) return 'running';
  if (states.every((st) => st === 'stopped')) return 'stopped';
  if (states.some((st) => st === 'pending') && !states.some((st) => st === 'stopped')) return 'transition';
  return 'partial';
}

function countViews(servers) {
  const counts = { total: servers.length };
  Object.keys(SERVER_VIEW).forEach((k) => (counts[k] = 0));
  servers.forEach((s) => counts[serverView(s)]++);
  return counts;
}

// Pior saúde do grupo: err > warn > off > ok; 'none' sem nenhuma leitura.
const HEALTH_RANK = { ok: 1, off: 2, warn: 3, err: 4 };
function groupHealthOf(group) {
  let worst = 'none';
  (group ? group.servers : []).forEach((s) => {
    const view = serverView(s);
    if (view === 'loading') return;
    const tone = SERVER_VIEW[view].tone;
    if (worst === 'none' || HEALTH_RANK[tone] > HEALTH_RANK[worst]) worst = tone;
  });
  return worst;
}

const HEALTH_LABEL = {
  ok: 'todos ativos',
  warn: 'atenção: parcial, em andamento ou em transição',
  err: 'falha ou sem conexão',
  off: 'parado ou desconhecido',
  none: 'sem leitura nesta sessão',
};

function matchesSearch(s, query) {
  if (!query) return true;
  return [s.host, s.composeDir, s.serviceName, s.servicePath]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(query));
}

const FILTER_MATCH = {
  all: () => true,
  running: (view) => view === 'running',
  partial: (view) => view === 'partial',
  offline: (view) => view === 'offline',
};

function searchedServers() {
  const group = currentGroup();
  const query = searchQuery.trim().toLowerCase();
  return group ? group.servers.filter((s) => matchesSearch(s, query)) : [];
}

// Servidores visíveis: busca e filtro combinados.
function visibleServers() {
  const match = FILTER_MATCH[statusFilter] || FILTER_MATCH.all;
  return searchedServers().filter((s) => match(serverReadView(s)));
}

/* ===================== Toasts (feedback imediato) ===================== */
const TOAST_ICON = { ok: 'check', error: 'circle-x', warn: 'triangle-alert', info: 'info' };
const TOAST_LEVEL = {
  ok: 'ok',
  success: 'ok',
  error: 'error',
  warn: 'warn',
  warning: 'warn',
  info: 'info',
};

function toast(level, message, opts) {
  const container = document.getElementById('toast-container');
  if (!container || !message) return;
  const lvl = TOAST_LEVEL[level] || 'info';

  const el = document.createElement('div');
  el.className = 'toast toast-' + lvl;
  el.setAttribute('role', lvl === 'error' ? 'alert' : 'status');

  const ic = document.createElement('span');
  ic.className = 'toast-icon';
  ic.innerHTML = iconSvg(TOAST_ICON[lvl]);

  const msg = document.createElement('span');
  msg.className = 'toast-msg';
  msg.textContent = message;

  const close = document.createElement('button');
  close.className = 'toast-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Fechar aviso');
  close.innerHTML = iconSvg('x');

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    el.classList.remove('show');
    setTimeout(() => el.remove(), 220);
  };
  close.addEventListener('click', dismiss);

  el.appendChild(ic);
  el.appendChild(msg);
  el.appendChild(close);
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));

  const ttl = opts && typeof opts.ttl === 'number' ? opts.ttl : lvl === 'error' ? 7000 : 4000;
  if (ttl > 0) setTimeout(dismiss, ttl);

  // Teto de toasts simultâneos
  while (container.children.length > 5) container.firstChild.remove();
}

/* ===== Badge de "novidades" no botão Histórico ===== */
let historyHasError = false;
function bumpHistoryBadge(level) {
  const modal = document.getElementById('history-modal');
  if (modal && isLayerOpen(modal)) return; // aberto: usuário já está vendo
  if (level === 'error') historyHasError = true;
  const badge = document.getElementById('history-badge');
  if (!badge) return;
  badge.hidden = false;
  badge.classList.toggle('has-error', historyHasError);
  setHistoryLabel(historyHasError ? 'novos erros' : 'novos eventos');
}

// O ponto só muda de cor; o nome do botão diz o que há de novo.
function setHistoryLabel(extra) {
  const btn = document.getElementById('history-open');
  if (!btn) return;
  const label = 'Histórico de ações' + (extra ? ' — ' + extra : '');
  btn.setAttribute('aria-label', label);
  btn.title = label;
}
function clearHistoryBadge() {
  historyHasError = false;
  const badge = document.getElementById('history-badge');
  if (badge) {
    badge.hidden = true;
    badge.classList.remove('has-error');
  }
  setHistoryLabel('');
}

const SERVICE_NAME_RE = /^[A-Za-z0-9_.\- ]+$/;
const HOST_RE = /^[A-Za-z0-9_.\-]+$/;
// Espelha vault.isValidWindowsPath (caminho Windows seguro, sem "..").
const WIN_PATH_RE = /^[A-Za-z]:[\\/][A-Za-z0-9 _.\-()\\/]*$/;
function isValidWindowsPathUI(p) {
  return typeof p === 'string' && p.length > 0 && p.length <= 512 && !p.includes('..') && WIN_PATH_RE.test(p);
}
// Espelha vault.isValidComposeDir (caminho absoluto seguro, sem "..").
const COMPOSE_DIR_RE = /^\/[A-Za-z0-9_.\-\/]*$/;
function isValidComposeDirUI(dir) {
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

// "Error invoking remote method 'x': Error: msg" → "msg"
function cleanError(e) {
  const msg = e && e.message ? e.message : String(e);
  return msg.replace(/^Error invoking remote method '[^']+':\s*(?:\w*Error:\s*)?/, '');
}

function currentGroup() {
  return groups.find((g) => g.id === currentGroupId) || null;
}

/* ===================== Prompt de texto (sem window.prompt) ===================== */
// Diálogo com um campo de texto. Resolve o texto digitado (sem espaços nas
// pontas) ou null se cancelado (botão, Esc ou clique fora). O título entra
// como texto (nunca HTML): pode conter nomes vindos do cadastro.
function promptText(title, defaultValue = '', opts = {}) {
  return new Promise((resolve) => {
    const scrim = el('div', 'drawer-scrim dialog-scrim');
    scrim.hidden = true;
    const dialog = el('div', 'dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    const titleId = 'prompt-title-' + Date.now();
    dialog.setAttribute('aria-labelledby', titleId);

    const head = el('header', 'dialog-head');
    const h = el('h2', 'dialog-title', title);
    h.id = titleId;
    head.appendChild(h);

    const form = el('form', 'dialog-body');
    form.noValidate = true;
    const label = el('label', 'field');
    const input = el('input', 'input prompt-input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.value = defaultValue;
    input.setAttribute('aria-labelledby', titleId);
    label.appendChild(input);
    form.appendChild(label);

    const foot = el('footer', 'dialog-foot');
    const cancel = el('button', 'btn btn-secondary', 'Cancelar');
    cancel.type = 'button';
    const ok = el('button', 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary'), opts.confirmLabel || 'OK');
    ok.type = 'submit';
    ok.setAttribute('form', form.id = 'prompt-form-' + Date.now());
    foot.append(cancel, ok);

    dialog.append(head, form, foot);
    scrim.appendChild(dialog);
    document.body.appendChild(scrim);

    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      closeLayer(scrim);
      setTimeout(() => scrim.remove(), 300);
      resolve(value);
    };
    cancel.addEventListener('click', () => finish(null));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      finish(input.value.trim());
    });
    scrim.addEventListener('mousedown', (e) => {
      if (e.target === scrim) finish(null);
    });
    openLayer(scrim, { initialFocus: '.prompt-input', onClose: () => finish(null) });
    input.select();
  });
}

/* ===================== Grupos ===================== */
// Recarrega os grupos do cofre. Mantém o grupo aberto (ou abre `selectId`).
// No mesmo grupo, só esquece o estado de servidores removidos/alterados —
// os demais seguem com a última leitura (sem voltar a "Lendo…" após um CRUD).
async function reloadGroups(selectId) {
  const rediscover = [];
  const prevGroupId = currentGroupId;
  const prevGroup = currentGroup();
  groups = await window.api.listGroups();
  groupsLoaded = true;

  if (groups.length === 0) {
    currentGroupId = null;
  } else if (selectId && groups.some((g) => g.id === selectId)) {
    currentGroupId = selectId;
  } else if (!groups.some((g) => g.id === prevGroupId)) {
    currentGroupId = groups[0].id;
  }

  if (currentGroupId !== prevGroupId) {
    // trocou de grupo (criar/importar/excluir): guarda a saúde vista do anterior
    if (prevGroup) groupHealth[prevGroup.id] = groupHealthOf(prevGroup);
    resetTreeState();
  } else if (prevGroup) {
    const next = new Map(currentGroup().servers.map((s) => [s.id, s]));
    const KEYS = ['type', 'host', 'port', 'username', 'serviceName', 'servicePath', 'composeDir'];
    prevGroup.servers.forEach((s) => {
      const n = next.get(s.id);
      if (!n) {
        forgetServerState(s.id, { removed: true });
      } else if (KEYS.some((k) => s[k] !== n[k])) {
        forgetServerState(s.id);
        // docker editado: redescobre (o main refaz a lista de projetos permitidos)
        if (isDockerServer(n)) rediscover.push(n.id);
      }
    });
  }
  renderServers();
  renderChrome();
  startStatusPolling();
  rediscover.forEach((id) => discoverDockerTree(id));
}

// Lê os grupos sem travar a tela: em falha (ex.: cofre indisponível) mostra o
// erro na tabela com "Tentar novamente" em vez de ficar em "Carregando…".
async function loadGroupsSafely(selectId) {
  try {
    groupsError = null;
    await reloadGroups(selectId);
  } catch (e) {
    groupsError = cleanError(e);
    groupsLoaded = true;
    groups = [];
    currentGroupId = null;
    renderServers();
    renderChrome();
    toast('error', 'Não foi possível carregar os grupos: ' + groupsError);
  }
}

function retryLoadGroups() {
  groupsError = null;
  groupsLoaded = false;
  renderServers();
  renderChrome();
  loadGroupsSafely(currentGroupId);
}

// Abre outro grupo (barra lateral).
function selectGroup(groupId) {
  if (!groupId || groupId === currentGroupId) return;
  rememberGroupHealth();
  currentGroupId = groupId;
  resetTreeState(); // limpa status/árvore do grupo anterior
  renderServers();
  renderChrome();
  startStatusPolling();
}

// Novo grupo (barra lateral, estado vazio e painel de configurações).
async function createGroupFlow() {
  const name = await promptText('Nome do novo grupo');
  if (!name) return;
  try {
    const g = await window.api.createGroup(name);
    await reloadGroups(g.id);
  } catch (e) {
    log('error', '', '', e.message);
  }
}

// Importação de .ini/.json (cria um grupo com os servidores do arquivo).
async function importGroupFlow() {
  try {
    const res = await window.api.importFile();
    if (res.canceled) return;
    if (res.imported > 0) {
      log('ok', '', '', `Importados ${res.imported} servidor(es) para o grupo "${res.group.name}".`);
      await reloadGroups(res.group.id);
    }
    (res.errors || []).forEach((msg) => log('warn', '', '', msg));
  } catch (e) {
    log('error', '', '', e.message);
  }
}

// Iniciais do grupo para a barra recolhida: "TOTVS Produção" → "TP", "KINGPOSTO" → "KI".
function initialsOf(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return String(name || '?').slice(0, 2).toUpperCase();
}

function rememberGroupHealth() {
  const group = currentGroup();
  if (group) groupHealth[group.id] = groupHealthOf(group);
}

/* ---- Barra lateral: lista de grupos ---- */
function renderGroupNav() {
  const list = document.getElementById('group-list');
  if (groups.length === 0) {
    const li = keyed(document.createElement('li'), 'grp:empty');
    li.className = 'group-empty';
    li.textContent = groupsLoaded ? 'Nenhum grupo — crie ou importe um .ini/.json.' : '';
    reconcile(list, [li]);
    return;
  }
  const items = groups.map((g) => {
    const li = keyed(document.createElement('li'), 'grp:' + g.id, g.id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'group-item';
    if (g.id === currentGroupId) btn.setAttribute('aria-current', 'page');

    const health = g.id === currentGroupId ? groupHealthOf(g) : groupHealth[g.id] || 'none';
    const count = g.servers.length;
    btn.title = `${g.name} — ${HEALTH_LABEL[health]}`;
    // Nome acessível completo (vale também com a barra recolhida, só com iniciais)
    btn.setAttribute(
      'aria-label',
      `${g.name}${g.critical ? ', crítico' : ''}, ${plural(count, 'servidor', 'servidores')}, ${HEALTH_LABEL[health]}`
    );

    const dot = document.createElement('span');
    dot.className = 'health-dot is-' + health;
    dot.setAttribute('aria-hidden', 'true');
    btn.appendChild(dot);

    const name = document.createElement('span');
    name.className = 'group-name';
    name.textContent = g.name;
    btn.appendChild(name);

    // Iniciais: aparecem só com a barra lateral recolhida (< 900px)
    const initials = el('span', 'group-initials', initialsOf(g.name));
    initials.setAttribute('aria-hidden', 'true');
    btn.appendChild(initials);

    if (g.critical) {
      const pill = document.createElement('span');
      pill.className = 'pill pill-warn pill-sm';
      pill.textContent = 'Crítico';
      btn.appendChild(pill);
    } else {
      btn.appendChild(document.createElement('span'));
    }

    btn.appendChild(el('span', 'group-count', String(count)));

    btn.dataset.fid = 'grp:' + g.id;
    btn.addEventListener('click', () => selectGroup(g.id));
    li.appendChild(btn);
    return li;
  });
  reconcile(list, items);
}

/* ---- Cabeçalho: título, resumo, leitura automática ---- */
function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

function summaryText(group) {
  const c = countViews(group.servers);
  if (c.total === 0) return 'Nenhum servidor cadastrado';
  const parts = [plural(c.total, 'servidor', 'servidores')];
  if (c.loading === c.total) return parts.concat('lendo status…').join(' · ');
  parts.push(plural(c.running, 'ativo', 'ativos'));
  if (c.partial) parts.push(plural(c.partial, 'parcial', 'parciais'));
  if (c.restarting) parts.push(`${c.restarting} em andamento`);
  if (c.transition) parts.push(`${c.transition} em transição`);
  if (c.stopped) parts.push(plural(c.stopped, 'parado', 'parados'));
  if (c.failing) parts.push(`${c.failing} com falha`);
  if (c.offline) parts.push(`${c.offline} sem conexão`);
  if (c.unknown) parts.push(plural(c.unknown, 'desconhecido', 'desconhecidos'));
  return parts.join(' · ');
}

function renderPageHead() {
  const group = currentGroup();
  document.getElementById('group-title').textContent = group
    ? group.name
    : groupsError
    ? 'Grupos indisponíveis'
    : groupsLoaded
    ? 'Nenhum grupo'
    : '';
  document.getElementById('group-critical-pill').hidden = !(group && group.critical);
  document.getElementById('group-summary').textContent = group
    ? summaryText(group)
    : groupsError
    ? groupsError
    : groupsLoaded
    ? 'Crie um grupo ou importe um arquivo .ini/.json para começar.'
    : 'Carregando grupos…';
  renderRefreshInfo();
}

function renderRefreshInfo() {
  const auto = statusPollMs > 0;
  document.getElementById('refresh-dot').classList.toggle('is-auto', auto);
  const el = document.getElementById('refresh-text');
  el.textContent = auto ? `Automática · ${Math.round(statusPollMs / 1000)} s` : 'Automática desligada';
  if (lastReadAt) {
    el.append(' · ');
    const time = document.createElement('span');
    time.className = 'refresh-time';
    time.textContent = new Date(lastReadAt).toLocaleTimeString('pt-BR', { hour12: false });
    time.title = 'Hora da última leitura de status';
    el.appendChild(time);
  }
}

/* ---- Barra de saúde: segmentos proporcionais ---- */
function renderHealthBar() {
  const bar = document.getElementById('health-bar');
  const group = currentGroup();
  const c = countViews(group ? group.servers : []);
  const segments = [
    ['ok', c.running],
    ['warn', c.partial + c.restarting + c.transition],
    ['err', c.offline + c.failing],
    ['off', c.stopped + c.unknown],
    ['loading', c.loading],
  ];
  const nodes = [];
  segments.forEach(([tone, n]) => {
    if (!n) return;
    const seg = keyed(document.createElement('span'), 'seg:' + tone);
    seg.className = 'health-seg is-' + tone;
    seg.style.flexGrow = String(n);
    nodes.push(seg);
  });
  reconcile(bar, nodes);
  const label = c.total
    ? 'Saúde do grupo: ' + summaryText(group).replace(/ · /g, ', ')
    : 'Sem servidores no grupo';
  bar.setAttribute('aria-label', label);
}

/* ---- Filtros: contagens por estado (respeitando a busca) ---- */
function renderFilterCounts() {
  const servers = searchedServers();
  const views = servers.map(serverReadView);
  const counts = {
    all: servers.length,
    running: views.filter((v) => v === 'running').length,
    partial: views.filter((v) => v === 'partial').length,
    offline: views.filter((v) => v === 'offline').length,
  };
  document.querySelectorAll('#status-filter [data-count]').forEach((el) => {
    el.textContent = String(counts[el.getAttribute('data-count')] || 0);
  });
}

function setStatusFilter(filter) {
  statusFilter = FILTER_MATCH[filter] ? filter : 'all';
  document.querySelectorAll('#status-filter button[data-filter]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.filter === statusFilter));
  });
  renderServers();
  renderBatchBar();
}

function clearFilters() {
  searchQuery = '';
  document.getElementById('search-input').value = '';
  setStatusFilter('all');
  renderFilterCounts();
}

// Tudo o que depende dos status (fora a tabela): barra lateral, cabeçalho,
// saúde e contagens. Agrupado por frame — várias leituras chegam juntas.
function renderChrome() {
  renderGroupNav();
  renderPageHead();
  renderHealthBar();
  renderFilterCounts();
  renderBatchBar();
}

/* ===================== Tabela de servidores ===================== */
// Renderização declarativa a partir do estado. Leituras de status agendam um
// novo render por frame (scheduleRender); o foco do teclado (data-fid) e o
// menu "⋯" aberto são preservados entre renders.

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

/* ---- Reconciliação incremental do DOM ---- */
// Em vez de recriar a tabela a cada leitura de status (o que perde cliques em
// andamento, tira o foco do teclado e impede as transições), os nós com a mesma
// chave (data-key) e a mesma assinatura de dados (data-sig) são reaproveitados
// e só têm atributos/textos atualizados. Assinatura diferente = nó novo (os
// handlers do nó antigo capturam dados que mudaram).

// Copia para `old` o que mudou em `neu`; false se a forma é diferente.
function patchNode(old, neu) {
  if (old.nodeType !== neu.nodeType || old.nodeName !== neu.nodeName) return false;
  if (old.nodeType === Node.TEXT_NODE) {
    if (old.nodeValue !== neu.nodeValue) old.nodeValue = neu.nodeValue;
    return true;
  }
  if (old.nodeType !== Node.ELEMENT_NODE) return true;
  [...old.attributes].forEach(({ name }) => {
    if (!neu.hasAttribute(name)) old.removeAttribute(name);
  });
  [...neu.attributes].forEach(({ name, value }) => {
    if (old.getAttribute(name) !== value) old.setAttribute(name, value);
  });
  if (old.nodeName === 'INPUT') {
    old.checked = neu.checked;
    old.indeterminate = neu.indeterminate;
  }
  const oc = [...old.childNodes];
  const nc = [...neu.childNodes];
  if (oc.length !== nc.length) {
    old.replaceChildren(...nc);
    return true;
  }
  oc.forEach((o, i) => {
    if (!patchNode(o, nc[i])) o.replaceWith(nc[i]);
  });
  return true;
}

// Deixa os filhos de `parent` iguais a `nodes`, reaproveitando por data-key.
function reconcile(parent, nodes) {
  const byKey = new Map();
  [...parent.children].forEach((n) => {
    if (n.dataset && n.dataset.key) byKey.set(n.dataset.key, n);
  });
  let cursor = parent.firstChild;
  nodes.forEach((node) => {
    let use = node;
    const old = node.dataset && node.dataset.key ? byKey.get(node.dataset.key) : null;
    if (old && old.dataset.sig === node.dataset.sig) {
      byKey.delete(node.dataset.key);
      if (patchNode(old, node)) use = old;
    }
    if (use === cursor) cursor = cursor.nextSibling;
    else parent.insertBefore(use, cursor);
  });
  while (cursor) {
    const next = cursor.nextSibling;
    cursor.remove();
    cursor = next;
  }
}

function keyed(node, key, sig) {
  node.dataset.key = key;
  node.dataset.sig = sig || '';
  return node;
}

// Assinatura dos dados cadastrais de um servidor (os handlers dependem deles).
function serverSig(s) {
  return JSON.stringify([s.type, s.host, s.port, s.username, s.serviceName, s.servicePath, s.composeDir, s.hasPassword]);
}

function iconEl(name, className) {
  const span = el('span', className || 'ic');
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = iconSvg(name);
  return span;
}

// Botão só de ícone: aria-label obrigatório; `fid` estável p/ restaurar o foco.
// `spinning`: ação em andamento — vira spinner, desabilitado e aria-busy.
function iconButton(icon, label, opts = {}) {
  const classes = ['icon-btn'];
  if (opts.tone) classes.push('tone-' + opts.tone);
  if (opts.className) classes.push(opts.className);
  if (opts.spinning) classes.push('is-busy');
  const b = el('button', classes.join(' '));
  b.type = 'button';
  b.innerHTML = iconSvg(opts.spinning ? 'loader-circle' : icon);
  b.setAttribute('aria-label', opts.spinning ? `${label} (em andamento)` : label);
  b.title = opts.title || label;
  if (opts.fid) b.dataset.fid = opts.fid;
  if (opts.spinning) {
    // aria-disabled (não disabled): o botão em andamento continua focável
    b.setAttribute('aria-busy', 'true');
    b.setAttribute('aria-disabled', 'true');
  }
  if (opts.disabled && !opts.spinning) b.disabled = true;
  if (opts.onClick) {
    b.addEventListener('click', (e) => {
      if (b.getAttribute('aria-disabled') === 'true') return; // estado atual (o nó é reaproveitado)
      opts.onClick(e);
    });
  }
  return b;
}

// Botão de ação ligado a uma chave de status: aplica o estado "em andamento".
function actionButton(icon, label, key, action, opts = {}) {
  const st = actionState(key, action);
  return iconButton(icon, label, { ...opts, spinning: st.spinning, disabled: opts.disabled || st.disabled });
}

function skeleton(className) {
  const s = el('span', 'skeleton ' + className);
  s.setAttribute('aria-hidden', 'true');
  return s;
}

function cell(className) {
  const c = el('div', 'cell' + (className ? ' ' + className : ''));
  c.setAttribute('role', 'cell');
  return c;
}

function rowEl(className) {
  const row = el('div', 'srv-row' + (className ? ' ' + className : ''));
  row.setAttribute('role', 'row');
  return row;
}

// Pílula de status; `label` sobrescreve o rótulo (ex.: Parando… durante a ação).
// Ainda sem leitura: skeleton (com texto só para leitores de tela).
function statusPill(view, label) {
  if (view === 'loading') {
    const wrap = el('span', 'pill-loading');
    wrap.append(skeleton('skeleton-pill'), el('span', 'sr-only', 'Lendo status'));
    return wrap;
  }
  const meta = SERVER_VIEW[view] || SERVER_VIEW.unknown;
  const pill = el('span', 'pill pill-' + meta.tone);
  const dot = el('span', 'pill-dot');
  dot.setAttribute('aria-hidden', 'true');
  pill.appendChild(dot);
  pill.appendChild(document.createTextNode(label || meta.label));
  return pill;
}

function findServer(serverId) {
  const group = currentGroup();
  return group ? group.servers.find((s) => s.id === serverId) || null : null;
}

/* ---- Ação em andamento ---- */
// Ao clicar numa ação, a chave (servidor, projeto ou container) fica "em
// andamento": o botão clicado vira spinner, os demais da linha ficam
// desabilitados e o status mostra Iniciando…/Parando…/Reiniciando… (âmbar).
// Termina quando chega a leitura daquela chave (o backend reconsulta o estado
// ao fim de cada ação); para "todos os projetos" de um servidor docker, quando
// chegam as leituras de todos os projetos. Um teto de tempo evita travar.
const busy = new Map(); // chave de status -> { action, files?: Set, timer }
const BUSY_TIMEOUT_MS = 120000;
const BUSY_LABEL = {
  start: 'Iniciando…',
  up: 'Iniciando…',
  stop: 'Parando…',
  down: 'Parando…',
  restart: 'Reiniciando…',
};

function setBusy(key, action, extra = {}) {
  clearBusy(key);
  const entry = { action, ...extra };
  entry.timer = setTimeout(() => {
    if (busy.get(key) === entry) {
      busy.delete(key);
      scheduleRender();
    }
  }, BUSY_TIMEOUT_MS);
  busy.set(key, entry);
  scheduleRender();
}

function clearBusy(key) {
  const entry = busy.get(key);
  if (!entry) return;
  clearTimeout(entry.timer);
  busy.delete(key);
}

// Encerra a ação de qualquer chave do servidor (ex.: erro antes de qualquer leitura).
function clearBusyServer(serverId) {
  [...busy.keys()].forEach((key) => {
    if (key === serverId || key.startsWith(serverId + '::')) clearBusy(key);
  });
}

function dockerHasNoProjects(serverId) {
  const tree = dockerTreeByServer[serverId];
  return Boolean(tree && (!tree.projects || tree.projects.length === 0));
}

// Uma leitura chegou para `key`: conclui a ação correspondente.
function settleBusyFromStatus(key) {
  clearBusy(key);
  const parts = String(key).split('::');
  if (parts.length !== 2) return;
  // leitura do projeto: encerra também as ações dos seus containers
  [...busy.keys()].forEach((k) => {
    if (k.startsWith(key + '::')) clearBusy(k);
  });
  reportDockerFile(parts[0], parts[1]);
}

// Um projeto terminou (leitura ou erro) dentro da ação "todos os projetos".
function reportDockerFile(serverId, file) {
  const entry = busy.get(serverId);
  if (!entry || !entry.docker) return;
  entry.reported.add(file);
  if (entry.files) {
    entry.files.delete(file);
    if (entry.files.size === 0) clearBusy(serverId);
  }
  // sem a lista de projetos ainda: syncBusyFiles conclui quando a árvore chegar
}

// A árvore chegou: completa a lista de projetos da ação "todos" em andamento.
function syncBusyFiles(serverId) {
  const entry = busy.get(serverId);
  const tree = dockerTreeByServer[serverId];
  if (!entry || !entry.docker || entry.files || !tree) return;
  entry.files = new Set((tree.projects || []).map((p) => p.composeFile).filter((file) => !entry.reported.has(file)));
  if (entry.files.size === 0) clearBusy(serverId);
}

// Erro de uma ação: encerra só o que falhou. No docker "todos os projetos", o
// erro de um projeto conclui aquele projeto; o servidor segue até os demais.
function finishActionWithError(server, entry) {
  if (!isDockerServer(server)) {
    clearBusyServer(server.id);
    return;
  }
  const [project, service] = String(entry.service || '').split('/');
  const tree = dockerTreeByServer[server.id];
  const p = tree && (tree.projects || []).find((x) => x.name === project);
  if (!p) {
    clearBusyServer(server.id); // falha antes dos projetos (ex.: descoberta)
    return;
  }
  const pk = `${server.id}::${p.composeFile}`;
  if (service) {
    clearBusy(`${pk}::${service}`);
  } else {
    clearBusy(pk);
    [...busy.keys()].forEach((k) => {
      if (k.startsWith(pk + '::')) clearBusy(k);
    });
  }
  reportDockerFile(server.id, p.composeFile);
}

function clearAllBusy() {
  [...busy.keys()].forEach(clearBusy);
}

// Estado de um botão de ação: spinner se for a ação em andamento da chave;
// desabilitado se a chave tem qualquer ação em andamento.
function actionState(key, action) {
  const entry = busy.get(key);
  return { spinning: Boolean(entry && entry.action === action), disabled: Boolean(entry) };
}

/* ---- Confirmação em grupo crítico ---- */
// Diálogo que diz quantos e quais servidores serão afetados; o botão de
// confirmar nomeia a ação ("Reiniciar 2 servidores"). Resolve true/false.
let confirmResolve = null;
const CONFIRM_MAX_ITEMS = 6;

function confirmAction({ title, message, items = [], confirmLabel, danger = false }) {
  const scrim = document.getElementById('confirm-dialog');
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  const list = document.getElementById('confirm-list');
  list.textContent = '';
  items.slice(0, CONFIRM_MAX_ITEMS).forEach((item) => {
    const li = el('li', 'dialog-item');
    li.append(el('span', 'mono', item.host), el('span', 'dialog-item-meta', item.detail || ''));
    list.appendChild(li);
  });
  if (items.length > CONFIRM_MAX_ITEMS) {
    const rest = items.length - CONFIRM_MAX_ITEMS;
    list.appendChild(el('li', 'dialog-item dialog-more', `+${rest} ${rest === 1 ? 'outro' : 'outros'}`));
  }
  list.hidden = items.length === 0;
  const ok = document.getElementById('confirm-ok');
  ok.textContent = confirmLabel;
  ok.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');

  return new Promise((resolve) => {
    if (confirmResolve) confirmResolve(false);
    confirmResolve = resolve;
    openLayer(scrim, {
      initialFocus: '#confirm-cancel',
      onClose: () => {
        if (!confirmResolve) return;
        const r = confirmResolve;
        confirmResolve = null;
        r(false);
      },
    });
  });
}

function confirmOk() {
  const r = confirmResolve;
  confirmResolve = null;
  closeLayer(document.getElementById('confirm-dialog'));
  if (r) r(true);
}

// Descrição curta de um servidor para a lista da confirmação.
function serverItem(s) {
  return { host: s.host, detail: isDockerServer(s) ? s.composeDir || '' : s.serviceName || '' };
}

/* ---- Leituras de projeto docker após uma ação ---- */
// Depois de cada ação docker o backend relê o projeto (`ps -a`) e envia um
// status por container existente e, por último, o agregado do projeto. A lista
// de containers do projeto passa a ser exatamente a recebida: após 'down' fica
// vazia (Parado); após 'up' volta com os containers recriados.
const dockerBurst = new Map(); // 'sid::file' -> [{ service, state }]

function collectContainerStatus(key, state) {
  const parts = String(key).split('::');
  const pk = parts[0] + '::' + parts[1];
  if (!dockerBurst.has(pk)) dockerBurst.set(pk, []);
  dockerBurst.get(pk).push({ service: parts[2], state });
}

function applyProjectBurst(serverId, file) {
  const pk = `${serverId}::${file}`;
  const received = dockerBurst.get(pk) || [];
  dockerBurst.delete(pk);
  const tree = dockerTreeByServer[serverId];
  const project = tree && (tree.projects || []).find((p) => p.composeFile === file);
  if (!project) return;
  const states = new Map(received.map((r) => [r.service, r.state]));
  const order = (project.services || []).map((x) => x.service);
  const names = order.filter((n) => states.has(n)).concat(received.map((r) => r.service).filter((n) => !order.includes(n)));
  order
    .filter((n) => !states.has(n))
    .forEach((n) => {
      delete statusByKey[`${pk}::${n}`];
      statusSeen.delete(`${pk}::${n}`);
    });
  project.services = names.map((n) => ({ service: n, state: states.get(n) }));
}

/* ---- Erros de SSH: inline na linha + toast curto ---- */
// rowErrors[serverId] = { message, short, kind: 'conn' | 'auth' | 'cmd' }.
// Erros de conexão/autenticação somem na próxima leitura bem-sucedida; falha
// de comando some quando outra ação começa no servidor.
const rowErrors = {};
const offlineNotified = new Set(); // servidores já avisados como "sem conexão"

const CONN_ERROR_RE =
  /ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|ENOTFOUND|ECONNRESET|EPIPE|timed out|timeout|tempo limite|encerrada|No response|Not connected/i;
const AUTH_ERROR_RE = /authentication|autentica/i;
const HOSTKEY_ERROR_RE = /Host denied|verification failed|HOST KEY/i;

function classifyError(message) {
  if (HOSTKEY_ERROR_RE.test(message)) return 'hostkey';
  if (AUTH_ERROR_RE.test(message)) return 'auth';
  if (CONN_ERROR_RE.test(message)) return 'conn';
  return 'cmd';
}

// Causa curta para a linha (a pílula já diz "Sem conexão"; o texto completo
// fica no title).
function shortError(kind, message) {
  if (kind === 'hostkey') return 'Chave do host mudou';
  if (kind === 'auth') return 'Autenticação falhou';
  if (kind === 'conn') {
    const code = (String(message).match(/\bE[A-Z]{4,}\b/) || [])[0];
    return code || 'Conexão perdida';
  }
  return String(message).slice(0, 120);
}

// Toast: o problema e o que fazer.
function errorToastText(s, kind, message) {
  const addr = `${s.host}:${s.port}`;
  if (kind === 'hostkey') {
    return `A chave SSH de ${addr} mudou e a conexão foi bloqueada por segurança. Confirme com o responsável pelo servidor.`;
  }
  if (kind === 'auth') return `Falha de autenticação em ${addr}. Revise usuário e senha em Editar.`;
  if (kind === 'conn') return `Sem conexão com ${addr}. Verifique se o servidor está ligado e tente Atualizar.`;
  const what = s.serviceName || s.composeDir || '';
  return `${s.host}${what ? ' · ' + what : ''}: ${message}`;
}

// Só falhas de SSH (conexão, autenticação, chave do host) vão para a linha e
// para o toast; falhas de comando (ex.: sc 1056 "já em execução") ficam no
// Histórico, como antes.
function setRowError(s, message, { notify = true } = {}) {
  const msg = cleanError({ message });
  const kind = classifyError(msg);
  if (kind === 'cmd') return;
  rowErrors[s.id] = { message: msg, kind, short: shortError(kind, msg) };
  if (isDockerServer(s)) dockerOffline.add(s.id);
  // um aviso por servidor: as ações docker geram um erro por projeto
  if (notify && !offlineNotified.has(s.id)) {
    toast('error', errorToastText(s, kind, msg));
    offlineNotified.add(s.id);
  }
  scheduleRender();
}

function clearConnError(serverId) {
  const e = rowErrors[serverId];
  if (e && e.kind !== 'cmd') delete rowErrors[serverId];
}

function clearRowErrors() {
  Object.keys(rowErrors).forEach((id) => delete rowErrors[id]);
  offlineNotified.clear();
}

// Servidor do grupo aberto citado num log do backend (host + serviço/projeto).
function serverFromLog(entry) {
  const group = currentGroup();
  if (!group || !entry || !entry.host) return null;
  const sameHost = group.servers.filter((s) => s.host === entry.host);
  if (sameHost.length === 0) return null;
  const label = String(entry.service || '');
  if (!label) return sameHost.find((s) => isServerBusy(s.id)) || (sameHost.length === 1 ? sameHost[0] : null);
  const project = label.split('/')[0];
  const lastSegment = (p) => String(p || '').split('/').filter(Boolean).pop() || '';
  // exige correspondência do serviço/projeto (mesmo com um só cadastro no host)
  const matches = sameHost.filter((s) => {
    if (!isDockerServer(s)) return s.serviceName === label;
    const tree = dockerTreeByServer[s.id];
    return Boolean(tree && (tree.projects || []).some((p) => p.name === project)) || lastSegment(s.composeDir) === project;
  });
  return matches.find((s) => isServerBusy(s.id)) || matches[0] || null;
}

// Aviso único (agrupado) quando servidores passam a "sem conexão" no polling.
function notifyOfflineTransitions() {
  const group = currentGroup();
  if (!group) return;
  const newlyOffline = [];
  group.servers.forEach((s) => {
    const view = serverView(s);
    if (view === 'offline') {
      if (!offlineNotified.has(s.id)) {
        offlineNotified.add(s.id);
        newlyOffline.push(s);
      }
    } else if (view !== 'loading' && view !== 'restarting') {
      offlineNotified.delete(s.id);
    }
  });
  // autenticação/chave do host: aviso próprio, com o que fazer
  const specific = newlyOffline.filter((s) => rowErrors[s.id] && rowErrors[s.id].kind !== 'conn');
  specific.forEach((s) => toast('error', errorToastText(s, rowErrors[s.id].kind, rowErrors[s.id].message)));
  const plain = newlyOffline.filter((s) => !specific.includes(s));
  if (plain.length === 1) {
    const s = plain[0];
    toast('error', `Sem conexão com ${s.host}:${s.port}. Verifique se o servidor está ligado e tente Atualizar.`);
  } else if (plain.length > 1) {
    const hosts = [...new Set(plain.map((s) => s.host))];
    const list = hosts.slice(0, 3).join(', ') + (hosts.length > 3 ? '…' : '');
    toast(
      'error',
      `Sem conexão com ${plain.length} servidores (${list}). Verifique se estão ligados e tente Atualizar.`
    );
  }
}

/* ---- Linha de servidor ---- */
const MAX_CONTAINER_DOTS = 8;

function containersCell(s, view) {
  const c = cell('c-containers');
  if (!isDockerServer(s)) {
    c.appendChild(el('span', 'muted-tag', 'Windows'));
    c.title = 'Serviço Windows (sem containers)';
    return c;
  }
  const list = dockerContainers(s.id);
  if (!list) {
    if (view === 'offline') c.appendChild(el('span', 'muted-tag', '?'));
    else c.appendChild(skeleton('skeleton-dots'));
    return c;
  }
  const offline = view === 'offline';
  const dots = el('span', 'dots');
  dots.setAttribute('aria-hidden', 'true');
  list.slice(0, MAX_CONTAINER_DOTS).forEach((ct) => {
    const tone = offline ? 'off' : (CONTAINER_VIEW[ct.state] || CONTAINER_VIEW.unknown).tone;
    dots.appendChild(el('span', 'cdot is-' + tone));
  });
  if (list.length > MAX_CONTAINER_DOTS) dots.appendChild(el('span', 'cdot-more', '+' + (list.length - MAX_CONTAINER_DOTS)));
  c.appendChild(dots);

  const running = list.filter((ct) => ct.state === 'running').length;
  const count = el('span', 'count', `${offline ? '?' : running}/${list.length}`);
  count.setAttribute(
    'aria-label',
    offline
      ? `${list.length} containers, estado desconhecido (sem conexão)`
      : `${running} de ${list.length} containers ativos`
  );
  c.appendChild(count);
  c.title = list
    .map((ct) => `${ct.service}: ${offline ? '?' : (CONTAINER_VIEW[ct.state] || CONTAINER_VIEW.unknown).label}`)
    .join('\n');
  return c;
}

function serverActionsCell(s, view) {
  const c = cell('c-actions');
  const wrap = el('div', 'row-actions');
  const off = view === 'offline';
  if (isDockerServer(s)) {
    const act = (action, label) => () => dockerAct({ scope: 'all', serverId: s.id, action }, label);
    wrap.append(
      actionButton('play', `Iniciar ${s.host}`, s.id, 'up', {
        tone: 'ok',
        fid: `up:${s.id}`,
        disabled: off,
        title: `Iniciar ${s.host} — todos os projetos (up -d)`,
        onClick: act('up', 'Iniciar'),
      }),
      actionButton('square', `Parar ${s.host}`, s.id, 'down', {
        tone: 'err',
        fid: `down:${s.id}`,
        disabled: off,
        title: `Parar ${s.host} — remove os containers de todos os projetos (down)`,
        onClick: act('down', 'Parar'),
      }),
      actionButton('rotate-cw', `Reiniciar ${s.host}`, s.id, 'restart', {
        fid: `restart:${s.id}`,
        disabled: off,
        title: `Reiniciar ${s.host} — todos os projetos`,
        onClick: act('restart', 'Reiniciar'),
      })
    );
  } else {
    const name = s.serviceName || s.host;
    wrap.append(
      actionButton('play', `Iniciar ${name} em ${s.host}`, s.id, 'start', {
        tone: 'ok',
        fid: `start:${s.id}`,
        disabled: off,
        onClick: () => serviceAct(s, 'start', 'Iniciar'),
      }),
      actionButton('square', `Parar ${name} em ${s.host}`, s.id, 'stop', {
        tone: 'err',
        fid: `stop:${s.id}`,
        disabled: off,
        onClick: () => serviceAct(s, 'stop', 'Parar'),
      }),
      actionButton('rotate-cw', `Reiniciar ${name} em ${s.host}`, s.id, 'restart', {
        fid: `restart:${s.id}`,
        disabled: off,
        onClick: () => serviceAct(s, 'restart', 'Reiniciar'),
      }),
      iconButton('align-left', `Logs de ${name}`, {
        fid: `logs:${s.id}`,
        disabled: off,
        onClick: () => openLogsPanel({ kind: 'windows', serverId: s.id, label: name }),
      })
    );
  }
  wrap.appendChild(moreMenuButton(s));
  c.appendChild(wrap);
  return c;
}

function renderServerRow(s) {
  const docker = isDockerServer(s);
  const view = serverView(s);
  const expanded = docker && expandedServers.has(s.id);
  const selected = selectedServers.has(s.id);
  const row = rowEl((expanded ? 'is-open' : '') + (selected ? ' is-selected' : ''));
  row.dataset.serverId = s.id;
  if (selected) row.setAttribute('aria-selected', 'true');

  // 1. seleção (barra de lote)
  const check = cell('c-check');
  const box = el('input', 'row-check');
  box.type = 'checkbox';
  box.checked = selected;
  box.dataset.fid = `sel:${s.id}`;
  box.setAttribute('aria-label', `Selecionar ${s.host}${docker ? '' : ' · ' + (s.serviceName || '')}`);
  box.addEventListener('change', () => setSelected(s.id, box.checked));
  check.appendChild(box);
  row.appendChild(check);

  // 2. seta (só docker tem árvore)
  const arrow = cell('c-arrow');
  if (docker) {
    const toggle = iconButton('chevron-right', `${expanded ? 'Recolher' : 'Expandir'} ${s.host}`, {
      className: 'icon-btn-ghost tree-toggle',
      fid: `toggle:${s.id}`,
      onClick: () => toggleServer(s.id),
    });
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-controls', `sub-${s.id}`);
    arrow.appendChild(toggle);
  }
  row.appendChild(arrow);

  // 3-4. host e porta (mono). O title do host traz o caminho (visível
  // mesmo quando a coluna Caminho some em janelas estreitas).
  const pathText = docker ? s.composeDir || '' : s.serviceName || '';
  const host = cell('c-host mono');
  host.title = pathText ? `${s.host} — ${pathText}` : s.host;
  host.appendChild(el('span', 'truncate', s.host));
  if (pathText) host.appendChild(el('span', 'host-sub', pathText)); // só sem a coluna Caminho (CSS)
  const rowError = rowErrors[s.id];
  if (rowError) {
    // erro de SSH/comando inline na linha (texto completo no title)
    host.classList.add('has-error');
    const err = el('span', 'row-error', rowError.short);
    err.title = rowError.message;
    host.appendChild(err);
  }
  row.appendChild(host);

  const port = cell('c-port mono');
  port.textContent = String(s.port);
  row.appendChild(port);

  // 5. usuário + chave quando há senha salva
  const user = cell('c-user');
  user.title = s.username || '';
  user.appendChild(el('span', 'truncate', s.username || ''));
  if (s.hasPassword) {
    const key = iconEl('key-round', 'key-ic');
    key.removeAttribute('aria-hidden');
    key.setAttribute('role', 'img');
    key.setAttribute('aria-label', 'Senha salva');
    key.title = 'Senha salva';
    user.appendChild(key);
  }
  row.appendChild(user);

  // 6. caminho (docker) ou serviço (windows), truncado com o texto no title
  const path = cell('c-path mono');
  path.title = !docker && s.servicePath ? `${pathText} — ${s.servicePath}` : pathText;
  path.appendChild(el('span', 'truncate', pathText));
  row.appendChild(path);

  // 7-9. containers, status e ações
  row.appendChild(containersCell(s, view));
  const status = cell('c-status');
  const running = busy.get(s.id);
  status.appendChild(statusPill(view, running ? BUSY_LABEL[running.action] : null));
  row.appendChild(status);
  row.appendChild(serverActionsCell(s, view));
  return row;
}

/* ---- Árvore docker: projeto → containers ---- */
// Estado de um container (dockerViewOf usa os mesmos estados lidos)
const CONTAINER_VIEW = {
  running: { label: 'Ativo', tone: 'ok' },
  stopped: { label: 'Parado', tone: 'off' },
  pending: { label: 'Em transição…', tone: 'warn' },
  error: { label: 'Com falha', tone: 'err' },
  unknown: { label: 'Desconhecido', tone: 'off' },
};

function subtreeMessage(text, isError) {
  const msg = el('div', 'subtree-message' + (isError ? ' is-err' : ''), text);
  msg.setAttribute('role', 'row');
  return msg;
}

// Estrutura da árvore (projetos/containers e o estado da descoberta): se mudar,
// o bloco é recriado; se só os estados mudarem, é atualizado no lugar.
function subtreeSig(s) {
  const tree = dockerTreeByServer[s.id];
  if (!tree) return dockerOffline.has(s.id) ? '|offline' : '|loading';
  return '|' + JSON.stringify((tree.projects || []).map((p) => [p.composeFile, (p.services || []).map((x) => x.service)]));
}

function renderSubtree(s) {
  const wrap = el('div', 'srv-subtree');
  wrap.id = `sub-${s.id}`;
  wrap.setAttribute('role', 'rowgroup');
  wrap.setAttribute('aria-label', `Projetos de ${s.host}`);
  const tree = dockerTreeByServer[s.id];
  if (!tree) {
    if (dockerOffline.has(s.id)) {
      wrap.appendChild(subtreeMessage('Sem conexão — não foi possível listar os projetos. Tente Atualizar.', true));
    } else {
      wrap.setAttribute('aria-busy', 'true');
      for (let i = 0; i < 3; i++) wrap.appendChild(skeletonSubRow(i === 0));
    }
    return wrap;
  }
  if (!tree.projects || tree.projects.length === 0) {
    wrap.appendChild(subtreeMessage(`Nenhum projeto compose encontrado em ${s.composeDir || ''}`));
    return wrap;
  }
  tree.projects.forEach((p) => {
    wrap.appendChild(renderProjectRow(s, p));
    (p.services || []).forEach((svc) => wrap.appendChild(renderContainerRow(s, p, svc)));
  });
  return wrap;
}

// Linha de carregamento da árvore (projeto na 1ª, containers nas demais).
function skeletonSubRow(isProject) {
  const row = rowEl('sub-row ' + (isProject ? 'project-row' : 'container-row'));
  row.setAttribute('aria-hidden', 'true');
  row.append(cell('c-check'), cell('c-arrow'));
  const main = cell('c-sub-main');
  main.appendChild(skeleton(isProject ? 'skeleton-line' : 'skeleton-line is-short'));
  row.appendChild(main);
  const status = cell('c-status');
  status.appendChild(skeleton(isProject ? 'skeleton-pill' : 'skeleton-line is-short'));
  row.append(status, cell('c-actions'));
  return row;
}

function renderProjectRow(s, p) {
  const key = `${s.id}::${p.composeFile}`;
  const offline = dockerOffline.has(s.id);
  const states = (p.services || []).map((svc) => statusByKey[`${key}::${svc.service}`] || svc.state);
  const running = busy.get(key) || busy.get(s.id);
  const view = running ? 'restarting' : offline ? 'offline' : dockerViewOf(states);
  const row = rowEl('sub-row project-row');
  row.append(cell('c-check'), cell('c-arrow'));

  const main = cell('c-sub-main');
  main.title = p.composeFile;
  main.append(
    iconEl('package', 'project-ic'),
    el('span', 'project-name truncate', p.name),
    el('span', 'project-meta', `docker compose · ${plural(states.length, 'container', 'containers')}`)
  );
  row.appendChild(main);

  const status = cell('c-status');
  status.appendChild(statusPill(view, running ? BUSY_LABEL[running.action] : null));
  row.appendChild(status);

  const act = (action, label) => () =>
    dockerAct({ scope: 'project', serverId: s.id, composeFile: p.composeFile, action }, label);
  const actions = cell('c-actions');
  const wrap = el('div', 'row-actions');
  wrap.append(
    actionButton('play', `Iniciar projeto ${p.name}`, key, 'up', { tone: 'ok', fid: `p-up:${key}`, disabled: offline || busy.has(s.id), onClick: act('up', 'Iniciar') }),
    actionButton('square', `Parar projeto ${p.name}`, key, 'down', {
      tone: 'err',
      fid: `p-down:${key}`,
      disabled: offline || busy.has(s.id),
      title: `Parar projeto ${p.name} — remove os containers (down)`,
      onClick: act('down', 'Parar'),
    }),
    actionButton('rotate-cw', `Reiniciar projeto ${p.name}`, key, 'restart', { fid: `p-restart:${key}`, disabled: offline || busy.has(s.id), onClick: act('restart', 'Reiniciar') }),
    iconButton('align-left', `Logs do projeto ${p.name}`, {
      fid: `p-logs:${key}`,
      disabled: offline,
      onClick: () => openLogsPanel({ serverId: s.id, composeFile: p.composeFile }),
    })
  );
  actions.appendChild(wrap);
  row.appendChild(actions);
  return row;
}

function renderContainerRow(s, p, svc) {
  const key = `${s.id}::${p.composeFile}::${svc.service}`;
  const offline = dockerOffline.has(s.id);
  const state = offline ? 'unknown' : statusByKey[key] || svc.state || 'unknown';
  const running = busy.get(key);
  const meta = running
    ? { label: BUSY_LABEL[running.action], tone: 'warn' }
    : CONTAINER_VIEW[state] || CONTAINER_VIEW.unknown;
  const parentBusy = busy.has(s.id) || busy.has(`${s.id}::${p.composeFile}`);
  const row = rowEl('sub-row container-row');
  row.append(cell('c-check'), cell('c-arrow'));

  const main = cell('c-sub-main');
  const guide = el('span', 'tree-guide');
  guide.setAttribute('aria-hidden', 'true');
  const dot = el('span', 'cdot is-' + meta.tone);
  dot.setAttribute('aria-hidden', 'true');
  main.append(guide, dot, el('span', 'container-name truncate', svc.service));
  row.appendChild(main);

  const status = cell('c-status');
  status.appendChild(el('span', 'status-text is-' + meta.tone, meta.label));
  row.appendChild(status);

  const act = (action, label) => () =>
    dockerAct({ scope: 'service', serverId: s.id, composeFile: p.composeFile, service: svc.service, action }, label);
  const actions = cell('c-actions');
  const wrap = el('div', 'row-actions');
  wrap.append(
    actionButton('play', `Iniciar ${svc.service}`, key, 'up', {
      tone: 'ok',
      fid: `c-up:${key}`,
      disabled: offline || parentBusy || state === 'running' || state === 'error',
      onClick: act('up', 'Iniciar'),
    }),
    actionButton('square', `Parar ${svc.service}`, key, 'stop', {
      tone: 'err',
      fid: `c-stop:${key}`,
      disabled: offline || parentBusy || state === 'stopped',
      onClick: act('stop', 'Parar'),
    }),
    actionButton('rotate-cw', `Reiniciar ${svc.service}`, key, 'restart', { fid: `c-restart:${key}`, disabled: offline || parentBusy, onClick: act('restart', 'Reiniciar') }),
    iconButton('align-left', `Logs de ${svc.service}`, {
      fid: `c-logs:${key}`,
      disabled: offline,
      onClick: () => openLogsPanel({ serverId: s.id, composeFile: p.composeFile, service: svc.service }),
    })
  );
  actions.appendChild(wrap);
  row.appendChild(actions);
  return row;
}

/* ---- Menu "⋯" (Editar / Excluir) ---- */
let openMenu = null; // { serverId, menu, trigger }

function moreMenuButton(s) {
  const label = `Mais ações para ${s.host}${s.serviceName ? ' · ' + s.serviceName : ''}`;
  const btn = iconButton('more-vertical', label, { className: 'icon-btn-ghost more-btn', fid: `more:${s.id}` });
  btn.setAttribute('aria-haspopup', 'menu');
  btn.setAttribute('aria-expanded', String(Boolean(openMenu && openMenu.serverId === s.id)));
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleRowMenu(s, btn);
  });
  return btn;
}

function toggleRowMenu(s, trigger) {
  if (openMenu && openMenu.serverId === s.id) {
    closeRowMenu(true);
    return;
  }
  closeRowMenu(false);
  const menu = el('div', 'menu');
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', `Ações de ${s.host}`);
  const item = (icon, label, className, fn) => {
    const b = el('button', 'menu-item' + (className ? ' ' + className : ''));
    b.type = 'button';
    b.setAttribute('role', 'menuitem');
    b.append(iconEl(icon), el('span', '', label));
    b.addEventListener('click', () => {
      closeRowMenu(true);
      fn();
    });
    return b;
  };
  menu.append(
    item('pencil', 'Editar', '', () => openServerModal(s)),
    item('trash-2', 'Excluir', 'is-danger', () => removeServer(s))
  );
  menu.addEventListener('keydown', onMenuKeydown);
  document.body.appendChild(menu);
  positionMenu(menu, trigger);
  openMenu = { serverId: s.id, menu, trigger };
  trigger.setAttribute('aria-expanded', 'true');
  // fecha ao clicar fora, com Esc (mesmo com o foco fora do menu), ao rolar a
  // tabela e ao redimensionar (o menu é fixo e ficaria sobre outra linha)
  document.addEventListener('pointerdown', onMenuPointerOutside, true);
  document.addEventListener('keydown', onMenuEscape);
  document.getElementById('table-scroll').addEventListener('scroll', onMenuViewportChange, { passive: true });
  window.addEventListener('resize', onMenuViewportChange);
  menu.querySelector('[role="menuitem"]').focus();
}

function onMenuPointerOutside(e) {
  if (!openMenu) return;
  const trigger = e.target.closest && e.target.closest(`[data-fid="${CSS.escape('more:' + openMenu.serverId)}"]`);
  if (openMenu.menu.contains(e.target) || trigger) return; // o próprio '⋯' alterna
  closeRowMenu(false);
}

function onMenuEscape(e) {
  if (e.key !== 'Escape' || !openMenu) return;
  e.preventDefault();
  closeRowMenu(true);
}

function onMenuViewportChange() {
  closeRowMenu(false);
}

function positionMenu(menu, trigger) {
  const r = trigger.getBoundingClientRect();
  const gap = 4;
  let top = r.bottom + gap;
  if (top + menu.offsetHeight > window.innerHeight - gap) top = r.top - menu.offsetHeight - gap;
  const left = Math.max(gap, r.right - menu.offsetWidth);
  menu.style.top = Math.max(gap, top) + 'px';
  menu.style.left = left + 'px';
}

function closeRowMenu(returnFocus) {
  if (!openMenu) return;
  const { menu, serverId } = openMenu;
  openMenu = null;
  menu.remove();
  document.removeEventListener('pointerdown', onMenuPointerOutside, true);
  document.removeEventListener('keydown', onMenuEscape);
  document.getElementById('table-scroll').removeEventListener('scroll', onMenuViewportChange);
  window.removeEventListener('resize', onMenuViewportChange);
  const trigger = document.querySelector(`[data-fid="${CSS.escape('more:' + serverId)}"]`);
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus();
  }
}

function onMenuKeydown(e) {
  const items = [...e.currentTarget.querySelectorAll('[role="menuitem"]')];
  const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    items[(i + 1) % items.length].focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    items[(i - 1 + items.length) % items.length].focus();
  } else if (e.key === 'Home') {
    e.preventDefault();
    items[0].focus();
  } else if (e.key === 'End') {
    e.preventDefault();
    items[items.length - 1].focus();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    closeRowMenu(true);
  } else if (e.key === 'Tab') {
    closeRowMenu(false);
  }
}

/* ---- Seleção e ações em lote ---- */
function setSelected(serverId, on) {
  if (on) selectedServers.add(serverId);
  else selectedServers.delete(serverId);
  renderServers();
  renderBatchBar();
}

// Checkbox do cabeçalho: seleciona todos os visíveis (ou limpa, se já estavam).
function toggleSelectAllVisible() {
  const visible = visibleServers();
  const allOn = visible.length > 0 && visible.every((s) => selectedServers.has(s.id));
  visible.forEach((s) => (allOn ? selectedServers.delete(s.id) : selectedServers.add(s.id)));
  renderServers();
  renderBatchBar();
}

function clearSelection() {
  selectedServers.clear();
  renderServers();
  renderBatchBar();
}

function syncSelectAll(visible) {
  const box = document.getElementById('select-all');
  const on = visible.filter((s) => selectedServers.has(s.id)).length;
  box.checked = visible.length > 0 && on === visible.length;
  box.indeterminate = on > 0 && on < visible.length;
  box.disabled = visible.length === 0;
}

const BATCH_LABEL = { start: 'Iniciar', stop: 'Parar', restart: 'Reiniciar' };
const BATCH_ICON = { start: 'play', stop: 'square', restart: 'rotate-cw' };

// Lote em andamento: o botão clicado vira spinner e os outros ficam
// desabilitados até todos os alvos saírem de "em andamento".
let batchRun = null; // { action, ids }

function isServerBusy(serverId) {
  for (const key of busy.keys()) {
    if (key === serverId || key.startsWith(serverId + '::')) return true;
  }
  return false;
}

function batchStillRunning() {
  if (batchRun && !batchRun.ids.some(isServerBusy)) batchRun = null;
  return Boolean(batchRun);
}

function renderBatchButtons() {
  const running = batchStillRunning();
  Object.keys(BATCH_LABEL).forEach((action) => {
    const btn = document.getElementById('batch-' + action);
    const spinning = running && batchRun.action === action;
    btn.classList.toggle('is-busy', spinning);
    btn.disabled = running && !spinning;
    if (spinning) {
      btn.setAttribute('aria-busy', 'true');
      btn.setAttribute('aria-disabled', 'true');
    } else {
      btn.removeAttribute('aria-busy');
      btn.removeAttribute('aria-disabled');
    }
    const ic = btn.querySelector('.btn-ic');
    const icon = spinning ? 'loader-circle' : BATCH_ICON[action];
    if (ic && ic.dataset.current !== icon) {
      ic.dataset.current = icon;
      ic.innerHTML = iconSvg(icon);
      ic.classList.toggle('spin', spinning);
    }
  });
}
const DOCKER_BATCH_ACTION = { start: 'up', stop: 'down', restart: 'restart' };

function batchTargets() {
  const group = currentGroup();
  if (!group) return [];
  return selectedServers.size ? group.servers.filter((s) => selectedServers.has(s.id)) : group.servers.slice();
}

function renderBatchBar() {
  const bar = document.getElementById('batch-bar');
  const info = document.getElementById('batch-info');
  const group = currentGroup();
  const total = group ? group.servers.length : 0;
  const sel = selectedServers.size;
  bar.classList.toggle('has-selection', sel > 0);
  bar.hidden = total === 0;

  // O texto fica num aria-live: só reescreve quando o conteúdo muda (senão o
  // leitor de tela anunciaria a mesma frase a cada leitura de status).
  const visibleIds = new Set(visibleServers().map((s) => s.id));
  const hidden = [...selectedServers].filter((id) => !visibleIds.has(id)).length;
  const critical = Boolean(group && group.critical);
  const sig = JSON.stringify([total, sel, hidden, critical]);
  if (info.dataset.sig !== sig) {
    info.dataset.sig = sig;
    info.textContent = '';
    if (sel === 0) {
      info.append(el('span', 'batch-title', 'Ações em lote'), el('span', 'batch-sep', '·'));
      const scope = total === 1 ? 'o servidor' : `os ${total} servidores`;
      info.append(document.createTextNode(`Sem seleção, valem para ${scope} do grupo.`));
    } else {
      info.append(el('span', 'batch-title', plural(sel, 'servidor selecionado', 'servidores selecionados')));
      if (hidden) info.append(el('span', 'batch-hidden', `(${hidden} oculto${hidden > 1 ? 's' : ''} pelo filtro)`));
      if (critical) {
        const warn = el('span', 'batch-warning');
        warn.append(iconEl('triangle-alert'), document.createTextNode('Grupo crítico: cada ação pede confirmação'));
        info.append(warn);
      }
    }
  }
  renderBatchButtons();
  document.getElementById('batch-clear').hidden = sel === 0;
  const suffix = sel ? ' selecionados' : ' todos';
  document.getElementById('batch-start-label').textContent = 'Iniciar' + suffix;
  document.getElementById('batch-stop-label').textContent = 'Parar' + suffix;
  document.getElementById('batch-restart-label').textContent = 'Reiniciar' + suffix;
}

// Executa start/stop/restart nos servidores do lote (selecionados ou o grupo
// todo). Windows → sc via service:action; docker → up/down/restart em todos
// os projetos do servidor (docker:action escopo 'all').
async function runBatch(action) {
  const group = currentGroup();
  if (!group || batchStillRunning()) return; // lote anterior ainda em andamento
  // Pula quem já tem ação em andamento e servidores docker sem projeto compose
  const all = batchTargets();
  const busyNow = all.filter((s) => isServerBusy(s.id));
  const noProjects = all.filter((s) => isDockerServer(s) && dockerHasNoProjects(s.id));
  const targets = all.filter((s) => !busyNow.includes(s) && !noProjects.includes(s));
  const skipped = [];
  if (busyNow.length) skipped.push(`${plural(busyNow.length, 'já em andamento', 'já em andamento')}`);
  if (noProjects.length) skipped.push(`${plural(noProjects.length, 'docker sem projeto compose', 'docker sem projeto compose')}`);
  if (targets.length === 0) {
    if (skipped.length) toast('warn', `Nada a fazer: ${skipped.join(', ')}.`);
    return;
  }
  const label = BATCH_LABEL[action];
  const count = plural(targets.length, 'servidor', 'servidores');
  if (group.critical) {
    const dockerStop = action === 'stop' && targets.some(isDockerServer);
    const ok = await confirmAction({
      title: `${label} ${count}?`,
      message:
        `Grupo crítico ${group.name}. A ação vale para os servidores abaixo.` +
        (dockerStop ? ' Nos servidores docker, Parar remove os containers (down).' : '') +
        (skipped.length ? ` Ignorados: ${skipped.join(', ')}.` : ''),
      items: targets.map(serverItem),
      confirmLabel: `${label} ${count}`,
      danger: action === 'stop',
    });
    if (!ok || batchStillRunning()) return;
  }
  targets.forEach((s) => {
    if (isDockerServer(s)) {
      const dockerAction = DOCKER_BATCH_ACTION[action];
      window.api.dockerAction({ groupId: group.id, serverId: s.id, scope: 'all', action: dockerAction });
      setBusyDockerServer(s.id, dockerAction);
    } else {
      window.api.serviceAction({ groupId: group.id, serverId: s.id, action });
      startAction(s.id, action);
    }
  });
  batchRun = { action, ids: targets.map((s) => s.id) };
  renderBatchButtons();
  toast('info', `${label}: ${count} em andamento…` + (skipped.length ? ` Ignorados: ${skipped.join(', ')}.` : ''));
}

// Ação "todos os projetos" de um servidor docker: termina quando chegam as
// leituras de todos os projetos conhecidos.
function setBusyDockerServer(serverId, action) {
  const tree = dockerTreeByServer[serverId];
  const files = tree && tree.projects && tree.projects.length ? new Set(tree.projects.map((p) => p.composeFile)) : null;
  startAction(serverId, action, { docker: true, files, reported: new Set() });
  // sem a árvore ainda: descobre a lista de projetos para saber quando terminar
  if (!files) discoverDockerTree(serverId);
}

// Marca a ação em andamento e limpa o erro de comando anterior da linha.
function startAction(key, action, extra) {
  const serverId = String(key).split('::')[0];
  if (rowErrors[serverId]) delete rowErrors[serverId];
  setBusy(key, action, extra);
}

/* ---- Estados vazios ---- */
function tableEmpty(title, detail, actions, icon) {
  const box = el('div', 'table-empty');
  box.setAttribute('role', 'row');
  const inner = el('div', 'table-empty-inner');
  inner.setAttribute('role', 'cell');
  if (icon) inner.appendChild(iconEl(icon, 'table-empty-icon'));
  inner.appendChild(el('p', 'table-empty-title', title));
  if (detail) inner.appendChild(el('p', 'table-empty-detail', detail));
  if (actions && actions.length) {
    const bar = el('div', 'table-empty-actions');
    actions.forEach((a) => bar.appendChild(a));
    inner.appendChild(bar);
  }
  box.appendChild(inner);
  return box;
}

function textButton(label, className, onClick, icon, fid) {
  const b = el('button', 'btn ' + className);
  b.type = 'button';
  if (fid) b.dataset.fid = fid;
  if (icon) b.appendChild(iconEl(icon, 'btn-ic'));
  b.appendChild(document.createTextNode(label));
  b.addEventListener('click', onClick);
  return b;
}

/* ---- Render ---- */
function renderServers() {
  const body = document.getElementById('servers-body');
  const group = currentGroup();
  const rows = [];
  if (groupsError) {
    rows.push(
      keyed(
        tableEmpty(
          'Não foi possível carregar os grupos',
          groupsError,
          [textButton('Tentar novamente', 'btn-secondary', retryLoadGroups, 'refresh-cw')],
          'triangle-alert'
        ),
        'empty:error',
        groupsError
      )
    );
  } else if (!groupsLoaded) {
    // carregando o cadastro: linhas skeleton (nunca um spinner no meio da tabela)
    for (let i = 0; i < 6; i++) rows.push(keyed(skeletonServerRow(), `sk:${i}`));
  } else if (!group) {
    rows.push(
      keyed(
        tableEmpty(
          'Nenhum grupo',
          'Crie um grupo ou importe um arquivo .ini/.json para começar.',
          [
            textButton('Novo grupo', 'btn-secondary', createGroupFlow, 'plus', 'empty:new-group'),
            textButton('Importar .ini ou .json', 'btn-secondary', importGroupFlow, 'upload', 'empty:import'),
          ],
          'package'
        ),
        'empty:no-group'
      )
    );
  } else if (group.servers.length === 0) {
    rows.push(
      keyed(
        tableEmpty(
          'Nenhum servidor neste grupo',
          'Adicione o primeiro servidor (serviço Windows ou docker compose).',
          [textButton('Adicionar servidor', 'btn-primary', () => openServerModal(null), 'plus', 'empty:add')],
          'plus'
        ),
        'empty:no-servers'
      )
    );
  } else {
    const visible = visibleServers();
    if (visible.length === 0) {
      rows.push(
        keyed(
          tableEmpty(
            'Nenhum servidor com esse filtro',
            'Ajuste a busca ou o filtro de status.',
            [textButton('Limpar filtros', 'btn-secondary', clearFilters, null, 'empty:clear')],
            'search'
          ),
          'empty:filter'
        )
      );
    }
    visible.forEach((s) => {
      rows.push(keyed(renderServerRow(s), 'srv:' + s.id, serverSig(s)));
      if (isDockerServer(s) && expandedServers.has(s.id)) {
        rows.push(keyed(renderSubtree(s), 'sub:' + s.id, serverSig(s) + subtreeSig(s)));
      }
    });
  }

  // Os nós são reaproveitados (foco e cliques em andamento sobrevivem); se o
  // elemento focado tiver sido trocado, devolve o foco pelo data-fid.
  const active = document.activeElement;
  const fid = active && body.contains(active) && active.dataset ? active.dataset.fid : null;
  reconcile(body, rows);
  if (fid && !body.contains(active)) {
    const again = body.querySelector(`[data-fid="${CSS.escape(fid)}"]`);
    if (again && !again.disabled) again.focus({ preventScroll: true });
  }
  if (openMenu) {
    const trigger = body.querySelector(`[data-fid="${CSS.escape('more:' + openMenu.serverId)}"]`);
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    else closeRowMenu(false);
  }
  syncSelectAll(group ? visibleServers() : []);
}

// Render completo agrupado por frame (várias leituras chegam juntas).
let renderFrame = 0;
function scheduleRender() {
  if (renderFrame) return;
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    renderChrome();
    renderServers();
    notifyOfflineTransitions();
  });
}

// Linha de carregamento (cadastro ainda não lido).
function skeletonServerRow() {
  const row = rowEl('skeleton-row');
  row.setAttribute('aria-hidden', 'true');
  row.append(cell('c-check'), cell('c-arrow'));
  const add = (className, skel) => {
    const c = cell(className);
    c.appendChild(skeleton(skel));
    row.appendChild(c);
  };
  add('c-host', 'skeleton-line');
  add('c-port', 'skeleton-line is-short');
  add('c-user', 'skeleton-line is-short');
  add('c-path', 'skeleton-line');
  add('c-containers', 'skeleton-dots');
  add('c-status', 'skeleton-pill');
  row.appendChild(cell('c-actions'));
  return row;
}

// Dispara uma ação de serviço individual, exigindo confirmação em grupo crítico.
async function serviceAct(s, action, label) {
  const group = currentGroup();
  if (!group) return;
  const name = s.serviceName || s.host;
  if (group.critical) {
    const ok = await confirmAction({
      title: `${label} ${name}?`,
      message: `Grupo crítico ${group.name}. A ação vale para o servidor abaixo.`,
      items: [serverItem(s)],
      confirmLabel: `${label} ${name}`,
      danger: action === 'stop',
    });
    if (!ok) return;
  }
  window.api.serviceAction({ groupId: group.id, serverId: s.id, action });
  startAction(s.id, action);
}
/* ---- Expansão / descoberta docker ---- */
// Expandir redescobre os projetos (pega projetos criados/removidos no servidor);
// a árvore já conhecida aparece enquanto a descoberta não termina.
function toggleServer(id) {
  if (expandedServers.has(id)) {
    expandedServers.delete(id);
  } else {
    expandedServers.add(id);
    discoverDockerTree(id);
  }
  renderServers();
}

// Popula statusByKey a partir de uma árvore descoberta.
function absorbTree(tree) {
  const sid = tree.serverId;
  const mark = (key, state) => {
    statusByKey[key] = state;
    statusSeen.add(key);
  };
  mark(sid, tree.state);
  (tree.projects || []).forEach((p) => {
    mark(`${sid}::${p.composeFile}`, p.state);
    (p.services || []).forEach((s) => {
      mark(`${sid}::${p.composeFile}::${s.service}`, s.state);
    });
  });
  dockerOffline.delete(sid);
  clearConnError(sid);
  lastReadAt = Date.now();
}

// Descoberta completa (find + ps) ao expandir. Evita chamadas duplicadas.
async function discoverDockerTree(serverId) {
  if (discoveringServers.has(serverId)) return;
  discoveringServers.add(serverId);
  const groupId = currentGroupId;
  try {
    const tree = await window.api.dockerDiscover(groupId, serverId);
    if (groupId !== currentGroupId) return; // trocou de grupo no meio da leitura
    dockerTreeByServer[serverId] = tree;
    absorbTree(tree);
    syncBusyFiles(serverId);
  } catch (e) {
    if (groupId !== currentGroupId) return;
    const s = findServer(serverId);
    appendLog({ level: 'error', host: s ? s.host : '', service: '', message: `Falha ao descobrir projetos docker: ${cleanError(e)}` });
    if (busy.has(serverId)) clearBusyServer(serverId);
    dockerOffline.add(serverId);
    if (s) setRowError(s, e.message); // inline na linha + toast com o que fazer
  } finally {
    discoveringServers.delete(serverId);
    scheduleRender();
  }
}

// Atualização leve de um servidor (polling): só `ps`, sem `find`. Guarda a
// árvore sempre — ela alimenta a coluna Containers mesmo com a linha recolhida.
async function refreshDockerServer(serverId) {
  if (refreshingDocker.has(serverId)) return; // tick anterior ainda em andamento
  refreshingDocker.add(serverId);
  const groupId = currentGroupId;
  try {
    let tree = await window.api.dockerRefresh(groupId, serverId);
    if (groupId !== currentGroupId) return; // trocou de grupo no meio da leitura
    const allEmpty =
      tree.projects && tree.projects.length > 0 && tree.projects.every((p) => !p.services || p.services.length === 0);
    if (allEmpty) {
      // O refresh do backend engole falha de SSH no `ps` (projetos vazios):
      // confirma com a descoberta, que falha quando não há conexão.
      tree = await window.api.dockerDiscover(groupId, serverId);
      if (groupId !== currentGroupId) return;
    }
    dockerTreeByServer[serverId] = tree;
    absorbTree(tree);
    syncBusyFiles(serverId);
  } catch (e) {
    // durante o polling: marca sem conexão e mostra o erro na linha (o toast
    // sai agrupado em notifyOfflineTransitions, sem repetir a cada ciclo)
    if (groupId === currentGroupId) {
      dockerOffline.add(serverId);
      const s = findServer(serverId);
      if (s) setRowError(s, e.message, { notify: false });
    }
  } finally {
    refreshingDocker.delete(serverId);
    scheduleRender();
  }
}

// Dispara uma ação docker, exigindo confirmação em grupo crítico.
async function dockerAct(payload, actionLabel) {
  const group = currentGroup();
  if (!group) return;
  const { scope, serverId, composeFile, service, action } = payload;
  const server = findServer(serverId);
  if (scope === 'all' && server && dockerHasNoProjects(serverId)) {
    toast('warn', `Nenhum projeto compose em ${server.host}${server.composeDir ? ' (' + server.composeDir + ')' : ''}.`);
    return;
  }
  if (group.critical && server) {
    const proj = projNameFromFile(composeFile);
    const target =
      scope === 'service' ? `o container ${service}` : scope === 'project' ? `o projeto ${proj}` : 'todos os projetos';
    const short = scope === 'service' ? service : scope === 'project' ? `projeto ${proj}` : server.host;
    const ok = await confirmAction({
      title: `${actionLabel} ${short}?`,
      message:
        `Grupo crítico ${group.name}. A ação vale para ${target} em ${server.host}.` +
        (action === 'down' ? ' Parar remove os containers (down).' : ''),
      items: [{ host: server.host, detail: scope === 'all' ? server.composeDir || '' : composeFile }],
      confirmLabel: `${actionLabel} ${short}`,
      danger: action === 'down' || action === 'stop',
    });
    if (!ok) return;
  }
  window.api.dockerAction({ groupId: group.id, ...payload });
  if (scope === 'service') startAction(`${serverId}::${composeFile}::${service}`, action);
  else if (scope === 'project') startAction(`${serverId}::${composeFile}`, action);
  else if (scope === 'all') setBusyDockerServer(serverId, action);
}
async function removeServer(server) {
  const ok = await promptText(`Remover "${server.host}"? Digite REMOVER para confirmar`, '');
  if (ok !== 'REMOVER') return;
  try {
    await window.api.removeServer(currentGroupId, server.id);
    await reloadGroups(currentGroupId);
    log('info', server.host, server.serviceName || server.composeDir || '', 'Servidor removido do cadastro.');
  } catch (e) {
    log('error', '', '', e.message);
  }
}

/* ===================== Monitoramento de status ===================== */
// Releitura curta enquanto um serviço segue em transição após uma ação.
let recheckTimer = 0;
function scheduleRecheck() {
  if (recheckTimer) return;
  recheckTimer = setTimeout(() => {
    recheckTimer = 0;
    if (currentGroupId) window.api.checkStatus(currentGroupId);
  }, 3000);
}

function refreshStatus() {
  if (!currentGroupId) return;
  window.api.checkStatus(currentGroupId); // serviços windows do grupo
  // Reatualiza TODOS os servidores docker do grupo (expandidos ou não).
  // Recolhidos atualizam só o indicador de status, sem guardar a árvore.
  const group = currentGroup();
  (group ? group.servers : []).forEach((s) => {
    if ((s.type || 'windows') === 'docker') {
      refreshDockerServer(s.id);
    }
  });
}

// Depois de abrir o grupo ou de um CRUD, o backend descarta o check-status se
// um ciclo do grupo ainda estiver em andamento. Enquanto houver serviço Windows
// sem leitura, pede de novo a cada 5 s (até 6 vezes).
let readingsTimer = 0;
function ensureReadings(attempt = 0) {
  clearTimeout(readingsTimer);
  readingsTimer = setTimeout(() => {
    const group = currentGroup();
    if (!group) return;
    const missing = group.servers.some((s) => !isDockerServer(s) && !statusSeen.has(s.id));
    if (!missing || attempt >= 6) return;
    window.api.checkStatus(group.id);
    ensureReadings(attempt + 1);
  }, 5000);
}

// (re)inicia o polling automático do status do grupo selecionado
function startStatusPolling() {
  if (statusTimer) clearInterval(statusTimer);
  statusTimer = null;
  renderRefreshInfo();
  if (!currentGroupId) return;
  refreshStatus(); // leitura inicial ao entrar no grupo (mesmo com auto-refresh desligado)
  ensureReadings();
  if (statusPollMs > 0) statusTimer = setInterval(refreshStatus, statusPollMs);
}

/* ===================== Modal de servidor ===================== */
let editingServerId = null;

// Alterna os campos específicos por tipo (serviço windows vs diretório compose).
function applyTypeFields(type) {
  const isDocker = type === 'docker';
  document.getElementById('f-service-row').hidden = isDocker;
  document.getElementById('f-servicepath-row').hidden = isDocker;
  document.getElementById('f-composedir-row').hidden = !isDocker;
  document.getElementById('modal-test').hidden = !isDocker;
}

// Testa a conexão docker a partir dos dados atuais do formulário.
async function testDockerConnection() {
  const errorEl = document.getElementById('form-error');
  const host = document.getElementById('f-host').value.trim();
  const composeDir = document.getElementById('f-composeDir').value.trim();
  const setMsg = (text, kind) => {
    errorEl.className = 'form-error' + (kind ? ' is-' + kind : '');
    errorEl.textContent = text;
  };
  if (!HOST_RE.test(host)) {
    setMsg('Host inválido.');
    return;
  }
  if (!isValidComposeDirUI(composeDir)) {
    setMsg('Diretório compose inválido (use caminho absoluto, ex.: /kingposto).');
    return;
  }
  const cfg = {
    host,
    port: document.getElementById('f-port').value,
    username: document.getElementById('f-username').value.trim(),
    password: document.getElementById('f-password').value,
    composeDir,
  };
  setMsg('Testando conexão…', 'info');
  try {
    const r = await window.api.dockerTest(currentGroupId, editingServerId, cfg);
    const list = r.projects && r.projects.length ? r.projects.join(', ') : '—';
    setMsg(`OK · ${r.version || 'docker compose'} · ${r.projectCount} projeto(s): ${list}`, 'ok');
  } catch (e) {
    setMsg(`Falha: ${e.message}`);
  }
}

function openServerModal(server) {
  editingServerId = server ? server.id : null;
  const type = server ? server.type || 'windows' : 'windows';
  document.getElementById('modal-title').textContent = server ? 'Editar servidor' : 'Novo servidor';
  document.getElementById('f-type').value = type;
  applyTypeFields(type);
  document.getElementById('f-host').value = server ? server.host : '';
  document.getElementById('f-port').value = server ? server.port : 22;
  document.getElementById('f-username').value = server ? server.username : '';
  document.getElementById('f-service').value = server && server.serviceName ? server.serviceName : '';
  document.getElementById('f-servicePath').value = server && server.servicePath ? server.servicePath : '';
  document.getElementById('f-composeDir').value = server && server.composeDir ? server.composeDir : '';
  document.getElementById('f-password').value = '';
  document.getElementById('f-password-hint').textContent = server
    ? 'Deixe em branco para manter a senha atual.'
    : 'A senha é armazenada criptografada.';
  const errorEl = document.getElementById('form-error');
  errorEl.className = 'form-error';
  errorEl.textContent = '';
  openLayer(document.getElementById('server-modal'), {
    initialFocus: '#f-host',
    onClose: () => {
      editingServerId = null;
    },
  });
}

function closeServerModal() {
  closeLayer(document.getElementById('server-modal'));
}

async function submitServer(e) {
  e.preventDefault();
  const errorEl = document.getElementById('form-error');
  errorEl.className = 'form-error'; // o teste de conexão pode ter deixado em verde
  const type = document.getElementById('f-type').value === 'docker' ? 'docker' : 'windows';
  const data = {
    type,
    host: document.getElementById('f-host').value.trim(),
    port: document.getElementById('f-port').value,
    username: document.getElementById('f-username').value.trim(),
    password: document.getElementById('f-password').value,
  };
  if (type === 'docker') {
    data.composeDir = document.getElementById('f-composeDir').value.trim();
  } else {
    data.serviceName = document.getElementById('f-service').value.trim();
    data.servicePath = document.getElementById('f-servicePath').value.trim();
  }

  if (!HOST_RE.test(data.host)) {
    errorEl.textContent = 'Host inválido: use apenas letras, números, ponto e hífen.';
    return;
  }
  if (!data.username) {
    errorEl.textContent = 'Usuário é obrigatório.';
    return;
  }
  const port = String(data.port || '').trim();
  if (port !== '' && !(/^\d+$/.test(port) && Number(port) >= 1 && Number(port) <= 65535)) {
    errorEl.textContent = 'Porta inválida: use um número inteiro de 1 a 65535.';
    return;
  }
  if (type === 'docker') {
    if (!isValidComposeDirUI(data.composeDir)) {
      errorEl.textContent = 'Diretório compose inválido: use um caminho absoluto seguro (ex.: /kingposto).';
      return;
    }
  } else if (!SERVICE_NAME_RE.test(data.serviceName)) {
    errorEl.textContent = 'Nome de serviço inválido: caracteres não permitidos.';
    return;
  } else if (data.servicePath && !isValidWindowsPathUI(data.servicePath)) {
    errorEl.textContent = 'Caminho do serviço inválido (ex.: C:\\services\\meuapp).';
    return;
  }

  try {
    if (!currentGroupId) {
      errorEl.textContent = 'Selecione ou crie um grupo primeiro.';
      return;
    }
    if (editingServerId) {
      await window.api.updateServer(currentGroupId, editingServerId, data);
    } else {
      await window.api.addServer(currentGroupId, data);
    }
    closeServerModal();
    await reloadGroups(currentGroupId);
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

/* ===================== Log estruturado ===================== */
function timeStamp() {
  return new Date().toLocaleTimeString('pt-BR', { hour12: false });
}

// Feedback de eventos: registra no histórico e mostra toast p/ níveis relevantes.
// O stream verboso 'info' (empurrado pelo backend) fica só no histórico.
function log(level, host, service, message) {
  appendLog({ level, host, service, message });
  const toastLevel = { ok: 'ok', error: 'error', warn: 'warn' }[level];
  if (toastLevel) toast(toastLevel, message);
}

const HISTORY_MAX_NODES = 4000; // teto de linhas retidas no histórico

function appendLog(entry) {
  const output = document.getElementById('history-log');
  if (!output) return;
  const empty = output.querySelector('.log-empty');
  if (empty) empty.remove();
  const nearBottom = output.scrollHeight - output.scrollTop - output.clientHeight < 40;

  const level = entry && entry.level ? entry.level : 'info';
  const line = el('div', 'log-line log-' + level);
  line.appendChild(el('span', 'log-time', timeStamp()));
  const body = el('div', 'log-body');
  if (entry && entry.host) {
    body.appendChild(el('span', 'log-host', entry.host + (entry.service ? ' · ' + entry.service : '')));
  }
  body.appendChild(el('span', 'log-msg', entry && entry.message ? entry.message : String(entry)));
  line.appendChild(body);

  output.appendChild(line);
  while (output.childElementCount > HISTORY_MAX_NODES) output.firstElementChild.remove();
  if (nearBottom) output.scrollTop = output.scrollHeight;

  bumpHistoryBadge(level);
}

/* ===================== Camadas (painéis laterais e diálogos) ===================== */
// Pilha das camadas abertas: Esc fecha a do topo, Tab circula dentro dela e, ao
// fechar, o foco volta para o elemento que a abriu.
const layerStack = []; // { scrim, restore, onClose }

function focusablesIn(root) {
  return [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
    (node) => !node.disabled && node.getClientRects().length > 0
  );
}

function isLayerOpen(scrim) {
  return layerStack.some((l) => l.scrim === scrim);
}

function openLayer(scrim, opts = {}) {
  if (isLayerOpen(scrim)) return;
  closeRowMenu(false);
  const active = document.activeElement;
  const restoreFid = active && active.dataset ? active.dataset.fid : null;
  layerStack.push({ scrim, restore: active, restoreFid, onClose: opts.onClose });
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add('is-open'));
  const target = (opts.initialFocus && scrim.querySelector(opts.initialFocus)) || focusablesIn(scrim)[0];
  if (target) target.focus();
}

function closeLayer(scrim) {
  const i = layerStack.findIndex((l) => l.scrim === scrim);
  if (i < 0) return;
  const [layer] = layerStack.splice(i, 1);
  scrim.classList.remove('is-open');
  // espera a transição (--dur) antes de esconder; 0 com movimento reduzido
  const dur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur')) || 0;
  setTimeout(() => {
    if (!isLayerOpen(scrim)) scrim.hidden = true;
  }, dur);
  if (layer.onClose) layer.onClose();
  let target = layer.restore && document.contains(layer.restore) ? layer.restore : null;
  if (!target && layer.restoreFid) target = document.querySelector(`[data-fid="${CSS.escape(layer.restoreFid)}"]`);
  if (target) target.focus();
}

function onLayerKeydown(e) {
  const top = layerStack[layerStack.length - 1];
  if (!top) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeLayer(top.scrim);
    return;
  }
  if (e.key !== 'Tab') return;
  const items = focusablesIn(top.scrim);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const inside = top.scrim.contains(document.activeElement);
  if (e.shiftKey && (!inside || document.activeElement === first)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
    e.preventDefault();
    first.focus();
  }
}

/* ===================== Logs em tempo real (painel lateral) ===================== */
// Uma sessão de streaming por vez. currentSessionId correlaciona os chunks que
// chegam do backend com o painel aberto (chunks de sessões antigas são ignorados).
let currentSessionId = null;
let currentLogTarget = null; // alvo da sessão (reinicia ao mudar "Últimas linhas")
const LOG_MAX_NODES = 6000; // teto de nós retidos no <pre> (memória/DOM)
const LOG_MAX_CHARS = 400000; // teto de texto retido (~2.500 linhas do console.log)
const LOG_FLUSH_MS = 100; // intervalo mínimo entre desenhos do painel

// Estado SGR corrente do stream (persiste entre chunks/linhas até um reset).
// fg/bg guardam o índice da paleta ANSI (0-15 → --ansi-N) ou 'ext' (256 cores).
let ansiState = { fg: null, bg: null, bold: false };

function resetAnsiState() {
  ansiState = { fg: null, bg: null, bold: false };
}

// Atualiza ansiState a partir dos parâmetros de um SGR (ESC[…m).
function applySgr(params) {
  const codes = params.split(';').map((n) => parseInt(n, 10));
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i];
    if (c === 0 || Number.isNaN(c)) resetAnsiState();
    else if (c === 1) ansiState.bold = true;
    else if (c === 22) ansiState.bold = false;
    else if (c >= 30 && c <= 37) ansiState.fg = c - 30;
    else if (c >= 90 && c <= 97) ansiState.fg = c - 90 + 8;
    else if (c === 39) ansiState.fg = null;
    else if (c >= 40 && c <= 47) ansiState.bg = c - 40;
    else if (c >= 100 && c <= 107) ansiState.bg = c - 100 + 8;
    else if (c === 49) ansiState.bg = null;
    else if ((c === 38 || c === 48) && codes[i + 1] === 5) {
      // 256 cores: as 16 básicas usam a paleta; as demais, um tom neutro.
      const n = codes[i + 2];
      const color = n < 16 ? n : 'ext';
      if (c === 38) ansiState.fg = color;
      else ansiState.bg = color;
      i += 2;
    }
  }
}

// Cria um nó para um segmento de texto com o estado atual (cores por classe,
// definidas nos tokens). Usa textContent (nunca innerHTML) — seguro contra
// injeção via conteúdo do log.
function ansiSegmentNode(text) {
  if (ansiState.fg === null && ansiState.bg === null && !ansiState.bold) {
    return document.createTextNode(text);
  }
  const span = document.createElement('span');
  const classes = [];
  if (ansiState.fg !== null) classes.push('ansi-fg-' + ansiState.fg);
  if (ansiState.bg !== null) classes.push('ansi-bg-' + ansiState.bg);
  if (ansiState.bold) classes.push('ansi-bold');
  span.className = classes.join(' ');
  span.textContent = text;
  return span;
}

// Interpreta os códigos ANSI de `text` e appenda os nós resultantes em `out`.
function appendAnsi(out, text) {
  // Remove sequências de escape não-SGR (cursor/limpar) e \r solto.
  const clean = text
    .replace(/\x1b\[[0-9;?]*[A-Za-ln-z]/g, '') // qualquer CSI que não termine em 'm' (SGR)
    .replace(/\r(?!\n)/g, '');

  const re = /\x1b\[([0-9;]*)m/g;
  let last = 0;
  let m;
  while ((m = re.exec(clean)) !== null) {
    if (m.index > last) out.appendChild(ansiSegmentNode(clean.slice(last, m.index)));
    applySgr(m[1]);
    last = re.lastIndex;
  }
  if (last < clean.length) out.appendChild(ansiSegmentNode(clean.slice(last)));
}

function logsDrawerEl() {
  return document.getElementById('logs-drawer');
}

// target: { kind:'docker', serverId, composeFile, service? }
//      ou { kind:'windows', serverId, label }
function openLogsPanel(target) {
  const server = findServer(target.serverId);
  const label =
    target.kind === 'windows'
      ? target.label || 'serviço'
      : target.service
      ? `${projNameFromFile(target.composeFile)}/${target.service}`
      : projNameFromFile(target.composeFile);
  document.getElementById('logs-title').textContent = 'Logs — ' + label;
  const where = target.kind === 'windows' ? (server && (server.servicePath || server.serviceName)) || '' : target.composeFile;
  document.getElementById('logs-subtitle').textContent = server ? `${server.host} · ${where}` : where;

  openLayer(logsDrawerEl(), {
    initialFocus: '#logs-output',
    onClose: () => {
      currentLogTarget = null;
      stopLogsSession();
    },
  });
  startLogs(target);
}

let logsGen = 0; // cada start ganha um número; respostas de starts antigos são descartadas
let logsState = 'ended';
let tailTimer = 0;

async function startLogs(target) {
  stopLogsSession();
  const gen = ++logsGen;
  currentLogTarget = target;
  clearLogsOutput();
  resetAnsiState();
  setLogsState('connecting');

  const tailInput = parseInt(document.getElementById('logs-tail').value, 10);
  const tail = Number.isInteger(tailInput) ? tailInput : 100;
  try {
    const start =
      target.kind === 'windows'
        ? window.api.serviceLogsStart({ groupId: currentGroupId, serverId: target.serverId, tail })
        : window.api.dockerLogsStart({
            groupId: currentGroupId,
            serverId: target.serverId,
            composeFile: target.composeFile,
            service: target.service,
            tail,
          });
    const { sessionId } = await start;
    if (gen !== logsGen || currentLogTarget !== target) {
      // painel fechado ou outro start mais novo enquanto conectava
      window.api.logsStop(sessionId);
      return;
    }
    currentSessionId = sessionId;
    // continua "Conectando…" até o primeiro trecho chegar (a conexão SSH é assíncrona)
  } catch (e) {
    if (gen !== logsGen) return;
    appendLogsText('\n[erro ao iniciar logs] ' + e.message + '\n');
    setLogsState('error');
  }
}

// Mudou "Últimas linhas": reabre a sessão com o novo valor.
function restartLogs() {
  clearTimeout(tailTimer);
  tailTimer = setTimeout(() => {
    if (currentLogTarget && isLayerOpen(logsDrawerEl())) startLogs(currentLogTarget);
  }, 300);
}

const LOGS_STATE = {
  connecting: ['Conectando…', ''],
  live: ['Ao vivo', 'is-live'],
  ended: ['Encerrado', ''],
  error: ['Erro no stream', 'is-error'],
};

function setLogsState(state) {
  const node = document.getElementById('logs-state');
  logsState = state;
  const [text, cls] = LOGS_STATE[state] || LOGS_STATE.ended;
  node.textContent = text;
  node.className = 'logs-state' + (cls ? ' ' + cls : '');
}

// Nome do projeto a partir do caminho do compose (espelha docker.projectNameFromFile).
function projNameFromFile(file) {
  const parts = String(file || '').split('/').filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : String(file || '');
}

// Os chunks chegam em alta frequência (no Windows, ~1 linha por chunk). Cada
// inserção no <pre> força o relayout do texto inteiro, então desenhar chunk a
// chunk não acompanha um console.log movimentado: a fila de IPC cresce e a
// janela congela (pior ao voltar de minimizada). Por isso acumulamos em memória
// e desenhamos no máximo a cada LOG_FLUSH_MS, só com a janela visível (rAF).
let logsPending = [];
let logsPendingChars = 0;
let logsChars = 0; // caracteres retidos no <pre> (contador; evita ler textContent)
let logsFlushScheduled = false;

function appendLogsText(text) {
  logsPending.push(text);
  logsPendingChars += text.length;
  // Minimizada, o rAF não roda: guarda só o final (o resto sairia na poda).
  if (logsPendingChars > LOG_MAX_CHARS * 2) {
    const tail = logsPending.join('').slice(-LOG_MAX_CHARS);
    logsPending = [tail];
    logsPendingChars = tail.length;
  }
  if (!logsFlushScheduled) {
    logsFlushScheduled = true;
    setTimeout(() => requestAnimationFrame(flushLogs), LOG_FLUSH_MS);
  }
}

function flushLogs() {
  logsFlushScheduled = false;
  if (!logsPending.length) return;
  let text = logsPending.join('');
  logsPending = [];
  logsPendingChars = 0;

  const out = document.getElementById('logs-output');
  if (text.length >= LOG_MAX_CHARS) {
    // O lote sozinho já ocupa o teto: o que está na tela seria podado inteiro.
    text = text.slice(-LOG_MAX_CHARS);
    out.textContent = '';
    logsChars = 0;
  }
  const nearBottom = out.scrollHeight - out.scrollTop - out.clientHeight < 40;
  appendAnsi(out, text);
  logsChars += text.length;

  // Poda por nós inteiros (preserva a estilização dos spans ANSI).
  while (out.childNodes.length > 1 && (logsChars > LOG_MAX_CHARS || out.childNodes.length > LOG_MAX_NODES)) {
    logsChars -= out.firstChild.textContent.length;
    out.removeChild(out.firstChild);
  }
  if (nearBottom) out.scrollTop = out.scrollHeight;
}

function clearLogsOutput() {
  logsPending = [];
  logsPendingChars = 0;
  logsChars = 0;
  document.getElementById('logs-output').textContent = '';
}

function stopLogsSession() {
  if (currentSessionId) {
    window.api.logsStop(currentSessionId);
    currentSessionId = null;
  }
}

function closeLogsPanel() {
  closeLayer(logsDrawerEl());
}

// Copia o log exibido para a área de transferência.
async function copyLogs() {
  flushLogs();
  const out = document.getElementById('logs-output');
  const text = out.textContent || '';
  if (!text.trim()) {
    toast('warn', 'Não há logs para copiar.');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    // fallback: seleção + execCommand (clipboard API indisponível)
    const range = document.createRange();
    range.selectNodeContents(out);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const ok = document.execCommand('copy');
    sel.removeAllRanges();
    if (!ok) {
      toast('error', 'Não foi possível copiar o log.');
      return;
    }
  }
  toast('ok', 'Log copiado para a área de transferência.');
}

// Monta um nome de arquivo padrão a partir do rótulo do painel + timestamp.
// Ex.: "Logs — projeto/serviço" → "logs-projeto-servico-20260915-1642.log"
function buildLogFileName() {
  const title = document.getElementById('logs-title').textContent || '';
  const label = title.replace(/^Logs\s*[—-]\s*/, '').trim();
  const safe = (label || 'log')
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  return `logs-${safe || 'log'}-${stamp}.log`;
}

// Salva o conteúdo atualmente exibido no painel de logs em um arquivo (diálogo nativo).
async function saveLogsToFile() {
  flushLogs();
  const content = document.getElementById('logs-output').textContent || '';
  if (!content.trim()) {
    toast('warn', 'Não há logs para salvar.');
    return;
  }
  try {
    const res = await window.api.saveLogs({ defaultName: buildLogFileName(), content });
    if (!res || res.canceled) return;
    if (res.error) {
      toast('error', 'Falha ao salvar log: ' + res.error);
      return;
    }
    toast('ok', 'Log salvo em ' + res.filePath);
  } catch (e) {
    toast('error', 'Falha ao salvar log: ' + e.message);
  }
}

/* ===================== Painel de configurações ===================== */
// Grupo atual (nome, crítico), atualização automática, grupos e zona de risco.
// Nome/crítico/intervalo só valem ao "Salvar alterações"; Novo grupo,
// Importar e Excluir agem na hora (e fecham o painel).
function settingsDrawerEl() {
  return document.getElementById('settings-drawer');
}

function openSettingsPanel() {
  const group = currentGroup();
  document.getElementById('settings-group-section').hidden = !group;
  document.getElementById('settings-danger').hidden = !group;
  const nameInput = document.getElementById('set-group-name');
  nameInput.value = group ? group.name : '';
  nameInput.removeAttribute('aria-invalid');
  document.getElementById('set-poll').removeAttribute('aria-invalid');
  setCriticalSwitch(Boolean(group && group.critical));
  setPollField(Math.round(statusPollMs / 1000));
  document.getElementById('settings-error').textContent = '';
  renderDangerText(group);
  openLayer(settingsDrawerEl(), { initialFocus: group ? '#set-group-name' : '#set-poll' });
}

function closeSettingsPanel() {
  closeLayer(settingsDrawerEl());
}

function setCriticalSwitch(on) {
  document.getElementById('set-critical').setAttribute('aria-checked', String(on));
}

function setPollField(seconds) {
  document.getElementById('set-poll').value = String(seconds);
  syncPollPresets(seconds);
}

function syncPollPresets(seconds) {
  document.querySelectorAll('#set-poll-presets button[data-seconds]').forEach((b) => {
    b.setAttribute('aria-pressed', String(String(seconds) !== '' && Number(b.dataset.seconds) === Number(seconds)));
  });
}

function renderDangerText(group) {
  const p = document.getElementById('danger-text');
  p.textContent = '';
  if (!group) return;
  const n = group.servers.length;
  const servers = n === 1 ? 'o servidor cadastrado' : `os ${n} servidores cadastrados`;
  p.append(
    el('strong', '', `Excluir grupo ${group.name}`),
    document.createTextNode(
      ` — remove o grupo e ${servers} nele deste aplicativo. Os servidores e containers continuam rodando.`
    )
  );
}

async function saveSettings(e) {
  e.preventDefault();
  const errorEl = document.getElementById('settings-error');
  errorEl.textContent = '';
  const group = currentGroup();

  const pollInput = document.getElementById('set-poll');
  const seconds = Math.floor(Number(pollInput.value));
  if (!Number.isFinite(seconds) || seconds < 0 || (seconds > 0 && seconds < 5) || seconds > 3600) {
    pollInput.setAttribute('aria-invalid', 'true');
    errorEl.textContent = 'Intervalo inválido: use Desligada ou um valor entre 5 e 3600 segundos.';
    pollInput.focus();
    return;
  }
  pollInput.removeAttribute('aria-invalid');

  const nameInput = document.getElementById('set-group-name');
  const name = nameInput.value.trim();
  if (group && !name) {
    nameInput.setAttribute('aria-invalid', 'true');
    errorEl.textContent = 'Informe o nome do grupo.';
    nameInput.focus();
    return;
  }
  nameInput.removeAttribute('aria-invalid');

  const critical = document.getElementById('set-critical').getAttribute('aria-checked') === 'true';
  const renamed = Boolean(group) && name !== group.name;
  const criticalChanged = Boolean(group) && critical !== Boolean(group.critical);
  const pollChanged = normalizePollMs(seconds) !== statusPollMs;

  try {
    if (renamed) await window.api.renameGroup(group.id, name);
    if (criticalChanged) await window.api.setGroupCritical(group.id, critical);
    if (pollChanged) {
      await window.api.updateSettings({ pollIntervalSeconds: seconds });
      statusPollMs = normalizePollMs(seconds);
    }
    if (renamed || criticalChanged) await reloadGroups(group.id); // reinicia o polling também
    else if (pollChanged) startStatusPolling();
  } catch (err) {
    errorEl.textContent = 'Falha ao salvar: ' + (err && err.message ? err.message : err);
    return;
  }

  if (criticalChanged) {
    log(
      'info',
      '',
      '',
      critical
        ? `Grupo "${name}" marcado como CRÍTICO — toda ação pedirá confirmação.`
        : `Grupo "${name}" não é mais crítico.`
    );
  }
  closeSettingsPanel();
  toast('ok', 'Configurações salvas.');
}

// Exclusão do grupo: confirma digitando o nome exato do grupo.
async function deleteGroupFlow() {
  const group = currentGroup();
  if (!group) return;
  closeSettingsPanel();
  const typed = await promptText(`Para excluir, digite o nome do grupo: ${group.name}`, '');
  if (typed === null) return;
  if (typed !== group.name) {
    toast('warn', 'O nome não confere — o grupo não foi excluído.');
    return;
  }
  try {
    await window.api.deleteGroup(group.id);
    log('info', '', '', `Grupo "${group.name}" excluído do aplicativo (os servidores continuam rodando).`);
    await reloadGroups();
  } catch (e) {
    log('error', '', '', e.message);
  }
}

/* ===================== Bootstrap ===================== */
window.addEventListener('DOMContentLoaded', async () => {
  // Versão do app no rodapé da barra lateral (não-fatal: nunca deve impedir
  // o restante do bootstrap se falhar).
  window.api
    .getAppVersion()
    .then((ver) => {
      if (ver) document.getElementById('app-version').textContent = 'v' + ver;
    })
    .catch(() => {});

  // Injeta os ícones SVG nos elementos estáticos marcados com data-icon
  hydrateIcons(document);
  renderServers(); // linhas skeleton até o cadastro carregar

  // Carrega preferências (intervalo de atualização) antes de iniciar o polling,
  // pois reloadGroups() → startStatusPolling() usa statusPollMs.
  try {
    const s = await window.api.getSettings();
    statusPollMs = normalizePollMs(s && s.pollIntervalSeconds);
  } catch {}

  await loadGroupsSafely();

  // Barra de ferramentas: busca (tempo real) e filtro por status, combinados
  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderServers();
    renderFilterCounts();
    renderBatchBar();
  });
  document.getElementById('status-filter').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-filter]');
    if (btn) setStatusFilter(btn.dataset.filter);
  });

  document.getElementById('group-new').addEventListener('click', createGroupFlow);

  document.getElementById('group-delete').addEventListener('click', deleteGroupFlow);
  document.getElementById('group-import').addEventListener('click', () => {
    closeSettingsPanel();
    importGroupFlow();
  });
  document.getElementById('set-group-new').addEventListener('click', () => {
    closeSettingsPanel();
    createGroupFlow();
  });

  document.getElementById('server-add').addEventListener('click', () => {
    if (!currentGroupId) {
      log('warn', '', '', 'Crie ou selecione um grupo antes de adicionar servidores.');
      return;
    }
    openServerModal(null);
  });

  document.getElementById('server-form').addEventListener('submit', submitServer);
  document.getElementById('f-type').addEventListener('change', (e) => applyTypeFields(e.target.value));
  document.getElementById('modal-test').addEventListener('click', testDockerConnection);
  document.getElementById('modal-cancel').addEventListener('click', closeServerModal);
  document.getElementById('modal-close').addEventListener('click', closeServerModal);

  // Confirmação de ação em grupo crítico
  document.getElementById('confirm-ok').addEventListener('click', confirmOk);
  document.getElementById('confirm-cancel').addEventListener('click', () =>
    closeLayer(document.getElementById('confirm-dialog'))
  );

  // Histórico de eventos (substitui a antiga seção "Saída")
  const historyModal = document.getElementById('history-modal');
  const historyLog = document.getElementById('history-log');
  const openHistory = () => {
    if (!historyLog.childElementCount) {
      const p = document.createElement('div');
      p.className = 'log-empty';
      p.textContent = 'Nenhum evento registrado nesta sessão.';
      historyLog.appendChild(p);
    }
    openLayer(historyModal, { initialFocus: '#history-log' });
    clearHistoryBadge();
    historyLog.scrollTop = historyLog.scrollHeight;
  };
  const closeHistory = () => closeLayer(historyModal);
  document.getElementById('history-open').addEventListener('click', openHistory);
  document.getElementById('history-close').addEventListener('click', closeHistory);
  document.getElementById('history-clear').addEventListener('click', () => {
    historyLog.innerHTML = '';
    clearHistoryBadge();
  });

  // Painel de configurações
  document.getElementById('settings-open').addEventListener('click', openSettingsPanel);
  document.getElementById('settings-close').addEventListener('click', closeSettingsPanel);
  document.getElementById('settings-cancel').addEventListener('click', closeSettingsPanel);
  document.getElementById('settings-form').addEventListener('submit', saveSettings);
  document.getElementById('set-critical').addEventListener('click', (e) => {
    const sw = e.currentTarget;
    setCriticalSwitch(sw.getAttribute('aria-checked') !== 'true');
  });
  document.getElementById('set-poll-presets').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-seconds]');
    if (btn) setPollField(Number(btn.dataset.seconds));
  });
  document.getElementById('set-poll').addEventListener('input', (e) => syncPollPresets(e.target.value));

  // Camadas (painéis): clique fora fecha; Esc/Tab tratados na pilha de camadas
  document.querySelectorAll('.drawer-scrim').forEach((scrim) => {
    scrim.addEventListener('mousedown', (e) => {
      if (e.target === scrim) closeLayer(scrim);
    });
  });
  document.addEventListener('keydown', onLayerKeydown);

  document.getElementById('status-refresh').addEventListener('click', () => {
    if (!currentGroupId) {
      log('warn', '', '', 'Selecione um grupo primeiro.');
      return;
    }
    refreshStatus();
  });

  window.api.onLog((entry) => {
    appendLog(entry);
    if (!entry || entry.level !== 'error') return;
    const message = cleanError({ message: entry.message || '' });
    const server = serverFromLog(entry);
    if (!server) {
      // sem host: a ação nem chegou a rodar (ex.: grupo/servidor não encontrado)
      if (!entry.host) {
        clearAllBusy();
        scheduleRender();
        toast('error', message);
      } else if (classifyError(message) !== 'cmd') {
        toast('error', `${entry.host}: ${message}`);
      }
      return;
    }
    finishActionWithError(server, entry); // encerra só o que falhou
    setRowError(server, message);
    scheduleRender();
  });

  // Logs em tempo real (painel lateral)
  document.getElementById('logs-close').addEventListener('click', closeLogsPanel);
  document.getElementById('logs-clear').addEventListener('click', () => {
    clearLogsOutput();
  });
  document.getElementById('logs-copy').addEventListener('click', copyLogs);
  document.getElementById('logs-save').addEventListener('click', saveLogsToFile);
  document.getElementById('logs-tail').addEventListener('change', restartLogs);
  window.api.onLogsData(({ sessionId, chunk }) => {
    if (sessionId !== currentSessionId) return;
    if (logsState === 'connecting') setLogsState('live');
    appendLogsText(chunk);
  });
  window.api.onLogsEnd(({ sessionId, reason, message }) => {
    if (sessionId !== currentSessionId) return;
    appendLogsText('\n— stream encerrado' + (reason === 'error' ? ': ' + (message || '') : '') + ' —\n');
    currentSessionId = null;
    setLogsState(reason === 'error' ? 'error' : 'ended');
  });

  // Atualiza a célula de status por chave (windows: serverId; docker:
  // serverId::composeFile[::service]) assim que o backend responde.
  window.api.onStatus((s) => {
    const key = s.key || s.serverId;
    // Ignora leituras de um grupo que já foi fechado (ciclo ainda em andamento)
    const group = currentGroup();
    const serverId = String(key).split('::')[0];
    if (!group || !group.servers.some((srv) => srv.id === serverId)) return;
    statusByKey[key] = s.state;
    statusSeen.add(key);
    lastReadAt = Date.now();
    const depth = String(key).split('::').length;
    if (depth === 3) collectContainerStatus(key, s.state);
    if (depth === 2) applyProjectBurst(serverId, String(key).split('::')[1]);
    if (depth === 1 && busy.has(key) && s.state === 'pending') {
      // a ação terminou com o serviço ainda em START/STOP_PENDING: mantém o
      // "em andamento" e relê em alguns segundos (teto: BUSY_TIMEOUT_MS)
      scheduleRecheck();
    } else {
      settleBusyFromStatus(key);
    }
    if (key === serverId && s.state !== 'error') clearConnError(serverId);
    scheduleRender();
  });

  // Seleção: checkbox do cabeçalho (todos os visíveis) e ações em lote
  document.getElementById('select-all').addEventListener('change', toggleSelectAllVisible);
  document.getElementById('batch-start').addEventListener('click', () => runBatch('start'));
  document.getElementById('batch-stop').addEventListener('click', () => runBatch('stop'));
  document.getElementById('batch-restart').addEventListener('click', () => runBatch('restart'));
  document.getElementById('batch-clear').addEventListener('click', clearSelection);
});
