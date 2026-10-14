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

O Next.js 16 não imprime mais o "First Load JS" por rota. A medida abaixo é a soma de todos os chunks JS de `.next/static/chunks` (sem compressão), que inclui Firestore (páginas públicas) e Auth (painel).

| Medida | Antes | Depois |
|---|---|---|
| JS total em `.next/static/chunks` | 885.044 bytes | 1.365.008 bytes (+480 KB) |
| First Load JS por rota (`/`, `/admin`) | não medido | não medido (conferir no DevTools, aba Rede, com gzip) |

## Alternativa considerada

`firebase/firestore/lite` é bem menor, mas não tem `onSnapshot`. Sem ele, o painel não vê atualizações ao vivo e o cache precisaria de lógica própria. Revisitar se o peso medido incomodar.
