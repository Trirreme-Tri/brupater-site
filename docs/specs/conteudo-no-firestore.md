# Spec — Conteúdo no Firestore

- **Status:** Proposta (aprovação do Wellington antes de codar)
- **Decisão de base:** ADR 0002
- **Responsável:** Leo Eliel

## Objetivo

O que a Bru salva no painel passa a valer para todos os visitantes, sem mudar a aparência aprovada.

## Fora do escopo

- Upload de imagens pelo painel (continua desativado para o banco; imagens em base64 são recusadas).
- Pedidos de clientes (continuam indo só para o WhatsApp).
- Escolhas do visitante (modo claro/escuro, abertura vista) e o rascunho da prévia: continuam no navegador.
- Leitura no servidor para SEO (melhoria posterior).

## Critérios de aceite

Cada item é sim ou não. Todos precisam ser "sim" no emulador antes de staging, e em staging antes de produção.

**Regras**
1. `npm run test:regras` passa os 11 testes (6 do guia + 5 extras).

**Leitura**
2. Com o documento `conteudo/site` inexistente, o site mostra exatamente o PADRAO.
3. Uma alteração salva no painel no navegador A aparece no navegador B (outro perfil, sem login) sem recarregar a página.
4. Com o Firestore inacessível (emulador desligado), o site abre com a última cópia ou com o PADRAO, sem erro na tela, em até 8 s.
5. Numa visita repetida, o visitante não vê o texto do PADRAO antes do conteúdo salvo (gravar a tela em câmera lenta ou conferir com throttling "Slow 4G").
6. Trocar de página não faz nova leitura no Firestore (aba Rede ou UI do emulador).

**Gravação e login**
7. O painel exige login Firebase (e-mail e senha). O usuário e senha de `src/lib/acessoPainel.ts` deixam de funcionar e saem do código.
8. Conta logada fora de `admins` vê "Esta conta não tem permissão para editar o site." ao salvar.
9. Cada salvamento cria exatamente um documento em `historico`.
10. Se outra pessoa salvou depois que o painel abriu, o salvamento é recusado com mensagem e nada é gravado.
11. Tentar salvar com imagem em base64 mostra o campo culpado e nada é gravado.
12. "Voltar ao padrão" grava o PADRAO e guarda a versão anterior no histórico.
13. Restaurar uma versão do histórico funciona (testado em staging antes de produção).
14. "Baixar cópia (.json)" continua funcionando.
15. Recuperação de senha envia o e-mail do Firebase.

**Não regressão**
16. Todas as páginas da tabela do guia ficam visualmente iguais ao commit `521e7fe` (claro e escuro, celular e desktop).
17. Prévia ao vivo (`?previa=1`) continua funcionando e não grava no Firestore.
18. `npm run verificar` passa.

## Desenho

```
Visitante ──lê──▶ conteudo/site ◀──grava (transação)── Painel (login)
                       │                                   │
                       └──── cópia anterior ──▶ historico/{data-hora}_{uid}
Regras conferem: admins/{uid} existe, atualizadoPor == uid, atualizadoEm == hora do servidor
```

Arquivos: `src/lib/firebase/*` (camada nova), `src/lib/loja.ts`, `src/lib/useSite.ts`, painel (`src/components/painel/motor.ts` e a tela de login), layout raiz (script anti-piscada).

## Riscos

| Risco | Mitigação |
|---|---|
| PADRAO piscando antes do conteúdo | Cache síncrono + script anti-piscada (critério 5) |
| Formato do PADRAO incompatível com o Firestore (lista dentro de lista) | `validarParaFirestore` roda num teste sobre o PADRAO antes de qualquer deploy |
| Duas edições ao mesmo tempo | Transação com conferência de `atualizadoEm` (critério 10) |
| Regras erradas expondo escrita | Testes no emulador + validação em staging + publicação em produção só com autorização (R3) |

## Verificação no emulador

Feita em 2026-10-13 contra o emulador (`demo-brupater`), com `npm run dev` e navegador automatizado (Chromium headless, perfis separados). Nada foi tocado na nuvem.

| # | Critério | Resultado |
|---|---|---|
| 1 | `npm run test:regras`: 11 testes | Sim (11/11) |
| 2 | Sem `conteudo/site`, o site mostra o PADRAO | Sim |
| 3 | Salvar no painel (A) aparece no navegador B sem recarregar | Sim |
| 4 | Firestore fora do ar: abre em < 8 s com a cópia ou o PADRAO, sem erro | Sim (~2 s, 0 erros de página) |
| 5 | Visita repetida não mostra o PADRAO antes do conteúdo salvo | Sim (nenhum texto do PADRAO visível). Não conferido com throttling "Slow 4G" |
| 6 | Trocar de página não faz nova leitura | Sim (0 novas requisições ao Firestore) |
| 7 | Login Firebase; usuário e senha antigos saíram do código | Sim (`acessoPainel.ts` removido; `brunna`/`brupater` recusados) |
| 8 | Conta fora de `admins` vê a mensagem de permissão | Sim |
| 9 | Cada salvamento cria exatamente um `historico` | Sim (o primeiro salvamento, com o documento ainda inexistente, não cria histórico: não há versão anterior) |
| 10 | Edição simultânea é recusada, nada é gravado | Sim. Bug achado e corrigido no teste: o painel agora guarda o carimbo de quando carregou o conteúdo (`baseMs`) |
| 11 | Imagem em base64 recusada, com o campo culpado | Sim (`site.perfil.avatar`) |
| 12 | "Voltar ao padrão" grava o PADRAO e guarda a anterior no histórico | Sim |
| 13 | Restaurar versão do histórico | **Não verificado**: `restaurarVersao` existe em `conteudoRemoto.ts`, mas o painel não tem tela para isso (exige decisão sobre o visual do painel) |
| 14 | "Baixar cópia (.json)" continua existindo | Sim (aba Backup; presença conferida, download não) |
| 15 | Recuperação de senha envia o e-mail | Sim (e-mail gerado no emulador) |
| 16 | Páginas visualmente iguais ao commit `521e7fe` | **Não verificado**: comparação visual pendente. Mudanças visíveis conhecidas: tela de login do painel (E-mail no lugar de Usuário, link "Esqueci a senha") e o cartão de acesso na apresentação |
| 17 | Prévia ao vivo funciona e não grava | Sim |
| 18 | `npm run verificar` | Sim |

Também há `npm run test:formato`: o PADRAO é aceito por `validarParaFirestore`.
