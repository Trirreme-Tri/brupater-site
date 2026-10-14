# O que só você (ou o Wellington) pode fazer

Marque conforme for fazendo. Os itens com 🔒 pedem autorização explícita do Wellington antes (R2/R3).

## Agora (sem autorização)

- [ ] **Instalar Node.js 20.9+ e Java (JDK 21).** O emulador do Firestore roda em Java. Se o Firebase CLI reclamar da versão, a mensagem diz qual ele quer.
- [ ] **Copiar o pacote para o repositório e rodar o Claude Code** (LEIA-ME, passos 1 a 3).
- [ ] **Mandar ao Wellington** (pode copiar o texto abaixo):

> Wellington, preparei o banco do site da Bru no Firebase: ADRs 0002 e 0003, spec e regras com testes no emulador. Preciso de 4 respostas tuas para seguir:
> 1. Aprova a opção A (um documento só) e os ADRs?
> 2. Aprova a spec "conteúdo no Firestore" para eu codar?
> 3. Posso criar os projetos Firebase dev, staging e prod da Bru na conta da TRIRREME (R2)? Região sugerida: southamerica-east1 (São Paulo).
> 4. A Bru chegou a editar algo no painel do site antigo (github.io)?

## Com autorização 🔒 (R2): criar os projetos

Faça três vezes (dev, staging, prod). IDs sugeridos: `brupater-dev`, `brupater-staging`, `brupater-prod`. Se o ID estiver ocupado, o console sugere um sufixo; anote o que ficou.

- [ ] Criar o projeto no [console do Firebase](https://console.firebase.google.com) **no plano Spark (grátis)**. Google Analytics: pode desligar.
- [ ] **Firestore Database → Criar banco** em modo de produção. Região: a combinada com o Wellington. **A região não pode ser trocada depois.**
- [ ] **Authentication → Começar → E-mail/senha** ativado.
- [ ] **Configurações do projeto → Seus apps → Web (`</>`)**: registrar o app (sem Firebase Hosting nesta tela). Copiar o `firebaseConfig` para `src/lib/firebase/projetos.ts`, no ambiente certo. Isso pode ir para o git.
- [ ] No terminal, na raiz do repo: `npx firebase login` e depois `npx firebase use --add` três vezes, dando os apelidos `dev`, `staging` e `prod`. Isso cria o `.firebaserc` (pode ir para o git).

## Contas da Bru e do Wellington (em cada projeto)

- [ ] **Authentication → Usuários → Adicionar usuário** com o e-mail da Bru e uma senha aleatória longa que ninguém precisa saber.
- [ ] Na tela de login do painel, clicar em "Esqueci a senha" com o e-mail da Bru: ela recebe o e-mail e define a própria senha. A senha dela nunca passa por você.
- [ ] Repetir para o Wellington.
- [ ] Copiar o **UID** de cada um (coluna da lista de usuários).
- [ ] **Firestore → Iniciar coleção** `admins` → ID do documento = UID da Bru → campo `nome` (string) = `Bru`. Repetir com o UID do Wellington.

## Staging

- [ ] `npm run deploy:staging` (publica o site estático e as regras no projeto `staging`).
- [ ] Conferir os critérios da spec em staging, logando como Bru e como Wellington.
- [ ] **Testar restauração:** salvar duas vezes, restaurar a versão anterior pelo painel, conferir que voltou.
- [ ] Passar o endereço de staging para o Wellington e o Bryan.

## Produção 🔒 (R3)

- [ ] Autorização do Wellington por escrito (mensagem serve).
- [ ] `npm run build:estatico`
- [ ] `npx firebase deploy --project prod --only firestore` (regras) e depois `npx firebase deploy --project prod --only hosting`.
- [ ] Primeiro conteúdo: a Bru (ou o Wellington) entra no painel e salva uma vez. Se ela tinha edições no site antigo, veja abaixo antes.
- [ ] Combinar com o Bryan o que monitorar: leituras e gravações por dia (Firestore → Uso), erros de regra negados, e um alerta de uso perto da cota grátis.

## Se a Bru editou no site antigo

- [ ] Republicar por alguns minutos a versão antiga (commit `b90c44a`) no mesmo endereço github.io em que ela editou. O `localStorage` é por endereço: tem que ser o mesmo.
- [ ] Ela abre o painel antigo **no mesmo navegador e computador** e clica em "Baixar cópia (.json)".
- [ ] Você importa esse .json no painel novo (staging primeiro) e salva.
- [ ] Desligar de novo o GitHub Pages (Settings → Pages).

## Depois

- [ ] Abrir o PR da branch `feat/firestore-content` com o resultado da verificação.
- [ ] Mudar o status dos ADRs 0002/0003 e da spec para "Aceito" quando o Wellington aprovar.
