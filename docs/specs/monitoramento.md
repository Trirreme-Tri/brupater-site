# Spec — Monitoramento 24h

- **Status:** Proposta (aprovação do Wellington)
- **Decisão de base:** ADR 0004
- **Responsável:** Bryan Serafim

## Objetivo

A TRIRREME fica sabendo, sem ninguém olhar o site, quando ele ou o banco saem do ar, e tem um registro de cada conferência e de cada queda.

## Fora do escopo

- Erros no navegador do visitante (em aberto no ADR 0004).
- Erros visuais e erros dentro do painel.
- Alertas por WhatsApp/Telegram.

## Critérios de aceite

Cada item é sim ou não.

**Conferência**
1. `npm run monitorar` com o site no ar termina com código 0 e uma linha JSON por alvo.
2. Com `MONITORAR_URL` apontando para um endereço inexistente, termina com código 1 e diz o motivo de cada alvo.
3. Uma página que responde 200 sem o rodapé da TRIRREME conta como falha.
4. Sem `projectId` em `projetos.ts`, o Firestore é pulado com aviso, sem falhar.
5. Com o projeto preenchido, `conteudo/site` respondendo 200 passa; 404 passa com aviso (vale o PADRAO); 403 e 429 falham.

**GitHub Actions**
6. O workflow roda pelo botão "Run workflow" e mostra a tabela no resumo da execução.
7. Na primeira falha abre uma issue `monitoramento`; falhas seguidas não abrem outra nem comentam.
8. Na primeira execução boa depois da falha, a issue é comentada e fechada.

**Não regressão**
9. Nenhum arquivo do site (`src/`) muda.
10. `npm run verificar` passa.

## Verificação

Feita em 2026-10-15 no computador (Node 22.22), contra a prévia no GitHub Pages. O workflow não pôde ser testado: agendamento e "Run workflow" só existem depois do merge na `main`.

| # | Critério | Resultado |
|---|---|---|
| 1 | Site no ar: código 0, uma linha JSON por alvo | Sim (8 alvos, ~300 ms por página) |
| 2 | Endereço inexistente: código 1 com motivo | Sim (404 e erro de DNS testados) |
| 3 | 200 sem o rodapé conta como falha | Sim (servidor local com uma página sem o rodapé) |
| 4 | Sem `projectId`, Firestore pulado com aviso | Sim |
| 5 | Respostas do Firestore | **Não verificado**: ainda não há projeto. Projeto inexistente responde 403 (testado) |
| 6–8 | Workflow, abrir e fechar issue | **Não verificado** (depois do merge) |
| 9 | `src/` intocado | Sim |
| 10 | `npm run verificar` | Sim |
