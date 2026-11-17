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
| `test` | `node --test test/docker.test.js test/windows.test.js` | Suíte de testes nativa do Node. |
| `build` | `electron-builder` | Gera o instalador NSIS em `dist/`. |
| `build-dir` | `electron-builder --dir` | Gera a pasta descompactada (sem instalador). |

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
