# Prompt para o Claude Code (integração no repositório)

Cole o bloco abaixo no Claude Code, aberto na raiz do `brupater-site`, depois de copiar os arquivos deste pacote para o repositório (passo 2 do LEIA-ME).

---

```
Você vai integrar o Firestore ao site Bru Pater. Leia antes, nesta ordem:
docs/firestore/guia-banco-de-dados.md (contexto e regras da cliente),
docs/adr/0002-banco-firestore.md, docs/adr/0003-dependencia-firebase.md,
docs/specs/conteudo-no-firestore.md, src/lib/conteudo/tipos.ts,
src/lib/conteudo/padrao.ts, src/lib/loja.ts, src/lib/useSite.ts,
src/lib/acessoPainel.ts, src/components/painel/motor.ts, a tela de login do
painel em src/app/admin/ e src/app/layout.tsx.

A camada nova já está pronta em src/lib/firebase/ (projetos.ts, config.ts,
auth.ts, conteudoRemoto.ts, validar.ts, erros.ts, antiPiscada.ts,
constantes.ts). Use as funções dela; só ajuste imports/tipos se não
compilarem (ex.: se o tipo Site não for export nomeado de tipos.ts).

LIMITES (não negociáveis):
- NÃO crie projetos Firebase, NÃO rode firebase deploy, NÃO rode nada contra
  a nuvem. Tudo contra o emulador (projeto demo-brupater).
- NÃO mude a aparência de nenhuma página. Nenhum CSS visual, nenhum texto.
- NÃO apague dados salvos nem migrações existentes.
- Nunca escreva "protótipo" no site. Não toque no rodapé.
- Commits em inglês, Conventional Commits, numa branch feat/firestore-content.
- Nada de senha, token ou chave de conta de serviço em arquivo nenhum.

TAREFAS, uma por commit, rodando `npm run verificar` antes de cada commit:

1. Rode `node scripts/instalar-firebase.mjs` e instale:
   npm install firebase
   npm install -D firebase-tools @firebase/rules-unit-testing cross-env
   Antes de instalar, rode `npm run build` e anote o First Load JS de / e
   /admin para o ADR 0003.

2. Teste de formato do PADRAO: crie um teste (use o runner que o projeto já
   tiver; se não houver, node:test com tsx ou --experimental-strip-types) que
   chama validarParaFirestore(PADRAO). Se falhar (ex.: lista dentro de lista
   em descontosVolume), NÃO mude o formato por conta própria: pare e me
   explique o campo e as opções (cada uma exigiria migração em MIGRACOES).

3. loja.ts:
   - lojaCarregar(): mescla, nesta ordem de prioridade, cópia remota em cache
     (lerCache().site) > PADRAO, usando o mesclar() existente e rodando as
     MIGRACOES como hoje. A chave antiga brupater:site:v2 deixa de ser fonte
     do site público (não apague o que estiver nela).
   - lojaSalvar(site): vira assíncrona e chama salvarConteudo(site,
     atualizadoEmMs carregado, uid). Precisa receber o uid de quem está
     logado. Deixe a assinatura clara para o painel.
   - lojaRestaurarPadrao(): usa restaurarPadrao (com histórico).
   - lojaPrevia(): continua local, sem mudança.
   - Exponha o atualizadoEmMs da última cópia recebida para o painel.

4. useSite.ts (useSyncExternalStore):
   - assinar(): abre ouvirConteudo() uma única vez (contagem de assinantes;
     fecha quando o último sair). Em cada cópia recebida, recalcula o site
     mesclado e avisa os componentes.
   - snapshot(): devolve a última cópia já mesclada; precisa ser a MESMA
     referência enquanto nada mudar (memoize), senão o React entra em loop.
   - getServerSnapshot: continua o PADRAO.
   - Em aoFalhar: console.warn discreto, site segue com cache/PADRAO.
   - Mantenha o evento storage para a prévia ao vivo do painel.

5. Anti-piscada no layout raiz:
   - No <head> de src/app/layout.tsx: <script
     dangerouslySetInnerHTML={{ __html: SCRIPT_ANTI_PISCADA }} /> e <style>
     com CSS_ANTI_PISCADA (ou acrescente a regra ao CSS global).
   - Chame liberarConteudo() num useEffect do primeiro componente cliente que
     já renderiza com o conteúdo do useSite (só depois do primeiro render
     com a cópia).
   - Não deixe o script afetar /admin nem /apresentacao de forma visível.

6. Painel:
   - Tela de login: e-mail + senha com entrar(); link "Esqueci a senha" com
     enviarRedefinicao(); erros via mensagemDeErro(). Reaproveite o visual
     atual da tela de login (mesmos elementos/classes; troque só o campo
     "usuário" por "e-mail" se necessário).
   - Sessão: ouvirUsuario() substitui a chave brupater:painel. sair() no
     botão de sair.
   - Remova o usuário e a senha de src/lib/acessoPainel.ts (o arquivo pode
     sumir ou virar um reexport de auth.ts).
   - Salvar: estado "salvando…", trata ConflitoDeEdicao, FormatoInvalido e
     permission-denied com mensagemDeErro().
   - Upload de imagem: mantenha o botão, mas se a imagem ficar em base64 o
     salvamento será recusado pela validação. Mostre a mensagem; não esconda
     o botão sem me perguntar.
   - Se houver lugar natural no painel, liste as 10 últimas versões
     (listarHistorico) com botão "Restaurar" (restaurarVersao). Se exigir
     mudança visual relevante, pare e me pergunte.

7. Rode, com `npm run emuladores` em outro terminal:
   - npm run test:regras (11 testes)
   - npm run emuladores:semear
   - npm run dev e confira os critérios 2 a 15 e 17 da spec. Para o 3, use
     duas janelas (uma anônima).
   Escreva o resultado de cada critério numa tabela em
   docs/specs/conteudo-no-firestore.md (seção nova "Verificação no
   emulador"), marcando o que não deu para verificar automaticamente.

8. Rode `npm run build` de novo, preencha a tabela de tamanho no ADR 0003.

No fim: resumo do que mudou, o que ficou pendente e qualquer decisão que
você tomou sem mim. Não abra PR; eu abro.
```
