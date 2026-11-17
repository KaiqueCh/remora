# Segurança

O Remora manipula credenciais e executa comandos em servidores remotos, então a segurança é
parte central do design. Esta página resume os mecanismos implementados.

## Isolamento do renderer

- A janela usa `contextIsolation: true` e `sandbox: true`; o renderer **não** consegue `require`
  módulos nem acessar o sistema de arquivos/processos.
- Todo acesso ao backend passa pela ponte `preload.js` (`contextBridge`), que expõe apenas a API
  `window.api` — um conjunto fechado de canais IPC.

## Criptografia de credenciais

- As senhas são gravadas com o **`safeStorage`** do Electron, que no Windows usa a **DPAPI**.
- O arquivo criptografado fica em `userData/vault.enc`. As senhas **nunca** são gravadas em texto
  plano nem enviadas ao renderer — a UI recebe apenas o booleano `hasPassword`.
- **Implicação importante:** a criptografia é atrelada ao **usuário e à máquina** do Windows. Copiar
  o `vault.enc` para outra máquina/conta torna as senhas indecifráveis. Nesse caso, recadastre os
  servidores na nova máquina (não há como migrar o arquivo).
- Na mesma máquina e conta, a migração da pasta antiga (anterior ao nome Remora) copia o
  `vault.enc` junto com o `Local State`, que guarda a chave do `safeStorage` protegida pela DPAPI.
  Sem esse arquivo, o vault copiado não poderia ser decifrado.
- Se `safeStorage.isEncryptionAvailable()` for `false`, o cadastro de credenciais é **bloqueado**
  para não gravar segredos sem proteção.
- As **preferências do app** (ex.: intervalo de atualização, em `userData/settings.json`) ficam
  **fora** do vault, em JSON puro — por design, **nenhum segredo** é gravado nesse arquivo.

## Verificação de host key (TOFU / anti-MITM)

O app adota **Trust On First Use**:

1. Na **primeira** conexão a um `host:port`, a impressão digital SHA256 da chave do servidor é
   registrada no vault (`setHostKey`).
2. Nas conexões **seguintes**, a impressão é comparada com a armazenada. Se **mudar**, a conexão é
   rejeitada — sinal de possível ataque *man-in-the-middle* (ou de troca legítima do servidor, que
   exige limpar a chave registrada).

## Validação de entrada e montagem de comandos

Como os comandos são executados em shells remotos, toda entrada de usuário é validada por **regex
restritiva** e citada antes de compor comandos:

- `isValidHost` — hostnames/IPs (`^[A-Za-z0-9_.\-]+$`).
- `isValidComposeDir` — caminho **absoluto** POSIX, sem `..`, sem barras duplas.
- `isValidWindowsPath` — drive `C:\…`, sem `..` e sem metacaracteres (`$ ; & | < > % \` '`).
- `isValidServiceName` — nome do serviço Windows.
- No `docker.js`, `shellQuote` envolve valores em aspas simples e escapa aspas internas; nomes de
  serviço passam por `isValidServiceName` antes do uso.

## Allowlist de ações Docker

Antes de executar qualquer ação Docker (`docker:action`), o main verifica no **cache de descoberta**
(`discoveredByServer`) se o `composeFile` foi realmente descoberto e se o `service` pertence àquele
arquivo. Ações sobre arquivos/serviços não descobertos são recusadas — isso previne injeção de
caminhos arbitrários.

## Autenticação SSH

- Suporta autenticação por **senha** e por **`keyboard-interactive`** (comum em servidores com PAM).
  Sem o suporte a keyboard-interactive, servidores PAM falhariam com *"All configured authentication
  methods failed"* mesmo com a senha correta.
- Ainda **não** há suporte a autenticação por **chave privada**. Servidores configurados apenas com
  chave (`PasswordAuthentication no` e sem PAM) não conectam pela versão atual.

## Concorrência e resiliência

- **Uma conexão SSH persistente por identidade** (usuário@host:porta), com até **4 canais** simultâneos
  (abaixo do `MaxSessions` padrão do OpenSSH, 10). Evita autenticar a cada comando e o `ECONNRESET`
  que o sshd do Windows envia a cada conexão encerrada. A conexão fecha após 60 s ociosa e ao sair do app.
- O status dos serviços Windows é consultado **em lote** (um comando por conexão), e o polling não
  empilha ciclos: um ciclo novo é ignorado enquanto o anterior não termina.
- Erros transitórios (ECONNRESET/ETIMEDOUT/EPIPE/ECONNABORTED, queda da conexão) são reexecutados
  com backoff numa conexão nova.
- **Falha de autenticação não é refeita**: a identidade entra em *cooldown* de 5 min (ou até a senha
  ser editada), evitando bloqueio da conta no AD por tentativas repetidas do polling.
- A senha participa da identidade da conexão apenas como hash SHA-256 truncado, em memória; nunca
  aparece em logs.
- No máximo **3 sessões de log** simultâneas (LRU), evitando exaustão de recursos.

## Boas práticas operacionais

- Marque grupos de produção como **críticos** — assim toda operação exige `CONFIRMAR` digitado.
- Não versione arquivos de configuração com segredos: o `.gitignore` já ignora `*.ini`, `configs/*.ini`
  e o diretório `dist/`.
- Use um usuário SSH dedicado, com o mínimo de privilégios necessário (no grupo `docker` apenas
  quando o servidor for do tipo Docker).
