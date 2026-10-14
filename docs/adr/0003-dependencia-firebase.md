# ADR 0003 — Dependências do Firebase

- **Status:** Proposto (aguarda aprovação do Wellington)
- **Data:** 2026-10-09
- **Responsável:** Leo Eliel

## Contexto

O ADR 0002 leva o conteúdo para o Firestore. O padrão de engenharia pede ADR para dependência nova relevante.

## Decisão

| Pacote | Tipo | Para quê |
|---|---|---|
| `firebase` | dependência | SDK do navegador: Firestore (todas as páginas) e Auth (só o painel) |
| `firebase-tools` | desenvolvimento | CLI: emuladores, deploy de regras e hosting |
| `@firebase/rules-unit-testing` | desenvolvimento | Testes das regras no emulador |
| `cross-env` | desenvolvimento | Variável de ambiente nos scripts em Windows, macOS e Linux |

Regras de uso:

- Importar sempre dos subpacotes (`firebase/app`, `firebase/firestore`, `firebase/auth`), nunca do pacote compat.
- `firebase/auth` é importado só por `src/lib/firebase/auth.ts`, usado só pelo painel, para não pesar nas páginas públicas.
- Todo acesso ao Firebase passa por `src/lib/firebase/`. Nenhum componente importa `firebase/*` diretamente.
- O emulador usa o projeto `demo-brupater`, que não existe na nuvem: testes locais não tocam dados reais.

## Consequências

- O bundle das páginas públicas cresce com o Firestore. Registrar abaixo o tamanho antes e depois (saída do `next build`).
- O emulador do Firestore exige Java instalado na máquina de quem roda os testes de regra.

O Next.js 16 não imprime mais o "First Load JS" por rota. Medido em build de produção, com o JS transferido (gzip) pelo navegador (Chromium, cache vazio), em 2026-10-14:

| Rota | JS antes (commit `ff21ca5`) | JS depois | Diferença |
|---|---|---|---|
| `/` | 198 KB | 328 KB | +130 KB |
| `/portfolio` | 198 KB | 328 KB | +130 KB |
| `/admin` | 185 KB | 340 KB | +155 KB |

O custo é o SDK do Firestore em todas as páginas (e o Auth só no painel). A página inteira (imagens incluídas) tem 2,8 a 3,5 MB, então o acréscimo fica em torno de 4%. Soma de todos os chunks sem compressão: 885 KB antes, 1,37 MB depois.

## Alternativa considerada

`firebase/firestore/lite` é bem menor, mas não tem `onSnapshot`. Sem ele, o painel não vê atualizações ao vivo e o cache precisaria de lógica própria. Revisitar se o peso medido incomodar.
