# Pacote: conteúdo do site Bru Pater no Firestore

Feito a partir do "Guia do Banco de Dados (Leo)" de 09/10/2026. Nada aqui toca a nuvem: tudo roda no emulador local até haver autorização.

## O que tem aqui

| Arquivo | Para quê |
|---|---|
| `docs/firestore/guia-banco-de-dados.md` | O guia original, como contexto para o time e o Claude Code |
| `docs/adr/0002-banco-firestore.md` | Decisão do banco (opção A) para o Wellington aprovar |
| `docs/adr/0003-dependencia-firebase.md` | ADR das dependências novas |
| `docs/specs/conteudo-no-firestore.md` | Spec com 18 critérios de aceite sim/não |
| `firestore.rules`, `firestore.indexes.json` | Regras (com carimbo conferido) e índices |
| `tests/regras/regras.test.mjs` | 6 testes do guia + 5 extras, no emulador |
| `src/lib/firebase/*` | Camada pronta: leitura com cache, gravação em transação com histórico e conflito, login, validação, mensagens de erro, anti-piscada |
| `scripts/instalar-firebase.mjs` | Configura `firebase.json`, scripts do `package.json` e `.gitignore` (só acrescenta) |
| `scripts/semear-emulador.mjs` | Cria contas de teste admin no emulador |
| `INTEGRAR-CLAUDE-CODE.md` | Prompt para o Claude Code ligar tudo em `loja.ts`, `useSite.ts` e no painel |
| `MANUAL.md` | O que só você ou o Wellington podem fazer (console, autorizações, contas) |

## Ordem

1. Na raiz do `brupater-site`, crie a branch: `git switch -c feat/firestore-content`.
2. Copie o conteúdo deste pacote para a raiz do repositório, **menos** `LEIA-ME.md`, `MANUAL.md` e `INTEGRAR-CLAUDE-CODE.md` (esses são para você).
3. Abra o Claude Code no repositório e cole o prompt de `INTEGRAR-CLAUDE-CODE.md`.
4. Siga o `MANUAL.md`.

## Avisos honestos

- Este código foi escrito sem acesso ao repositório e sem internet. `validar.ts` e os scripts foram executados aqui; o resto não foi compilado contra o seu projeto. O Claude Code (passo 3) compila, testa e ajusta.
- Se o PADRAO tiver lista dentro de lista (ex.: `descontosVolume` como pares), o Firestore recusa. O passo 2 do prompt detecta isso e para para você decidir.
