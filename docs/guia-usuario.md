# Guia do usuário

Este guia explica como usar o **Remora** no dia a dia:
instalar, cadastrar servidores e operar serviços Windows e projetos Docker.

## Índice

- [Instalação e primeira execução](#instalação-e-primeira-execução)
- [Conceitos: grupos e servidores](#conceitos-grupos-e-servidores)
- [Configurações (grupos e preferências)](#configurações-grupos-e-preferências)
- [Cadastrar um servidor](#cadastrar-um-servidor)
- [Operar serviços Windows](#operar-serviços-windows)
- [Operar projetos Docker](#operar-projetos-docker)
- [Logs em tempo real](#logs-em-tempo-real)
- [Status e atualização](#status-e-atualização)
- [Notificações e histórico](#notificações-e-histórico)
- [Grupos críticos](#grupos-críticos)
- [Importar servidores de arquivo](#importar-servidores-de-arquivo)
- [Solução de problemas](#solução-de-problemas)

## Instalação e primeira execução

1. Execute o instalador gerado (`dist/…​.exe`, formato NSIS). Você pode escolher o diretório de
   instalação durante o processo.
2. Abra o **Remora**. A janela abre centralizada, com tamanho ajustado
   automaticamente à área útil da tela.
3. Na primeira execução, o app verifica se a **criptografia de credenciais** está disponível.
   Se não estiver, o cadastro de servidores é bloqueado (veja [Solução de problemas](#solução-de-problemas)).

> Para desenvolvimento, rode `npm start` na raiz do projeto.

> **Atualizando de versões anteriores ao nome Remora:** os dados agora ficam em
> `%APPDATA%\Remora`. Na primeira execução, o app copia automaticamente o cadastro de servidores e
> as preferências da pasta antiga (`%APPDATA%\script-sinapse` ou `%APPDATA%\Gerenciador de Serviços`),
> sem apagá-la. Depois de confirmar que está tudo lá, a pasta antiga pode ser removida.

## Conceitos: grupos e servidores

- **Grupo** — um conjunto de servidores relacionados (ex.: "Produção", "Homologação"). Você
  seleciona o grupo ativo em um menu suspenso.
- **Servidor** — um host remoto acessado via SSH. Cada servidor tem um **tipo**:
  - **Serviço Windows** — controla um serviço do Windows pelo nome.
  - **Docker (compose)** — gerencia projetos Docker Compose encontrados em um diretório.

Um grupo pode ser marcado como **crítico** (⚠), passando a exigir confirmação digitada em toda
operação sensível.

## Configurações (grupos e preferências)

Clique no botão de engrenagem (⚙) no cabeçalho para abrir o **modal de Configurações**, dividido
em duas seções:

**Grupos** — ações sobre o grupo selecionado:

| Ação | Descrição |
| ---- | --------- |
| **Novo** | Cria um grupo com o nome informado. |
| **Renomear** | Renomeia o grupo selecionado. |
| **Crítico** | Alterna o status crítico do grupo (⚠). |
| **Excluir** | Remove o grupo (pede confirmação digitando `EXCLUIR`). |
| **Importar .ini/.json** | Cria um grupo a partir de um arquivo de configuração. |

**Atualização automática** — define o **intervalo de polling do status** em segundos:

- `0` — desligado (o status só atualiza pelo botão **Atualizar status**).
- `5` a `3600` — intervalo entre atualizações automáticas (padrão: `30`).

O valor é salvo como preferência e aplicado imediatamente ao salvar.

O tema (claro/escuro) é alternado pelo botão de sol/lua no canto direito do cabeçalho.

## Cadastrar um servidor

Com um grupo selecionado, clique em **＋ (Adicionar servidor)** para abrir o modal de cadastro.
Escolha o **tipo** no seletor e preencha os campos.

### Tipo: Serviço Windows

| Campo | Obrigatório | Observação |
| ----- | ----------- | ---------- |
| Host | ✔ | Hostname ou IP. |
| Porta | ✔ | Padrão `22`. |
| Usuário | ✔ | Usuário SSH. |
| Senha | ✔* | Criptografada. Em edição, deixe em branco para manter a atual. |
| Nome do serviço | ✔ | Nome exato do serviço Windows (aceita espaços). |
| Caminho do serviço | ✖ | Caminho Windows (ex.: `C:\services\meuapp`) usado para ler o `console.log`. |

### Tipo: Docker (compose)

| Campo | Obrigatório | Observação |
| ----- | ----------- | ---------- |
| Host | ✔ | Hostname ou IP. |
| Porta | ✔ | Padrão `22`. |
| Usuário | ✔ | Deve pertencer ao grupo `docker` no servidor. |
| Senha | ✔* | Criptografada. |
| Diretório compose | ✔ | Caminho **absoluto** (ex.: `/kingposto`). A descoberta procura arquivos compose até 2 níveis. |

Antes de salvar um servidor Docker, use o botão **Testar conexão**: ele valida o SSH, confirma a
presença do `docker compose v2` e lista os projetos encontrados no diretório informado.

Clique em **Salvar**. Cada servidor cadastrado aparece na tabela do grupo, com botões de **editar (✎)**
e **remover (🗑)** — a remoção pede confirmação digitando `REMOVER`.

## Operar serviços Windows

Na linha de cada servidor Windows há botões inline:

- **▶ Iniciar** · **⏹ Parar** · **↻ Reiniciar** — ações individuais.
- **▤ Logs** — abre o modal de logs (disponível apenas se o *Caminho do serviço* foi preenchido).

Também existem os botões centrais **Iniciar / Parar / Reiniciar serviço**, que aplicam a ação a
**todos** os servidores Windows do grupo de uma vez.

## Operar projetos Docker

1. Clique no *chevron* (▸) na linha do servidor Docker para **expandir a árvore**. O app descobre os
   projetos compose e mostra o estado de cada um.
2. **Nível projeto** — ações que afetam todos os serviços do projeto: **▶ up**, **⏹ down**,
   **↻ restart** e **▤ logs**.
3. **Nível serviço** — expanda o projeto para ver os serviços individuais, cada um com **▶**, **⏹**,
   **↻** e **▤**.

A atualização do estado dos containers é leve (reaproveita a lista já descoberta); recolher e
expandir novamente força uma nova descoberta.

## Logs em tempo real

Clique em **▤** em qualquer servidor, projeto ou serviço para abrir o **modal de logs**:

- Exibe a saída em **tempo real** via SSH, com suporte a **cores ANSI**.
- Campo **tail** ajustável (padrão `100`, de `0` a `5000` linhas).
- Botão **Limpar** (limpa a visualização, não interrompe o stream) e **Fechar** (encerra o stream).

> Há um limite de **3 sessões de log simultâneas**; a mais antiga é encerrada ao abrir uma nova.

## Status e atualização

- Cada servidor/projeto/serviço mostra um **selo colorido** de status:
  - 🟢 em execução · 🔴 parado/erro · 🟡 pendente · ⚫ desconhecido
- O status é atualizado automaticamente no **intervalo configurado** (padrão 30 segundos;
  ajustável ou desligável em [Configurações](#configurações-grupos-e-preferências)).
- Ao entrar em um grupo, uma leitura inicial é feita mesmo com a atualização automática desligada.
- Use o botão **⟳ (Atualizar status)** para forçar a atualização imediata.

## Notificações e histórico

O resultado das operações aparece de duas formas:

- **Toasts** — notificações rápidas no canto da tela para sucesso (✔), aviso (⚠) e erro (✖).
  Somem sozinhas após alguns segundos (erros ficam mais tempo) e podem ser fechadas no ×.
- **Histórico** — o botão **Histórico** no rodapé abre um modal com **todos os eventos da sessão**,
  com horário, host e serviço. Um indicador no botão sinaliza eventos novos desde a última
  abertura (vermelho quando há erro). O botão **Limpar** esvazia a lista.

## Grupos críticos

Ao marcar um grupo como **crítico (⚠)**, toda ação de start/stop/restart passa a exigir que você
**digite `CONFIRMAR`** antes de executar. Isso evita paradas acidentais em ambientes de produção.
As confirmações digitadas em outras operações são: `EXCLUIR` (excluir grupo) e `REMOVER`
(remover servidor).

## Importar servidores de arquivo

Use **Importar .ini/.json** para criar um grupo a partir de um arquivo. Formatos aceitos:

- **`.ini`** — cada seção com um `host` vira um servidor.
- **`.json`** — um array de servidores, ou um objeto `{ "groups": [ { "servers": [...] } ] }`,
  ou um objeto no estilo `.ini`.

Após importar, o app informa quantos servidores foram importados e lista eventuais erros de validação.

## Solução de problemas

**"Falha: … All configured authentication methods failed"**
O servidor SSH recusou a autenticação. Verifique usuário/senha (o campo de senha sempre abre em
branco e precisa ser redigitado em cada máquina). Se o `ssh` manual funciona com senha mas o app
não, o servidor provavelmente usa **keyboard-interactive** (PAM) — esse cenário já é suportado pelo
app; atualize para a versão que inclui esse suporte.

**"Criptografia (safeStorage) indisponível nesta máquina/conta"**
A criptografia do sistema não está disponível para o usuário atual, então o cadastro de credenciais
é bloqueado. Isso é atrelado ao usuário e à máquina do Windows — **não copie** o arquivo de
credenciais (`vault.enc`) entre máquinas; recadastre os servidores na nova máquina.

**"Sem permissão para usar o docker"**
O usuário SSH não está no grupo `docker` no servidor de destino. Adicione o usuário ao grupo e
reconecte.

**"docker compose v2 não encontrado"**
O servidor não tem o `docker compose` (plugin v2). Instale/atualize o Docker no host.
