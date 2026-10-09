# Site da Brunna Paternostro (@_.brupater)

Portfólio, agenda e calculadora de encomendas da artista Brunna Paternostro
(Illustrator & Graphic Design), com painel de edição.
Feito em **Next.js 16 + TypeScript**. Desenvolvido pela [TRIRREME](https://trirreme.com).

> A versão antiga (HTML puro, GitHub Pages) está no histórico do Git, no commit `b90c44a`.

## Rodar no computador

Precisa do Node.js 20.9 ou mais novo.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Site em modo de desenvolvimento |
| `npm run build` | Gera o site com servidor (Firebase App Hosting, Node.js) |
| `npm run build:estatico` | Gera arquivos prontos em `out/` (Firebase Hosting grátis) |
| `npm run start` | Roda o site gerado pelo `build` |
| `npm run lint` / `npm run typecheck` | Verificações de código |
| `npm run verificar` | Lint + tipos + build (rodar antes de cada push) |

## Páginas (endereços)

| Página | Endereço | Arquivo |
| --- | --- | --- |
| Início | `/` | `src/app/(site)/page.tsx` |
| Portfólio | `/portfolio` | `src/app/(site)/portfolio/page.tsx` |
| Agenda | `/agenda` | `src/app/(site)/agenda/page.tsx` |
| Encomendas | `/encomendas` | `src/app/(site)/encomendas/page.tsx` |
| Projeto | `/projeto?p=<id>` | `src/app/(site)/projeto/page.tsx` |
| Painel | `/admin` | `src/app/admin/page.tsx` |
| Apresentação | `/apresentacao` | `src/app/apresentacao/page.tsx` |
| Avisos | `/erro`, `/manutencao` e qualquer endereço inexistente (404) | `src/app/erro`, `src/app/manutencao`, `src/app/not-found.tsx`, `src/app/error.tsx` |

Os endereços antigos (`/portfolio.html` etc.) redirecionam para os novos no modo com servidor.

## Estrutura

```
src/
  app/                    rotas (App Router)
    layout.tsx            raiz: aplica cores/fontes do painel antes da página aparecer
    (site)/layout.tsx     páginas públicas: barra, rodapé, WhatsApp, lightbox, cortina e o player de música
  components/
    site/                 peças comuns (Nav, Rodape, Musica, Cortina, Cinema, Cabecalho...)
    paginas/              conteúdo de cada página pública
    painel/               painel da Bru (Painel.tsx + motor.ts)
    apresentacao/         página de apresentação
  lib/
    conteudo/tipos.ts     FORMATO do conteúdo (é o formato do banco de dados)
    conteudo/padrao.ts    PADRAO: todo o conteúdo editável (textos, preços, agenda, galeria, cores)
    loja.ts               ONDE o conteúdo fica salvo (hoje: localStorage) + migrações
    useSite.ts            entrega o conteúdo aos componentes (e redesenha quando o painel salva)
    tema.ts               cores, fontes e tema claro/escuro
    util.ts               img() (de onde vêm as imagens), links seguros, brl()
  styles/                 CSS do site (tokens, base, site, admin, apresentação)
public/assets/            imagens (.webp); portfólio em public/assets/obras/
docs/adr/                 decisões de arquitetura
```

## Regras

- **Todo conteúdo que a Bru pode mudar mora em `PADRAO`** (`src/lib/conteudo/padrao.ts`), nunca solto nos componentes.
- **Banco de dados:** só `src/lib/loja.ts` (e `useSite.ts`) precisam mudar. O formato é o tipo `Site`.
- **Imagens:** sempre passar pelo `img()` (`src/lib/util.ts`). Ele decide de onde a imagem vem
  (`NEXT_PUBLIC_IMAGENS_URL`). Quando as imagens forem para o Firebase, as URLs mudam num lugar só.
- **Links entre páginas:** usar `LinkSite` (troca de página sem recarregar, e a música continua).
- **Nunca** escrever "protótipo" no site. Rodapé sempre com "Site desenvolvido pela TRIRREME".
- Nada de senhas, tokens ou chaves privadas no código. Variáveis públicas em `.env.local` (ver `.env.example`).
- Commits em inglês, no padrão Conventional Commits.

## Publicar

### Firebase Hosting (grátis, plano Spark) — modo estático

```bash
npm run build:estatico
firebase deploy --only hosting      # usa o firebase.json (pasta out/)
```

### Firebase App Hosting (com servidor) — exige plano Blaze

Conectar o repositório pelo console do Firebase (App Hosting). Cada push na branch escolhida publica sozinho.

## Limitações conhecidas (fase atual)

- O que a Bru salva no painel fica **no navegador dela** (localStorage). Vale pra todos quando o banco (Firebase) entrar.
- O login do painel é verificado no próprio navegador (usuário e senha em `src/lib/acessoPainel.ts`). Será trocado pelo Firebase Authentication.
- O painel (`motor.ts`) monta os formulários em texto, como no site antigo. Virar componentes React é melhoria futura (ver `docs/adr/0001-stack-nextjs.md`).
