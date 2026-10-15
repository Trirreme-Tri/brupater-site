# ADR 0004 — Monitoramento 24h pelo GitHub Actions

- **Status:** Proposto (aguarda aprovação do Wellington)
- **Data:** 2026-10-15
- **Responsável:** Bryan Serafim
- **Relacionados:** ADR 0001 (stack), ADR 0002 (Firestore), spec `docs/specs/monitoramento.md`, guia `docs/monitoramento/guia.md`

## Contexto

O ADR 0001 deixou o monitoramento 24h como próxima etapa. O site não tem servidor (funciona no modo estático), está no plano grátis e ainda não tem projeto Firebase criado: hoje o único endereço no ar é a prévia no GitHub Pages. Precisamos saber quando o site ou o banco caem, ter um registro (log) de cada conferência e um histórico de quedas, sem custo fixo, sem dependência nova e sem conta nova.

## Decisão

1. **Conferência externa** (`ferramentas/monitorar.mjs`, Node puro, sem dependências): cada página pública e o painel respondem 200 com o rodapé da TRIRREME; o JavaScript da página inicial carrega; o Firestore responde `conteudo/site` (429 = cota esgotada, 403 = regras ou projeto errado).
2. **Onde roda:** GitHub Actions, a cada 15 min (`.github/workflows/monitoramento.yml`). Repositório público: os minutos são gratuitos.
3. **Log:** cada conferência é uma linha JSON no log da execução, mais uma tabela no resumo da execução (aba Actions).
4. **Alerta e histórico:** na primeira falha abre uma issue com a etiqueta `monitoramento`; na volta, comenta e fecha a mesma issue. Sem novas issues nem comentários enquanto continua fora (evita dezenas de e-mails). As issues fechadas são o histórico de quedas.
5. **Endereço:** variável do repositório `MONITORAR_URL` (não é segredo). Sem ela, a prévia. O projeto Firebase vem de `src/lib/firebase/projetos.ts` (ambiente `prod`): quando o Leo preencher, o banco passa a ser conferido sem mudar o monitoramento.
6. **Uso do Firestore** (leituras e gravações por dia, regras negadas, alerta perto da cota): pelo console do Firebase/Google Cloud, não por código. Passos no guia.

## Alternativas consideradas

| Opção | Por que não agora |
|---|---|
| UptimeRobot, Better Stack etc. | Conta nova fora da TRIRREME, plano grátis com limites que mudam; o log fica fora do repositório |
| Gravar erros numa coleção do Firestore | Gravação pública aberta gasta a mesma cota do painel (20.000/dia) e pode ser abusada; muda `firestore.rules` |
| Firebase Performance / Analytics | Dependência nova e, no Analytics, consentimento de cookies (LGPD) |

## Em aberto: erros no navegador do visitante

O `src/app/error.tsx` hoje só manda o erro para o console. Para ver erros que acontecem no navegador dos visitantes é preciso uma ferramenta externa. A sugestão é o Sentry (`@sentry/browser`, plano grátis), ligado em `error.tsx` e no aviso de Firestore indisponível em `src/lib/loja.ts`. Exige conta e dependência nova, então fica para um ADR próprio, depois do site em produção.

## Consequências

- Cada execução custa 1 leitura do Firestore: 96 por dia, 0,2% da cota grátis.
- O GitHub atrasa execuções agendadas em horários de pico (minutos, às vezes mais). O intervalo real pode passar de 15 min.
- Em repositório público, o GitHub **desliga os agendamentos depois de 60 dias sem atividade no repositório**. Religar em Actions → Monitoramento → Enable workflow (ver guia).
- O agendamento só roda na branch padrão (`main`): antes do merge, testar com `npm run monitorar`.
- Detecta queda e página em branco por JavaScript faltando, não erro visual nem erro dentro do painel.

## Gatilhos para revisitar

- Site em produção no Firebase (trocar `MONITORAR_URL` e aprovar o item "erros no navegador").
- Precisar de alerta em menos de 15 min, ou por WhatsApp/Telegram.
- Repositório ficar privado (minutos do Actions passam a contar).
