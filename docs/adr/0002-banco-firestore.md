# ADR 0002 — Conteúdo do site num único documento do Firestore

- **Status:** Proposto (aguarda aprovação do Wellington)
- **Data:** 2026-10-09
- **Responsável:** Leo Eliel
- **Relacionados:** ADR 0001 (stack Next.js), ADR 0003 (dependência `firebase`), spec `docs/specs/conteudo-no-firestore.md`

## Contexto

Todo o conteúdo editável do site é um objeto do tipo `Site` (`src/lib/conteudo/tipos.ts`), hoje salvo no `localStorage` de quem edita. O que a Bru salva no painel não chega aos visitantes. Precisamos de um armazenamento compartilhado, com escrita restrita à Bru e ao Wellington, sem mudar a aparência aprovada e sem custo fixo nesta fase.

O objeto atual tem cerca de 18,6 KB em JSON. O limite de um documento do Firestore é 1 MiB.

## Decisão

1. **Opção A:** o objeto `Site` inteiro fica em um documento, `conteudo/site`, no mesmo formato do tipo `Site`, com dois campos de controle: `atualizadoEm` (hora do servidor) e `atualizadoPor` (UID).
2. **Histórico:** antes de cada salvamento, a versão anterior é copiada para `historico/{data-hora}_{uid}`, na mesma transação.
3. **Edição simultânea:** o salvamento é recusado se `atualizadoEm` mudou desde que o painel carregou (concorrência otimista). Não vale "o último que salvar".
4. **Permissões:** leitura pública; gravação só para UIDs em `admins/{uid}`, conferida pelas regras do Firestore (`firestore.rules`). O carimbo (`atualizadoPor`, `atualizadoEm`) é conferido pelas regras.
5. **Login:** Firebase Authentication (e-mail e senha) substitui o usuário e senha que estão em `src/lib/acessoPainel.ts`.
6. **Leitura no navegador:** `useSite.ts` escuta o documento (`onSnapshot`). A última cópia recebida fica em `localStorage` (`brupater:site:remoto`) e é lida de forma síncrona, para evitar que o visitante veja o PADRAO piscando antes do conteúdo salvo.
7. **Um projeto Firebase por cliente**, com três ambientes (dev, staging, prod), na conta da TRIRREME.
8. **Hospedagem:** Firebase Hosting no plano grátis (`npm run build:estatico`). App Hosting fica para quando houver necessidade real de servidor.
9. **Imagens fora do banco:** o documento guarda só endereços. Uma validação antes de gravar recusa imagens em base64 (`data:`).

## Alternativas consideradas

| Opção | Por que não agora |
|---|---|
| B. Um documento por seção | ~12 leituras por visita e mais código, para um ganho (salvar só o que mudou) que não faz diferença com 18 KB |
| C. Coleções para listas (galeria, projetos) | Muda o formato que o site inteiro consome; risco alto logo após a migração para Next.js |
| Supabase (Postgres) | Já usado no site da Anne, mas exigiria outro login e outro modelo; o Firebase já hospeda o site |

## Consequências

- Só `src/lib/loja.ts`, `src/lib/useSite.ts` e o painel mudam. Componentes não sabem que o Firebase existe.
- Cada visita custa 1 leitura. A cota grátis (50.000 leituras e 20.000 gravações por dia) sobra com folga.
- Cada salvamento regrava o documento inteiro e cria um documento de histórico (~20 KB). Mil salvamentos ≈ 20 MB, longe de 1 GiB.
- Sem servidor, o HTML estático é gerado com o PADRAO. Em visitas repetidas, a página fica oculta por até 1,5 s até o conteúdo salvo aparecer (ver spec).
- O formato continua sendo o tipo `Site`: mudar o formato exige migração com id único, como hoje.

## Gatilhos para revisitar

- Documento passar de 500 KB.
- Mais de duas pessoas editando.
- Necessidade de histórico por item (ex.: quem mudou o preço X).
- Upload de imagens pelo painel aprovado (decidir Storage em ADR próprio).
