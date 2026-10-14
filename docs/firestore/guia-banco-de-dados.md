# Site Bru Pater — Guia do Banco de Dados (Leo)

> Guia original de 09/10/2026, recebido pelo Leo. Guardado aqui como contexto da migração para o Firestore. Os ADRs 0002/0003 e a spec `docs/specs/conteudo-no-firestore.md` partem dele.

## Para quem é este guia

Leo Eliel é o responsável pelo banco de dados do site da Brunna Paternostro (@_.brupater). Hoje o site guarda tudo no navegador de quem edita. A tarefa do Leo é levar esses dados para o Firebase, para que o que a Bru salva no painel valha para todos os visitantes.

O visual do site foi aprovado em outubro de 2026. Daqui em diante, mudança de dados não deve mudar a aparência.

Este guia junta o contexto do projeto, o que já foi feito, as regras combinadas e uma proposta de como guardar cada informação. Onde algo ainda não foi decidido, está escrito como pergunta aberta.

**Atualização de 09/10/2026:** a stack já foi migrada. O site agora é Next.js 16 + TypeScript, no repositório Trirreme-Tri/brupater-site (commit 521e7fe). O visual continua igual ao aprovado. O banco entra nessa stack nova, e os arquivos citados neste guia já são os novos (src/...).

## Contexto do projeto

- **Cliente:** Brunna Paternostro (Bru), @_.brupater no Instagram, ilustradora e designer gráfica ("Illustrator & Graphic Design").
- **O que é:** site institucional com visual cinematográfico. Ele junta os links dela, mostra o portfólio, a agenda de encomendas e uma calculadora de preços. Tem também um painel para a Bru editar tudo sozinha.
- **Equipe TRIRREME:** Wellington (desenvolvimento e contato com a cliente), Leo Eliel (banco de dados) e Bryan Serafim (monitoramento 24h).
- **Repositório:** github.com/Trirreme-Tri/brupater-site (nome novo; a versão antiga em HTML puro está no histórico, commit b90c44a).
- **Stack:** Next.js 16 (App Router) + TypeScript + React 19. O conteúdo ainda fica no localStorage do navegador.
- **Hospedagem:** agora no Firebase; depois na Hostinger, com domínio próprio. O GitHub Pages não serve mais o site.
- **Dois jeitos de gerar o site, mesmo código:** `npm run build` (com servidor: Firebase App Hosting, exige plano Blaze) e `npm run build:estatico` (arquivos prontos em `out/`: Firebase Hosting no plano grátis). A escolha é dos sócios.
- **Endereços:** todos mudaram (ex.: `/portfolio` no lugar de `portfolio.html`) e o domínio vai mudar quando o site for publicado no Firebase.
- **Contrato:** a Bru vai aderir à mensalidade de manutenção. A proposta é R$ 125 por mês, ainda em fechamento.

| Página | Endereço | Arquivo |
|---|---|---|
| Início | `/` | `src/app/(site)/page.tsx` |
| Portfólio | `/portfolio` | `src/app/(site)/portfolio/page.tsx` |
| Projeto | `/projeto?p=<id>` | `src/app/(site)/projeto/page.tsx` |
| Agenda | `/agenda` | `src/app/(site)/agenda/page.tsx` |
| Encomendas | `/encomendas` | `src/app/(site)/encomendas/page.tsx` |
| Painel (só Bru e Wellington) | `/admin` | `src/app/admin/page.tsx` |
| Apresentação para a cliente | `/apresentacao` | `src/app/apresentacao/page.tsx` |
| Avisos | `/erro`, `/manutencao` e qualquer endereço inexistente (404) | `src/app/erro`, `src/app/manutencao`, `src/app/not-found.tsx`, `src/app/error.tsx` |

## O que já foi feito

O site foi construído e publicado entre 7 e 8 de outubro de 2026 em HTML puro e migrado para Next.js em 9 de outubro. O visual está aprovado e foi conferido tela a tela contra a versão antiga. Falta a parte de dados reais (banco, login de verdade, imagens) e a operação (monitoramento).

| Data | Entrega | Por que importa para o banco |
|---|---|---|
| 09/10 | Migração para Next.js 16 + TypeScript (repo brupater-site) | Formato do conteúdo virou um tipo (`Site`); uma única camada de dados (`src/lib/loja.ts`); imagens passam por `img()` |
| 08/10 | Mini player de música que continua tocando entre as páginas | Campo `perfil.trilha` (link, rótulo, volume) |
| 08/10 | Remoção de toda menção a "cenas" | Feita por migração de dados (`2026-10-sem-cenas`) |
| 08/10 | Topo das páginas internas com degradê cinematográfico | Imagem e foco de cada topo são dados editáveis |
| 08/10 | Topo em tela cheia, arte opcional para celular e guia de tamanhos | Campos `imgCelular` e `foco` em cada arte |
| 08/10 | Tela de carregamento, páginas de aviso e painel mais prático | Textos das páginas de aviso ficam em `paginasAviso` |
| 08/10 | Modos claro e escuro com botão para o visitante | Cores separadas por modo em `aparencia.modos` |
| 08/10 | Projetos em coleções, pedido pelo WhatsApp, carrossel infinito | Listas `projetos` e `precos.identidade.pacotes` |
| 07/10 | Site dividido em páginas, agenda mensal de vagas | Lista `agenda.sessoes` |
| 07/10 | Primeira versão: portfólio, encomendas, agenda e painel | Nasce o `PADRAO` |

O histórico completo está no `git log` do repositório.

## Regras já definidas

Estas regras valem para qualquer mudança, inclusive a do banco. O processo técnico completo está no `padrao-engenharia-ia.md`, no projeto TRIRREME.

### Regras da cliente

- Nunca escrever "protótipo" em lugar nenhum do site.
- Rodapé sempre com "Site desenvolvido pela TRIRREME", com link para trirreme.com.
- Nada de "cenas" no site: o termo foi removido a pedido.
- O painel é só da Bru e do Wellington.
- O pedido principal vai para o WhatsApp dela (5511964881678). "Copiar resumo" é para o Instagram.
- O visual está aprovado: trocar onde o dado mora não pode mudar a aparência.

### Regras de segurança

- Nunca pedir, receber ou commitar senhas, tokens ou chaves de conta de serviço (o `.json` com chave privada).
- O `firebaseConfig` do app web pode ir no código. Ele identifica o projeto e não dá acesso sozinho; quem protege os dados são as regras de segurança.
- Nada de dados pessoais sensíveis da artista no site (ex.: selfie, documentos).
- Todo texto editável passa por `esc()` antes de ir para a tela. Todo link passa por `urlSegura()`.

### Regras de código e Git

- Commits em inglês, no padrão Conventional Commits (`feat:`, `fix:`, `docs:`...).
- Todo conteúdo que a Bru pode mudar mora no `PADRAO` (`src/lib/conteudo/padrao.ts`), nunca solto nos componentes.
- Antes de cada push: `npm run verificar` (lint, tipos e build).
- Imagens sempre pela função `img()` (`src/lib/util.ts`); links entre páginas sempre pelo componente `LinkSite`.
- Mudança de formato em dado já salvo é feita por migração com id único (lista `MIGRACOES` em `src/lib/loja.ts`). Nunca se apaga o dado salvo.
- Ferramenta ou dependência nova relevante (ex.: o pacote `firebase`) entra com um ADR em `docs/adr/`. Já existe o `0001-stack-nextjs.md`.

### Níveis de risco do padrão de engenharia

- Criar o projeto Firebase, publicar regras de segurança e mexer em dados de produção são R2 ou R3.
- Esses passos pedem autorização explícita do Wellington antes de executar.
- Regras chegam à produção só depois de testadas no emulador e validadas em staging.

## Como os dados são guardados hoje

Hoje todo o conteúdo é um único objeto JSON, no formato do tipo `Site`. O padrão vem do código e as edições da Bru ficam só no navegador dela. Por isso, o que ela salva ainda não aparece para os visitantes.

- `src/lib/conteudo/tipos.ts` define o formato (tipo `Site`). É o formato que o documento do banco deve ter.
- `src/lib/conteudo/padrao.ts` define o `PADRAO`: textos, preços, agenda, galeria, projetos, cores e fontes.
- `src/lib/loja.ts` carrega o objeto salvo (localStorage, chave `brupater:site:v2`), mescla por cima do `PADRAO` com `mesclar()` e roda as `MIGRACOES` que faltam (os ids das que já rodaram ficam em `site.migracoes`).
- `src/lib/useSite.ts` entrega o conteúdo aos componentes com `useSyncExternalStore`: no servidor e na primeira montagem vale o `PADRAO`; no navegador, o salvo. Quando algo muda (evento `storage`), todas as partes do site se redesenham sozinhas.
- O painel (`src/components/painel/motor.ts`) edita uma cópia e grava com `lojaSalvar()`. A prévia ao vivo usa `lojaPrevia()` e o endereço com `?previa=1`.

**Pontos que o Leo vai trocar.** Só `loja.ts` e `useSite.ts` conversam com o armazenamento. O resto do site não muda.

| Função | O que faz hoje | O que passa a fazer |
|---|---|---|
| `lojaCarregar()` | Lê o localStorage e mescla com o `PADRAO` | Lê o documento do Firestore (ou a última cópia em cache) e mescla com o `PADRAO` |
| `lojaSalvar(site)` | Grava o objeto inteiro no localStorage | Grava no Firestore, só com a Bru logada (antes, cópia em `historico`) |
| `lojaRestaurarPadrao()` | Apaga o salvo local | Volta ao padrão (com backup antes) |
| `lojaPrevia(site)` | Grava o rascunho em `brupater:previa` | Continua local: a prévia é só de quem edita |
| `assinar()` / `snapshot()` em `useSite.ts` | Escutam o evento `storage` | Escutam o `onSnapshot` do Firestore e avisam os componentes |

Outras chaves no navegador (são do visitante e continuam locais, sem banco):

- `brupater:modo`: escolha claro ou escuro do visitante.
- `brupater:intro` (sessionStorage): se o visitante já viu a abertura completa.
- `brupater:painel-previa`: se a prévia do painel fica aberta.
- `brupater:painel` (sessionStorage): sessão do login simples de agora, que será trocada pelo Firebase Authentication.

### Limitações atuais

- O usuário e a senha do painel estão no código (`src/lib/acessoPainel.ts`), visíveis para quem procurar. Serve só para esta fase.
- Imagem enviada pelo painel vira texto (`data:image/webp;base64`), reduzida no navegador. O localStorage tem limite de espaço, então poucas imagens já lotam.
- As 64 imagens do portfólio estão no repositório, em `public/assets/obras/`.
- Os pedidos não são salvos: o site só monta a mensagem e abre o WhatsApp. Hoje o site não guarda dados pessoais de visitantes.
- O que a Bru editou no site antigo ficou no navegador dela, no endereço antigo (github.io). Isso não passa sozinho pro site novo (ver Decisões em aberto).

## Como guardar cada informação no Firebase

**Recomendação:** começar com um documento no Firestore com o conteúdo inteiro, igual ao objeto de hoje. É uma proposta para o Leo validar e registrar num ADR, não uma decisão fechada.

O conteúdo atual tem cerca de 18,6 KB em JSON. O limite de um documento do Firestore é 1 MiB, então há folga grande, desde que imagens não entrem no documento.

O formato oficial de cada campo é o tipo `Site` em `src/lib/conteudo/tipos.ts`, com as regras escritas no topo do arquivo. Se o banco mudar o formato, o tipo muda junto (e ganha uma migração).

| Opção | Como fica | A favor | Contra |
|---|---|---|---|
| A. Um documento (recomendada) | `conteudo/site` com o objeto inteiro | Igual ao modelo de hoje, só a camada de dados muda, 1 leitura por visita | Cada salvamento regrava tudo; se duas pessoas salvarem juntas, vale a última |
| B. Um documento por seção | `conteudo/perfil`, `conteudo/agenda`, `conteudo/precos`... | Salva só o que mudou | Cerca de 12 leituras por visita e mais código |
| C. Coleções para listas | `galeria/{id}`, `projetos/{id}` | Bom se a galeria crescer para centenas de artes | Muda o formato que o site inteiro usa; maior risco agora |

Gatilhos para revisitar a opção A: documento passar de 500 KB, mais de duas pessoas editando, ou necessidade de histórico por item.

### Estrutura proposta (opção A)

| Caminho | Conteúdo | Quem lê | Quem grava |
|---|---|---|---|
| `conteudo/site` | O objeto `SITE` inteiro, no mesmo formato do `PADRAO` | Qualquer visitante | Só Bru e Wellington logados |
| `conteudo/site.atualizadoEm` | Data e hora do servidor no último salvamento | Qualquer visitante | Gravado junto |
| `conteudo/site.atualizadoPor` | UID de quem salvou | Qualquer visitante (o Firestore não esconde só um campo; por isso, só o UID, nunca e-mail) | Gravado junto |
| `historico/{data-hora}` | Cópia do documento antes de cada salvamento | Só admins | Só admins |
| `admins/{uid}` | Lista de quem pode editar (Bru e Wellington) | Ninguém pelo site | Só pelo console |

### Regras para cada tipo de informação

| Informação | Onde no objeto | Como guardar |
|---|---|---|
| Textos (frases, títulos, perguntas) | `perfil`, `sobre`, `faq`, `paginasAviso`... | Texto puro, nunca HTML. O site escapa na hora de mostrar |
| Preços | `precos.*.preco`, `precos.identidade.pacotes` | Número em reais (ex.: 120), nunca texto. 0 = "sob consulta" |
| Percentuais | `comercialPct`, `personagemExtraPct`, `descontosVolume` | Número inteiro (ex.: 50 = 50%) |
| Datas da agenda | `agenda.sessoes[].abre`, `agenda.eventos[].data` | Texto ISO AAAA-MM-DD (ex.: 2026-11-01) |
| Vagas | `agenda.sessoes[].vagas` e `ocupadas` | Números inteiros. ESGOTADO é calculado, nunca gravado |
| Cores | `aparencia.cores`, `aparencia.modos` | Texto `#RRGGBB`. Outros formatos são recusados |
| Imagens | `img`, `mini`, `capa`, `imgCelular`, `avatar` | Só o endereço (caminho ou URL), nunca a imagem em base64 |
| Medidas de imagem | `galeria[].w` e `h` | Números em pixels, para a página não "pular" ao carregar |
| Foco da imagem | `foco` | Texto "X% Y%" (ex.: "50% 30%") |
| Links | `links[].url`, `perfil.trilha.url` | URL `https://` completa para fora do site; caminho como `/encomendas` para dentro. O site só aceita links seguros |
| WhatsApp | `perfil.whatsapp` | Só dígitos, com país e DDD (ex.: 5511964881678) |
| Liga/desliga | `visivel`, `destaque`, `mostrar`, `pausa`... | Booleano `true` ou `false` |
| Ids | `projetos[].id`, `precos.*.id` | Minúsculas, sem acento e com hífen (ex.: `caderno-de-campanha`). Vira parte do link, então não muda depois de publicado |
| Versão e migrações | `versao`, `migracoes` | Mantidos. Toda mudança de formato ganha uma migração nova com id único |

### Fica fora do banco

- Pedidos de clientes: continuam indo direto para o WhatsApp, sem ficar salvos.
- Escolhas do visitante (claro ou escuro, abertura já vista): continuam no navegador dele.
- Rascunho da prévia do painel: continua no navegador de quem edita.

## Segurança e acesso

Qualquer pessoa lê o conteúdo. Só a Bru e o Wellington gravam, depois de entrar com o Firebase Authentication. Quem garante isso são as regras de segurança do Firestore, não o código do site.

```
Visitante → Site público ──lê (todos)──────────────────▶ Firestore: conteudo/site
Bru ou Wellington → Painel (login Firebase Auth) ──grava (só quem está em admins)──▶ conteudo/site
                                                   └─ cópia ─▶ historico
admins: UIDs de quem pode gravar
```

O visitante só lê. O painel grava depois do login, e as regras conferem se o UID está em `admins`.

### Login

- O login do painel passa a ser pelo Firebase Authentication (e-mail e senha), no lugar do usuário e senha que hoje estão no código.
- Cada uma das duas contas é criada no console. A própria Bru define a senha dela, que nunca passa por chat ou documento.
- Os UIDs das duas contas vão para a coleção `admins`, criada pelo console. UID não é segredo e pode ser compartilhado.
- A recuperação de senha usa o e-mail de redefinição do próprio Firebase.

### Rascunho das regras do guia

Ponto de partida, a testar no emulador antes de qualquer publicação. A versão em uso está em `firestore.rules` (acrescenta a conferência do carimbo `atualizadoPor`/`atualizadoEm` e proíbe apagar `conteudo/site`).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function ehAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    match /conteudo/site {
      allow read: if true;
      allow write: if ehAdmin();
    }
    match /historico/{id} {
      allow read, create: if ehAdmin();
      allow update, delete: if false;
    }
    match /admins/{uid} {
      allow read, write: if false;
    }
  }
}
```

### Testes mínimos das regras (no emulador, antes de staging)

1. Visitante sem login lê `conteudo/site`.
2. Visitante sem login não grava `conteudo/site`.
3. Usuário logado, mas fora de `admins`, não grava.
4. Admin grava `conteudo/site` e cria `historico`.
5. Ninguém altera nem apaga `historico` pelo site.
6. Ninguém lê nem altera `admins` pelo site.

### Cuidados

- Falhar fechado: se a regra não tem certeza, nega.
- Validação de formato (preço número, cor `#RRGGBB`) pode entrar nas regras depois. No início, o painel valida e o site escapa tudo ao mostrar.
- Publicar regras em produção é R3: pede autorização do Wellington.

## Imagens e arquivos

As imagens estão em `public/assets/` e o conteúdo guarda só o caminho delas (ex.: `assets/obras/catedral.webp`). Todas passam pela função `img()` (`src/lib/util.ts`), o único lugar que decide de onde a imagem vem. A Bru combinou que, no começo, não vai subir imagens pelo painel; opções pagas de upload entram só quando ela pagar por elas.

### Quando as URLs mudarem (Firebase)

- Imagens publicadas junto com o site (Firebase Hosting ou App Hosting): nada muda. Os caminhos acompanham sozinhos o endereço novo do site.
- Imagens movidas para outro lugar (ex.: Cloud Storage): basta definir `NEXT_PUBLIC_IMAGENS_URL` com a URL base, sem mudar o conteúdo (ver `.env.example`). `img("assets/obras/x.webp")` vira `<base>/assets/obras/x.webp`.
- Exceção: 3 regras de fundo no CSS usam `/assets/...` direto (login do painel e capa da apresentação, em `src/styles/admin.css` e `apresentacao.css`). Se as imagens saírem do site, ajustar esses 3.
- URLs completas (`https://...`) e imagens enviadas (`data:`) passam sem mudança.

### Por que não usar o Cloud Storage do Firebase agora

- Pela documentação do Firebase, o bucket padrão do Cloud Storage exige o plano pago Blaze (FAQ de set/2024).
- No Blaze, buckets novos usam a faixa "Always Free" do Google Cloud Storage, que só cobre algumas regiões dos EUA.
- Isso exige cartão cadastrado e alerta de orçamento, e ainda não foi aprovado.

### Regras para imagens, valendo para qualquer opção futura

- O banco guarda o endereço, nunca o arquivo em base64.
- Formato `.webp`. Guardar largura e altura (`w`, `h`) junto do endereço.
- Nome do arquivo em minúsculas, sem acento, com hífen (ex.: `caderno-alvar.webp`).
- Nunca usar fotos pessoais da Bru (ex.: selfie). Avatar e retrato são ilustrações.

Opções quando o upload pelo painel for aprovado (a decidir num ADR):

| Opção | Custo | Observação |
|---|---|---|
| Cloud Storage for Firebase | Exige plano Blaze | Mesmo projeto e mesmo login do Firestore |
| Supabase Storage | A conferir | Usado no site da Anne; o Wellington aceitou como alternativa |
| Continuar no repositório | Zero | Sem upload pelo painel; a TRIRREME troca as imagens |

## Plano de migração, ambientes e backup

A migração troca só o lugar onde o dado mora; o formato continua o tipo `Site`. Cada passo termina com algo verificável, como pede o padrão de engenharia.

1. **ADR do banco.** Registrar a escolha (opção A, B ou C) em `docs/adr/0002-banco.md`, com motivos e gatilhos para revisitar. O Wellington aprova.
2. **Spec da feature.** Escrever "conteúdo no Firestore" em `docs/specs/`, com critérios de aceite binários. O Wellington aprova antes de codar.
3. **Projetos Firebase.** O padrão pede dev, staging e prod, na conta da TRIRREME. É R2: só com autorização.
4. **Regras + testes no emulador.** Os 6 testes da seção de segurança precisam passar.
5. **Trocar `loja.ts` e `useSite.ts`.** Instalar o pacote `firebase` (SDK do navegador) e seguir o ponto de atenção abaixo.
6. **Levar os dados atuais da Bru**, se ela tiver editado algo no site antigo (ver Decisões em aberto). O arquivo de backup `.json` do painel vira o primeiro `conteudo/site`.
7. **Staging, depois produção.** Conferir cada página, o painel e a prévia ao vivo. Produção só com autorização.

**Ponto de atenção: leitura assíncrona.** O localStorage responde na hora; o Firestore responde depois. A estrutura nova já foi pensada pra isso:

- `useSite.ts` usa `useSyncExternalStore`: `assinar()` passa a abrir o `onSnapshot` do documento e `snapshot()` devolve a última cópia recebida.
- Enquanto o Firestore não responde, vale a última cópia guardada no navegador (ou o `PADRAO`). A tela de carregamento cobre essa espera na primeira visita.
- A leitura tem de acontecer no navegador (componente cliente). No modo estático não há servidor; no modo com servidor, ler também no servidor (bom pra SEO) é uma melhoria posterior.
- Timeout na chamada: se o Firestore falhar, o site segue com a cópia ou o padrão, sem quebrar.

**Uso esperado e cota grátis.** Na opção A, cada visita faz 1 leitura (a troca de página não recarrega). A cota grátis do Firestore é de 50.000 leituras e 20.000 gravações por dia, mais 1 GiB guardado. O Bryan acompanha esse uso no monitoramento.

### Backup

- Cada salvamento guarda antes a versão anterior em `historico`, o que permite desfazer.
- O botão "Baixar cópia (.json)" do painel continua existindo.
- Backup só vale com restauração testada. Testar restaurar um `historico` em staging antes de ir para produção.
- Exportação agendada do Firestore: conferir se exige o plano Blaze antes de prometer (não verificado).

## Decisões em aberto e próximos passos

Perguntas abertas (cada uma vira decisão do Wellington ou um ADR):

- Opção A (um documento) confirmada, ou B ou C?
- Um projeto Firebase por cliente, ou um projeto da TRIRREME para vários sites? Recomendação: um por cliente. Isola os dados e facilita entregar tudo se o contrato acabar.
- Nomes dos projetos Firebase (dev, staging e prod) e região do Firestore.
- Hospedagem agora: Firebase Hosting no plano grátis (`npm run build:estatico` + `firebase deploy`, já configurado no `firebase.json`) ou App Hosting com servidor (plano Blaze, custos). Recomendação: Hosting grátis agora; o site atual não precisa de servidor.
- Quando o upload de imagens pelo painel entra, e com qual serviço.
- Edições antigas da Bru: ela editou algo no painel do site antigo? Se sim, dá pra republicar a versão antiga por um momento só para ela baixar o backup `.json`. Se não, vale o conteúdo padrão.

### Próximos passos do Leo

1. Clonar brupater-site, rodar `npm install` e `npm run dev` (Node.js 20.9 ou mais novo).
2. Ler `src/lib/conteudo/tipos.ts`, `padrao.ts`, `src/lib/loja.ts` e `src/lib/useSite.ts`.
3. Com autorização do Wellington, criar o projeto Firebase e publicar a primeira versão. Passar o endereço novo para o Wellington e o Bryan.
4. Escrever o ADR do banco e a spec "conteúdo no Firestore".
5. Montar as regras e os 6 testes no emulador.
6. Combinar com o Bryan quais números do Firebase ele vai acompanhar (leituras por dia, erros, orçamento).

## Observações

- A apresentação (`/apresentacao`) mostra os links usando o endereço onde o site estiver aberto: depois de publicar no Firebase (e na Hostinger), ela já aponta certo, sem mudar código.
- O GitHub Pages do repositório ainda está ligado e agora mostra só o README. Pode ser desligado em Settings → Pages.
