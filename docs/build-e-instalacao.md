# Build e instalação

Guia para desenvolver, testar e empacotar o Remora, além de preparar os servidores de destino.

## Requisitos

- **Node.js** + **npm** (ambiente de desenvolvimento no Windows).
- **Git** para clonar o repositório.
- Windows para gerar o instalador (`electron-builder` com alvo NSIS).

## Desenvolvimento

```bash
npm install     # instala dependências
npm start       # executa o app (electron .)
npm test        # roda a suíte de testes (node --test)
```

Scripts disponíveis (de `package.json`):

| Script | Comando | Descrição |
| ------ | ------- | --------- |
| `start` | `electron .` | Executa o app em modo desenvolvimento. |
| `test` | `node --test test/*.test.js` | Suíte de testes nativa do Node. |
| `build` | `electron-builder` | Gera o instalador NSIS em `dist/`. |
| `build-dir` | `electron-builder --dir` | Gera a pasta descompactada (sem instalador). |
| `release` | `node scripts/release.js` | Publica uma nova versão no GitHub (veja [Publicando uma release](#publicando-uma-release)). |

## Empacotamento

O `build` do `electron-builder` está configurado dentro do `package.json`:

| Propriedade | Valor |
| ----------- | ----- |
| `appId` | `com.kaique.remora` |
| `productName` | `Remora` |
| `directories.output` | `dist` |
| `win.target` | `nsis` |
| `win.icon` | `src/ui/icon.ico` |
| `nsis.oneClick` | `false` (instalador com etapas) |
| `nsis.allowToChangeInstallationDirectory` | `true` |
| `asar` | `false` |

O `ffmpeg.dll` do Electron é copiado como recurso extra. Após `npm run build`, o instalador fica em
`dist/`.

## Publicando uma release

O script `npm run release` faz o fluxo inteiro de publicação:

1. Confere que você está na `main`, sem alterações pendentes, sincronizado com o `origin`, que a tag
   ainda não existe e que o GitHub CLI está logado.
2. Sobe a versão no `package.json` e no badge do `README.md`.
3. Roda `npm test` e `npm run build`. Se algum falhar, desfaz a mudança de versão.
4. Commita `Remora X.Y.Z`, cria a tag `vX.Y.Z` e envia os dois para o `origin`.
5. Cria a release no GitHub com o `Remora-Setup-X.Y.Z.exe` anexado.

```bash
npm run release                          # patch: 2.4.6 -> 2.4.7
npm run release -- minor                 # 2.4.6 -> 2.5.0
npm run release -- major                 # 2.4.6 -> 3.0.0
npm run release -- 2.6.0                 # versão explícita
npm run release -- --dry-run             # só verifica, não altera nada
npm run release -- --notes-file notas.md # notas próprias (padrão: geradas dos commits)
npm run release -- --notes "Correções"   # notas em uma linha
npm run release -- --draft               # cria a release como rascunho
```

**Pré-requisito:** [GitHub CLI](https://cli.github.com) instalado e logado (`gh auth login`) com uma
conta que tenha permissão de escrita no repositório. Se o `git push` der erro 403 por causa de outra
conta salva no Windows, rode `gh auth setup-git` para o Git usar a mesma conta do `gh`.

## Setup do servidor de destino (SSH)

O app se conecta aos servidores via SSH. O host precisa aceitar conexões SSH.

### Windows (OpenSSH)

Baixe/instale o Win32-OpenSSH: <https://github.com/PowerShell/Win32-OpenSSH/releases>

No **PowerShell como administrador**:

```powershell
# Instalar o serviço sshd
cd 'C:\Program Files\OpenSSH'
powershell.exe -ExecutionPolicy Bypass -File install-sshd.ps1

# Habilitar e iniciar
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

# Liberar a porta 22 no firewall
New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server (sshd)' -Enabled True `
  -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
```

Para servidores do tipo **Serviço Windows**, o usuário SSH precisa de permissão para controlar o
serviço (`sc start/stop/query`). Para acompanhar logs, informe o **Caminho do serviço** no cadastro
(o app faz `tail` do `console.log` naquele diretório).

> **Shell padrão do OpenSSH:** mantenha o **cmd.exe** (padrão do Win32-OpenSSH). Os comandos `sc` e a
> consulta de status em lote (`echo … & sc query …`) dependem dele. Se o `DefaultShell` em
> `HKLM:\SOFTWARE\OpenSSH` apontar para o PowerShell, o status fica "—" e o console avisa
> *"resposta sem marcadores"*.

### Linux (servidores Docker)

- Garanta o `sshd` ativo e acessível na porta configurada.
- Instale o **Docker** com o plugin **Compose v2** (`docker compose version` deve responder).
- Adicione o usuário SSH ao grupo `docker` para dispensar `sudo`:

```bash
sudo usermod -aG docker <usuario>
# reconecte a sessão SSH para aplicar
```

- Os arquivos `docker-compose.yml`/`compose.yml` devem estar sob o **diretório compose** informado
  no cadastro (a descoberta procura até 2 níveis de profundidade).

## Arquivos ignorados no versionamento

O `.gitignore` já exclui dados sensíveis e artefatos:

```
configs/*.ini
.config/
*.ini
node_modules/
package-lock.json
dist/
.vscode/
```

Ou seja, arquivos de configuração com credenciais (`*.ini`) e a saída de build (`dist/`) não são
versionados.
