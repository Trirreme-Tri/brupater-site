# ADR 0001 — Migrar o site para Next.js + TypeScript

- **Status:** aceito (09/10/2026, Wellington)
- **Contexto:** o site nasceu em HTML, CSS e JavaScript puro, publicado no GitHub Pages. O visual foi aprovado pela cliente. As próximas etapas são banco de dados (Firebase, Leo) e monitoramento 24h (Bryan). Os sócios decidiram trocar a stack antes delas.

## Opções

| Opção | A favor | Contra |
| --- | --- | --- |
| Manter HTML puro | Zero trabalho agora | Cada página recarrega (a música para), sem tipos, difícil de crescer |
| Next.js com export estático | Hospeda em qualquer lugar de graça | Sem servidor: sem SSR com dados do banco, sem redirecionamentos |
| **Next.js completo (escolhida)** | Padrão da TRIRREME, troca de página sem recarregar, pronto pro banco e pra SSR | Hospedagem com servidor (Firebase App Hosting exige plano Blaze) |

## Decisão

Next.js 16 (App Router) + TypeScript, mantendo o visual igual. O código não usa nada que exija servidor (Server Actions, rotas de API, proxy), então funciona nos dois modos:

- `npm run build`: Next.js com servidor (Firebase App Hosting, Hostinger com Node.js no futuro).
- `npm run build:estatico`: arquivos prontos em `out/` (Firebase Hosting no plano grátis).

## Trade-offs aceitos

- O painel (`src/components/painel/motor.ts`) foi portado quase como estava (formulários montados em texto), porque já estava aprovado. Virar componentes React é uma melhoria futura.
- O carrossel do topo e a tela de carregamento mexem direto no DOM (animação quadro a quadro), dentro de componentes React.
- O conteúdo ainda vem do `localStorage` (até a etapa do banco).
- `<img>` comum em vez de `next/image`: as imagens vêm do conteúdo editável e a otimização exigiria servidor de imagens.

## Quando revisitar

- Quando o banco entrar: decidir se as páginas passam a ler o Firestore também no servidor (SEO).
- Se a hospedagem final (Hostinger) não rodar Node.js: usar o modo estático.
