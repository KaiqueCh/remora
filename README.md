# Remora

> Gerenciador de serviços remoto para **Serviços Windows** e **projetos Docker Compose**, tudo via SSH, em uma única interface desktop.

![versão](https://img.shields.io/badge/vers%C3%A3o-2.4.6-blue)
![plataforma](https://img.shields.io/badge/plataforma-Windows-0078D6)
![Electron](https://img.shields.io/badge/Electron-36-47848F)
![licença](https://img.shields.io/badge/licen%C3%A7a-MIT-green)

---

## Visão geral

O **Remora** é um aplicativo desktop em **Electron**
que centraliza o gerenciamento de serviços e containers espalhados por vários servidores remotos.
Em vez de abrir SSH manualmente em cada host, você cadastra os servidores em **grupos** e
inicia/para/reinicia serviços — além de acompanhar **logs em tempo real** — direto da interface.

São suportados dois tipos de servidor:

- **Serviço Windows** — controla um serviço via `sc` e acompanha o `console.log` do serviço.
- **Docker (Compose)** — descobre projetos `docker-compose` em um diretório e gerencia projetos e
  serviços individuais, exibidos em **árvore** (servidor → projeto → serviço).

## Principais recursos

- 🗂️ **Grupos e servidores** — organize hosts em grupos; marque grupos como **críticos** para exigir
  confirmação em toda operação (proteção de produção).
- 🪟 **Serviços Windows** — start/stop/restart individual ou em lote; visualização do `console.log`.
- 🐳 **Docker Compose** — árvore de projetos/serviços com ações por projeto e por serviço
  (`up`/`down`/`restart`); descoberta automática de arquivos compose.
- 🔌 **Testar conexão** — valida SSH + presença do `docker compose v2` e lista os projetos encontrados.
- 📜 **Logs em tempo real** — streaming via SSH com suporte a **cores ANSI**, campo de *tail* ajustável.
- 🟢 **Status ao vivo** — indicadores coloridos com *polling* automático de **intervalo configurável**
  (padrão 30s; pode ser desligado) + atualização manual.
- 🔔 **Notificações e histórico** — *toasts* de feedback imediato e modal de **Histórico** com todos
  os eventos da sessão.
- 📥 **Importação** — importa servidores de arquivos `.ini` ou `.json`.
- 🔐 **Credenciais criptografadas** — senhas guardadas com `safeStorage` (DPAPI no Windows), nunca em texto plano.
- 🛡️ **Anti-MITM (TOFU)** — verificação da *host key* SSH; alerta se a impressão digital mudar.
- 🔑 **Autenticação PAM** — suporte a `keyboard-interactive` além de senha simples.

## Download

Baixe o instalador para Windows na página de
[**Releases**](https://github.com/KaiqueCh/remora/releases/latest) (`Remora-Setup-x.y.z.exe`).

> O instalador não tem assinatura digital, então o Windows SmartScreen pode avisar
> *"O Windows protegeu o computador"*. Para continuar, clique em **Mais informações → Executar assim mesmo**.

## Desenvolvimento

```bash
# Requisitos: Node.js + npm (Windows)
npm install        # instala dependências
npm start          # executa em modo desenvolvimento (electron .)
npm test           # roda a suíte de testes
npm run build      # gera o instalador NSIS em dist/
npm run release    # publica uma nova versão no GitHub (testes + build + tag + release)
```

> **Pré-requisito no servidor de destino:** o host precisa aceitar conexões SSH (OpenSSH).
> Para servidores Docker, o usuário SSH deve pertencer ao grupo `docker`.
> Veja o passo a passo em [docs/build-e-instalacao.md](docs/build-e-instalacao.md).

## Stack

| Camada        | Tecnologia                    |
| ------------- | ----------------------------- |
| Desktop       | Electron `^36.2.0`            |
| SSH           | `ssh2` `^1.11.0`             |
| Import config | `ini` `^5.0.0`              |
| Empacotamento | `electron-builder` `^24.13.3` (NSIS) |
| Testes        | `node --test` (nativo)        |

## Estrutura do projeto

```
remora/
├── src/
│   ├── main.js        # processo principal Electron + handlers IPC
│   ├── index.js       # camada SSH (exec, streaming, runner, TOFU)
│   ├── docker.js      # builders de comando e parsers do Docker Compose
│   ├── vault.js       # armazenamento criptografado de credenciais + validadores
│   ├── settings.js    # preferências do app (intervalo de atualização) em JSON
│   ├── userDataMigration.js # copia os dados da pasta anterior ao rename para Remora
│   ├── preload.js     # ponte contextBridge (window.api)
│   └── ui/            # index.html, renderer.js, css/, fonts/, icon.ico
├── scripts/
│   └── release.js     # automação de release (npm run release)
├── test/              # testes (node --test)
├── docs/              # documentação (veja abaixo)
└── package.json
```

## Documentação

| Documento | Conteúdo |
| --------- | -------- |
| [Guia do usuário](docs/guia-usuario.md) | Como instalar, cadastrar servidores e operar o app. |
| [Arquitetura](docs/arquitetura.md) | Camadas, canais IPC, módulos e API `window.api`. |
| [Segurança](docs/seguranca.md) | Criptografia, TOFU anti-MITM, validação e allowlist. |
| [Build e instalação](docs/build-e-instalacao.md) | Desenvolvimento, empacotamento e setup do servidor SSH. |

## Licença

Distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para os termos completos.
