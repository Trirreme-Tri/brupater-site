# Guia do monitoramento 24h

Para quem cuida do site no dia a dia. Decisão em `docs/adr/0004-monitoramento.md`.

## O que é conferido, a cada 15 min

| Alvo | Passa quando | Falha comum |
|---|---|---|
| `/`, `/portfolio`, `/agenda`, `/encomendas`, `/projeto`, `/admin` | Responde 200 e tem "TRIRREME" no HTML (rodapé) | Hospedagem fora, deploy apagou a página, domínio apontando para outro lugar |
| `javascript` | O primeiro `<script>` da página inicial responde 200 | Deploy pela metade: a página abre em branco |
| `firestore` | `conteudo/site` responde 200 (404 passa com aviso: vale o PADRAO) | 429 = cota grátis esgotada; 403 = regras ou `projectId` errado |

O Firestore só é conferido depois que o projeto `prod` estiver preenchido em `src/lib/firebase/projetos.ts`.

## Onde ver

- **Cada execução:** aba **Actions → Monitoramento**. O resumo tem a tabela; o passo `monitorar` tem uma linha JSON por alvo (`hora`, `ok`, `status`, `ms`, `problemas`).
- **Quedas:** **Issues** com a etiqueta `monitoramento`. Aberta = fora do ar agora. Fechadas = histórico, com a hora da queda e da volta.
- **No computador:** `npm run monitorar` (Node 22.18 ou mais novo). Outro endereço: `MONITORAR_URL=https://... npm run monitorar`.

## Quando abrir um alerta

1. Abrir o link do log que está na issue e ver qual alvo falhou e por quê.
2. Abrir o site num navegador anônimo para confirmar.
3. Por motivo:
   - **Todas as páginas falham:** hospedagem. Ver o status do GitHub Pages ou do Firebase Hosting e o último deploy (Actions → GitHub Pages).
   - **Só `javascript`:** refazer o deploy (Actions → GitHub Pages → Run workflow).
   - **`firestore` 429:** cota do dia esgotada. O site segue com a cópia local ou o PADRAO, mas o painel não salva. A cota volta à meia-noite do horário do Pacífico. Avisar o Wellington; ver se há tráfego estranho em Firestore → Uso.
   - **`firestore` 403:** alguém publicou regras ou config erradas. Avisar o Leo.
4. Se for demorar, avisar o Wellington (ele fala com a Bru). A página `/manutencao` está pronta.
5. A issue fecha sozinha quando o site volta. Se a causa não for óbvia, anotar na issue antes de fechar.

## Configurar (uma vez)

- [ ] Depois do merge na `main`: Actions → Monitoramento → **Run workflow** e conferir a tabela.
- [ ] Ativar notificações: **Watch → Custom → Issues** no repositório, para receber o e-mail do alerta.
- [ ] Quando o site for para o Firebase: criar a variável `MONITORAR_URL` (Settings → Secrets and variables → Actions → **Variables**) com o endereço de produção, sem `/` no fim.

## Uso do Firestore (pelo console, depois do projeto criado)

Combinado no `docs/firestore/MANUAL.md`. Não verificado ainda: os nomes das telas podem mudar.

- [ ] **Leituras e gravações por dia:** Firebase → Firestore → Uso. Cota grátis: 50.000 leituras e 20.000 gravações por dia.
- [ ] **Regras negadas:** Firestore → Regras → monitoramento das regras (permitidas, negadas, com erro). Pico de negadas = alguém tentando gravar sem permissão.
- [ ] **Alerta perto da cota:** Google Cloud → Monitoring → Alerting, métrica de leituras do Firestore, avisar em 40.000 por dia. Conferir se funciona no plano Spark antes de contar com ele.

## Cuidados

- **60 dias sem atividade no repositório:** o GitHub desliga o agendamento sozinho e manda um e-mail. Religar em Actions → Monitoramento → **Enable workflow**.
- O GitHub pode atrasar execuções agendadas; 15 min é o mínimo, não a garantia.
- Erros no navegador do visitante ainda não são coletados: `src/app/error.tsx` só manda para o console (em aberto no ADR 0004).
