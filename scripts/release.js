#!/usr/bin/env node
// Publica uma nova versão do Remora de ponta a ponta:
//   verifica o repositório -> sobe a versão -> testes -> build -> commit/tag/push -> release no GitHub.
//
// Uso:
//   npm run release                 # patch (2.4.6 -> 2.4.7)
//   npm run release -- minor        # 2.4.6 -> 2.5.0
//   npm run release -- major        # 2.4.6 -> 3.0.0
//   npm run release -- 2.6.0        # versão explícita
//
// Opções:
//   --notes "texto"        notas da release
//   --notes-file arquivo   notas da release lidas de um arquivo .md
//                          (sem nenhuma das duas, o GitHub gera as notas a partir dos commits)
//   --draft                cria a release como rascunho
//   --dry-run              só verifica e mostra o que seria feito, sem alterar nada
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const BRANCH = 'main';
const REMOTE = 'origin';
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const BADGE = /(img\.shields\.io\/badge\/vers%C3%A3o-)\d+\.\d+\.\d+(-)/;

// ---------- lógica pura (testada em test/release.test.js) ----------

function parseVersion(v) {
    const m = SEMVER.exec(v);
    if (!m) throw new Error(`Versão inválida: "${v}" (esperado X.Y.Z)`);
    return m.slice(1).map(Number);
}

function compareVersions(a, b) {
    const pa = parseVersion(a);
    const pb = parseVersion(b);
    for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
    return 0;
}

function nextVersion(current, bump) {
    const [maj, min, pat] = parseVersion(current);
    if (bump === 'patch') return `${maj}.${min}.${pat + 1}`;
    if (bump === 'minor') return `${maj}.${min + 1}.0`;
    if (bump === 'major') return `${maj + 1}.0.0`;
    const explicit = String(bump).replace(/^v/, '');
    if (!SEMVER.test(explicit)) {
        throw new Error(`Argumento inválido: "${bump}" (use patch, minor, major ou X.Y.Z)`);
    }
    if (compareVersions(explicit, current) <= 0) {
        throw new Error(`A nova versão (${explicit}) precisa ser maior que a atual (${current})`);
    }
    return explicit;
}

function setPackageVersion(text, version) {
    // Troca só a primeira ocorrência (o "version" de nível superior) para preservar a formatação.
    const re = /("version"\s*:\s*")[^"]*(")/;
    if (!re.test(text)) throw new Error('Campo "version" não encontrado no package.json');
    return text.replace(re, `$1${version}$2`);
}

function setReadmeBadge(text, version) {
    if (!BADGE.test(text)) throw new Error('Badge de versão não encontrado no README.md');
    return text.replace(BADGE, `$1${version}$2`);
}

function installerName(version) {
    return `Remora-Setup-${version}.exe`;
}

// ---------- execução ----------

function parseArgs(argv) {
    const opts = { bump: 'patch', notes: null, notesFile: null, draft: false, dryRun: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--notes') opts.notes = argv[++i];
        else if (a === '--notes-file') opts.notesFile = argv[++i];
        else if (a === '--draft') opts.draft = true;
        else if (a === '--dry-run') opts.dryRun = true;
        else if (a.startsWith('--')) throw new Error(`Opção desconhecida: ${a}`);
        else opts.bump = a;
    }
    if (opts.notes != null && opts.notesFile != null) {
        throw new Error('Use --notes ou --notes-file, não os dois');
    }
    return opts;
}

function run(cmd, args, { capture = false, shell = false, allowFail = false } = {}) {
    const res = spawnSync(cmd, args, {
        cwd: ROOT,
        shell,
        encoding: 'utf8',
        stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });
    if (res.error) throw new Error(`Falha ao executar ${cmd}: ${res.error.message}`);
    if (res.status !== 0 && !allowFail) {
        const detail = capture ? `\n${(res.stderr || res.stdout || '').trim()}` : '';
        throw new Error(`Comando falhou (${res.status}): ${cmd} ${args.join(' ')}${detail}`);
    }
    return capture ? (res.stdout || '').trim() : res.status;
}

const git = (args, o) => run('git', args, { capture: true, ...o });
const npm = (args) => run('npm', args, { shell: true }); // npm é npm.cmd no Windows

function step(msg) {
    console.log(`\n\x1b[36m▶ ${msg}\x1b[0m`);
}

function preflight(tag) {
    step('Verificando o repositório');
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
    if (branch !== BRANCH) throw new Error(`Você está na branch "${branch}"; troque para "${BRANCH}"`);

    if (git(['status', '--porcelain'])) {
        throw new Error('Há alterações não commitadas. Faça commit ou descarte antes da release.');
    }

    git(['fetch', REMOTE, BRANCH, '--tags']);
    const local = git(['rev-parse', BRANCH]);
    const remote = git(['rev-parse', `${REMOTE}/${BRANCH}`]);
    if (local !== remote) {
        const base = git(['merge-base', BRANCH, `${REMOTE}/${BRANCH}`]);
        if (base === local) throw new Error(`A branch local está atrás de ${REMOTE}/${BRANCH}. Rode "git pull".`);
        if (base !== remote) throw new Error(`A branch local divergiu de ${REMOTE}/${BRANCH}. Resolva antes.`);
        // local à frente do remoto: os commits pendentes sobem junto com a release.
    }

    if (git(['tag', '--list', tag])) throw new Error(`A tag ${tag} já existe`);
    if (git(['ls-remote', '--tags', REMOTE, `refs/tags/${tag}`])) {
        throw new Error(`A tag ${tag} já existe em ${REMOTE}`);
    }

    const gh = spawnSync('gh', ['auth', 'status'], { cwd: ROOT, stdio: 'ignore' });
    if (gh.error) throw new Error('GitHub CLI (gh) não encontrado. Instale em https://cli.github.com');
    if (gh.status !== 0) throw new Error('GitHub CLI não está logado. Rode "gh auth login".');
}

function restoreFiles(files) {
    spawnSync('git', ['checkout', '--', ...files], { cwd: ROOT, stdio: 'inherit' });
}

function main() {
    const opts = parseArgs(process.argv.slice(2));
    const pkgPath = path.join(ROOT, 'package.json');
    const readmePath = path.join(ROOT, 'README.md');

    const pkgText = fs.readFileSync(pkgPath, 'utf8');
    const current = JSON.parse(pkgText).version;
    const version = nextVersion(current, opts.bump);
    const tag = `v${version}`;
    const installer = path.join(ROOT, 'dist', installerName(version));

    if (opts.notesFile && !fs.existsSync(opts.notesFile)) {
        throw new Error(`Arquivo de notas não encontrado: ${opts.notesFile}`);
    }

    console.log(`Remora ${current} → ${version}${opts.dryRun ? '  (dry-run)' : ''}`);
    preflight(tag);

    if (opts.dryRun) {
        console.log('\nTudo certo. Sem --dry-run, o script vai:');
        console.log(`  1. atualizar package.json e o badge do README para ${version}`);
        console.log('  2. rodar npm test e npm run build');
        console.log(`  3. commitar "Remora ${version}", criar a tag ${tag} e enviar para ${REMOTE}`);
        console.log(`  4. publicar a release ${tag} com ${installerName(version)}`);
        return;
    }

    const changed = ['package.json', 'README.md'];
    step(`Atualizando a versão para ${version}`);
    fs.writeFileSync(pkgPath, setPackageVersion(pkgText, version));
    fs.writeFileSync(readmePath, setReadmeBadge(fs.readFileSync(readmePath, 'utf8'), version));

    try {
        step('Rodando os testes');
        npm(['test']);
        step('Gerando o instalador');
        npm(['run', 'build']);
        if (!fs.existsSync(installer)) throw new Error(`Instalador não encontrado: ${installer}`);
    } catch (err) {
        console.error('\nFalhou antes do commit. Revertendo package.json e README.md.');
        restoreFiles(changed);
        throw err;
    }

    step(`Commitando e criando a tag ${tag}`);
    git(['add', ...changed]);
    git(['commit', '-m', `Remora ${version}`]);
    git(['tag', '-a', tag, '-m', `Remora ${version}`]);

    step(`Enviando para ${REMOTE}`);
    run('git', ['push', REMOTE, BRANCH]);
    run('git', ['push', REMOTE, tag]);

    step('Publicando a release no GitHub');
    const ghArgs = ['release', 'create', tag, installer, '--title', `Remora ${version}`, '--verify-tag'];
    if (opts.notesFile) ghArgs.push('--notes-file', opts.notesFile);
    else if (opts.notes != null) ghArgs.push('--notes', opts.notes);
    else ghArgs.push('--generate-notes');
    if (opts.draft) ghArgs.push('--draft');
    else ghArgs.push('--latest');

    try {
        run('gh', ghArgs);
    } catch (err) {
        console.error('\nO commit e a tag já foram enviados, mas a release não foi criada.');
        console.error('Para tentar de novo, rode:');
        console.error(`  gh ${ghArgs.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ')}`);
        throw err;
    }

    console.log(`\n\x1b[32m✔ Remora ${version} publicado.\x1b[0m`);
}

module.exports = {
    parseVersion,
    compareVersions,
    nextVersion,
    setPackageVersion,
    setReadmeBadge,
    installerName,
    parseArgs,
};

if (require.main === module) {
    try {
        main();
    } catch (err) {
        console.error(`\n\x1b[31m✖ ${err.message}\x1b[0m`);
        process.exit(1);
    }
}
