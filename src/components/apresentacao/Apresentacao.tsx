"use client";

/*
 * Apresentação para a Bru (/apresentacao): links, o que o site tem, estilo,
 * fontes, cores, fluxos e o que ela pode editar sozinha. As partes que
 * dependem do conteúdo (cores, fontes, preços) são lidas do site, então a
 * página acompanha o que for mudado no painel. Os links usam o endereço onde
 * o site estiver aberto (Firebase agora, domínio próprio depois).
 */
import type { ReactNode } from "react";
import { useMontado, useSite } from "@/lib/useSite";
import { TAMANHOS_IMAGEM } from "@/lib/conteudo/padrao";
import { brl, img, rota } from "@/lib/util";
import { SENHA, USUARIO } from "@/lib/acessoPainel";

const NOMES_CORES: Record<string, [string, string]> = {
  rosa: ["Rosa choque", "botões, etiquetas e destaques"],
  poster: ["Rosa do pôster", "títulos da ficha e números"],
  vinho: ["Vinho", "tons de fundo"],
  violeta: ["Violeta neon", "estrelas das vagas e brilho da agenda"],
  teal: ["Turquesa", "fila de produção e entregas"],
  papel: ["Papel", "fundo das seções impressas"],
  noite: ["Noite", "fundo das partes escuras"],
};

function LinkCompleto({ base, caminho }: { base: string; caminho: string }) {
  const u = base + rota(caminho);
  return <a className="url" href={rota(caminho)} target="_blank" rel="noopener">{u.replace(/^https?:\/\//, "")}</a>;
}

export function Apresentacao() {
  const site = useSite();
  const montado = useMontado();
  /* endereços completos, do jeito que aparecem no ar (o domínio só existe no navegador) */
  const base = montado ? window.location.origin : "";
  const ap = site.aparencia;
  const p = site.precos;

  const fontes = [
    { nome: ap.fontes.cinema, papel: "Fonte de cinema", uso: "Seu nome na abertura, títulos das páginas, preços, o \"FIM\". É alta e fina, como o COMMISSIONS do seu post.", amostra: "Brunna Paternostro", classe: "f-cinema" },
    { nome: ap.fontes.poster, papel: "Fonte de pôster", uso: "A ficha da personagem, a palavra gigante e os rótulos pequenos. Pesada, como o OÁSIS. Também é a letra dos textos do site.", amostra: "Força e ódio", classe: "f-poster" },
    { nome: ap.fontes.mao, papel: "Fonte de mão", uso: "A frase da abertura e as anotações, como o \"Savage!\" e o \"Hey!\" das suas artes.", amostra: "Colors and lines bring your ideas to life.", classe: "f-mao" },
  ];

  /* exemplo com os preços atuais */
  const enq = p.enquadramentos[0], acab = p.acabamentos[p.acabamentos.length - 1], fundo = p.fundos[0];
  const pct = (f: number) => "+" + Math.round((Number(f) - 1) * 100) + "%";
  const conferir: ReactNode[] = [];
  p.acabamentos.forEach((a) => { if (Number(a.fator) !== 1) conferir.push(<>Acréscimo do acabamento <b>{a.nome}</b>: {pct(a.fator)}</>); });
  conferir.push(<>Cada personagem extra na mesma arte: <b>+{p.personagemExtraPct}%</b> (até {p.maxPersonagens} personagens)</>);
  p.fundos.forEach((f) => { if (Number(f.preco) > 0) conferir.push(<>Fundo <b>{f.nome.toLowerCase()}</b>: {brl(f.preco)}</>); });
  const desc = p.descontosVolume.filter((d) => d.pct > 0).map((d) => d.pct + "% a partir de " + d.min + " artes");
  if (desc.length) conferir.push(<>Desconto por quantidade: <b>{desc.join(" · ")}</b></>);
  conferir.push(<>Uso comercial: <b>+{p.comercialPct}%</b></>);
  conferir.push(<>As <b>agendas de outubro, novembro e dezembro</b>, as datas e a fila estão preenchidas com exemplos: troque pelas suas no painel</>);
  conferir.push(<>O texto <b>&quot;Sobre você&quot;</b> e as respostas das perguntas foram escritos a partir dos seus posts: ajuste pra sua voz</>);

  return (
    <div className="doc">
      <header className="doc-capa">
        <div className="doc-capa-img" aria-hidden="true"></div>
        <div className="wrap doc-capa-txt">
          <p className="t-mao doc-pra">documento pra você, Bru &#10022;</p>
          <h1 className="t-cinema">Seu site está pronto pra <span>estrear</span></h1>
          <p className="doc-intro">Aqui está tudo explicado de um jeito simples: os links, o que o site tem, as cores e fontes escolhidas, como cada parte funciona e o que você já pode mudar sozinha, sem precisar chamar o Wellington.</p>
        </div>
      </header>

      <main className="wrap doc-corpo">
        {/* 1. links */}
        <section className="bloco" aria-labelledby="b1">
          <p className="rotulo"><span className="num">01</span> os links importantes</p>
          <h2 className="t-cinema" id="b1">Onde fica cada coisa</h2>
          <div className="cartoes-links">
            <div className="cartao">
              <p className="rotulo">site que seus clientes acessam</p>
              <ul className="paginas-links" id="paginas-links">
                {[["Início", "/"], ["Portfólio", "/portfolio"], ["Agenda", "/agenda"], ["Encomendas", "/encomendas"]].map(([nome, c]) => (
                  <li key={c}><b>{nome}</b><LinkCompleto base={base} caminho={c} /></li>
                ))}
              </ul>
              <a className="btn cheio" href={rota("/")} target="_blank" rel="noopener">Ver o site</a>
            </div>
            <div className="cartao">
              <p className="rotulo">seu painel (só você e o Wellington)</p>
              <LinkCompleto base={base} caminho="/admin" />
              <div className="acesso">
                <p><b>Acesso do painel</b> (o Wellington cria um definitivo pra você depois)</p>
                <code>Usuário: <span id="usuario">{USUARIO}</span></code>
                <code>Senha: <span id="senha">{SENHA}</span></code>
              </div>
              <a className="btn" href={rota("/admin")} target="_blank" rel="noopener">Abrir o painel</a>
            </div>
            <div className="cartao">
              <p className="rotulo">páginas de aviso (aparecem sozinhas quando precisa)</p>
              <ul className="paginas-links" id="paginas-aviso">
                {[["Página não existe (404)", "/pagina-que-nao-existe"], ["Algo deu errado", "/erro"], ["Site fora do ar", "/manutencao"]].map(([nome, c]) => (
                  <li key={c}><b>{nome}</b><LinkCompleto base={base} caminho={c} /></li>
                ))}
              </ul>
              <p className="ajuda-ap">A de <b>página não existe</b> aparece sozinha quando alguém digita um endereço errado, e a de <b>erro</b> aparece sozinha se alguma página der problema. A de <b>fora do ar</b> fica pronta pra quando precisar (quem ativa é o Wellington). Os textos e imagens delas mudam no painel, em Textos e imagens.</p>
            </div>
          </div>
        </section>

        {/* 2. roteiro */}
        <section className="bloco" aria-labelledby="b2">
          <p className="rotulo"><span className="num">02</span> o que o site tem</p>
          <h2 className="t-cinema" id="b2">O que tem em cada página</h2>
          <p className="bloco-sub">O site tem quatro páginas principais (mais a página de cada projeto), cada uma com o seu próprio link. Assim você pode mandar direto o link das encomendas ou da agenda pra quem perguntar.</p>
          <ol className="roteiro">
            <li><b>Início</b><span>No topo, suas artes em destaque ocupam a tela inteira, sem moldura, e passam pro lado sozinhas, sem parar (no estilo dos destaques da Steam). Tem miniaturas pra escolher, botão de pausa e o botão &quot;ver arte inteira&quot;, que abre a arte sem corte. No painel dá pra trocar pra outro jeito: a arte inteira sobre ela mesma desfocada. Seu nome fica menor, no canto superior esquerdo, e a etiqueta da agenda (<i>Commissions open</i>, <i>Esgotado</i> ou <i>Comms closed</i>) aparece ao lado. Logo abaixo vêm os <b>Projetos</b>: só a capa de cada coleção (ilustração e identidade visual); tocando na capa, abre a página do projeto inteiro, como no Behance. Depois vêm os seus links, a ficha da personagem no estilo do pôster <i>Oásis</i>, um interlúdio em tela cheia e três cartões que levam pras outras páginas.</span></li>
            <li><b>Portfólio</b><span>No topo, a arte com o degradê e a abertura de cinema (veja em &quot;o estilo&quot;). Depois, a galeria com filtros (Pôsteres, Personagens, Ilustrações, Estudos). Tocando numa arte, ela abre em tela cheia e dá pra passar pras próximas.</span></li>
            <li><b>Agenda</b><span>A situação agora (aberta, esgotada ou fechada), a contagem pra próxima abertura, as agendas de cada mês com as vagas em estrelinhas e o carimbo de ESGOTADO, um calendário e a fila de produção.</span></li>
            <li><b>Encomendas</b><span>Duas categorias: <b>Crie sua Ilustração</b> (enquadramento, acabamento, quantos personagens, fundo e quantidade) e <b>Crie sua Identidade Visual</b> (pacotes Básico, Completo e Premium). Mostra o <b>total estimado</b> na hora e manda o pedido pro seu <b>WhatsApp</b> com o resumo escrito. Pra quem prefere o Instagram, tem o botão de copiar o resumo e colar na DM. No fim, as perguntas frequentes.</span></li>
          </ol>
        </section>

        {/* 3. estilo */}
        <section className="bloco" aria-labelledby="b3">
          <p className="rotulo"><span className="num">03</span> o estilo</p>
          <h2 className="t-cinema" id="b3">Pôster de cinema</h2>
          <p className="bloco-sub">O nome do estilo é <b>Pôster de Cinema</b>. Ele foi tirado direto do seu Instagram, que já mistura dois mundos: capas de revista e pôsteres impressos (<i>COMMISSIONS OPEN</i>, <i>Oásis</i>, <i>Character</i>) e ilustrações escuras e dramáticas (a cavaleira saindo do portão, a garota com a água verde). A pedido seu, a base do site ficou clara, no tom de papel da ficha: assim as artes claras e escuras ganham o mesmo destaque.</p>
          <div className="estilo-grade">
            <figure><img src={img("assets/obras/commissions-open-g.webp")} width={720} height={900} alt="Post Commissions Open" loading="lazy" /><figcaption>Letra alta e fina + etiqueta rosa inclinada</figcaption></figure>
            <figure><img src={img("assets/obras/oasis-g.webp")} width={720} height={900} alt="Pôster Oásis" loading="lazy" /><figcaption>Ficha com rosa de pôster, papel e código de barras</figcaption></figure>
            <figure><img src={img("assets/obras/a-fuga-g.webp")} width={720} height={900} alt="A cavaleira saindo do portão" loading="lazy" /><figcaption>Artes em tela cheia, como cortes de cinema</figcaption></figure>
            <figure><img src={img("assets/tabela-comissoes.webp")} width={1350} height={1688} alt="Tabela de comissões" loading="lazy" /><figcaption>Brilho violeta neon da sua tabela</figcaption></figure>
          </div>
          <ul className="lista-estilo">
            <li><b>Base clara na página inicial:</b> o topo, os projetos e os links usam o tom de papel dos seus pôsteres, então artes claras e escuras ganham o mesmo destaque. O preto continua em alguns pontos (as faixas em tela cheia, os cartões das páginas, o rodapé) e as outras páginas seguem como estavam.</li>
            <li><b>Interlúdios:</b> cortes em tela cheia com uma arte e uma frase grande, como num filme.</li>
            <li><b>Claro ou escuro:</b> o site abre no tema claro e tem um botão de sol/lua no topo pra quem visita trocar pro escuro (o visual cinema, todo em tons escuros). A escolha fica guardada no navegador da pessoa. No painel você escolhe o tema inicial e se o botão aparece.</li>
            <li><b>Abertura de cinema:</b> na primeira visita aparece uma tela de carregamento com seu nome e a barrinha de progresso; quando termina, as faixas escuras se abrem como a tela de um cinema e o topo &quot;assenta&quot;. Nas próximas vezes, só a abertura rápida. Trocando de página, nada recarrega: a página nova entra direto.</li>
            <li><b>Topo das outras páginas:</b> no Portfólio, na Agenda e nas Encomendas, o tom do fundo vem da esquerda e sombreia a arte num degradê longo, sem corte reto; as bordas escurecem como lente de câmera, a arte &quot;assenta&quot; saindo de uma luz baixa e o título sobe como letreiro de filme. Tudo acontece uma vez, ao abrir, e depois fica parado.</li>
            <li><b>Trilha sonora:</b> um mini player no canto esquerdo da tela toca a sua playlist. Use uma <b>playlist do YouTube</b>: toca as músicas inteiras pra todo mundo e repete sem parar. No Spotify, quem não está logado ouve só 30 segundos de cada música. A música só começa quando a pessoa clica (regra dos navegadores) e <b>continua tocando enquanto ela navega</b> pelas páginas. Minimizar não para a música, e ela entra e sai devagar (sem susto). Você escolhe no painel o <b>volume inicial</b>, de 1 em 1 (dá pra deixar baixinho, tipo 2 ou 4%), e quem visita aumenta ou diminui no próprio player (no YouTube e no SoundCloud; no Spotify, só pelo volume do aparelho).</li>
            <li><b>Topo:</b> suas artes em destaque cobrem a tela inteira e passam pro lado sozinhas, sem fim. O botão &quot;ver arte inteira&quot; abre a arte sem corte. Pra ficar perfeito, use artes deitadas (1920 × 1080) e, se quiser, uma versão em pé só pro celular.</li>
          </ul>
        </section>

        {/* 4. fontes */}
        <section className="bloco" aria-labelledby="b4">
          <p className="rotulo"><span className="num">04</span> as fontes</p>
          <h2 className="t-cinema" id="b4">Três vozes de letra</h2>
          <div className="fontes" id="fontes">
            {fontes.map((f) => (
              <div key={f.papel} className="fonte">
                <p className="rotulo">{f.papel}</p>
                <p className={"fonte-amostra " + f.classe}>{f.amostra}</p>
                <p className="fonte-nome">{f.nome}</p>
                <p className="fonte-uso">{f.uso}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. cores */}
        <section className="bloco" aria-labelledby="b5">
          <p className="rotulo"><span className="num">05</span> as cores</p>
          <h2 className="t-cinema" id="b5">A paleta</h2>
          <p className="bloco-sub">As cores foram tiradas das suas próprias artes: o rosa choque da etiqueta <i>OPEN</i>, o rosa do <i>Oásis</i>, o vinho da tiefling, o violeta neon da tabela, o turquesa da água e o papel dos seus pôsteres.</p>
          <div className="cores" id="cores">
            {Object.keys(NOMES_CORES).map((k) => {
              const hex = (ap.cores as unknown as Record<string, string>)[k];
              return (
                <div key={k} className="cor">
                  <span className="amostra-cor" style={{ background: hex }}></span>
                  <b>{NOMES_CORES[k][0]}</b>
                  <code>{String(hex).toUpperCase()}</code>
                  <small>{NOMES_CORES[k][1]}</small>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. fluxos */}
        <section className="bloco" aria-labelledby="b6">
          <p className="rotulo"><span className="num">06</span> como funciona</p>
          <h2 className="t-cinema" id="b6">Os fluxos</h2>

          <h3 className="fluxo-t">Quem visita o site</h3>
          <ol className="fluxo">
            <li><b>Chega</b><span>Vê sua arte, seu nome e se as encomendas estão abertas.</span></li>
            <li><b>Conhece</b><span>Passa pela ficha e pelo portfólio.</span></li>
            <li><b>Confere a agenda</b><span>Vê quando abre, quantas vagas tem e como anda a fila.</span></li>
            <li><b>Monta o pedido</b><span>Escolhe as opções e vê o preço na hora.</span></li>
            <li><b>Manda pra você</b><span>O botão principal abre o seu WhatsApp com o pedido já escrito. Quem prefere o Instagram copia o resumo e cola na sua DM.</span></li>
          </ol>

          <h3 className="fluxo-t">Como o preço é calculado</h3>
          <div className="formula">
            <p><b>Preço do enquadramento</b> <i>+ % de cada personagem extra</i> &times; <b>acréscimo do acabamento</b> + <b>fundo</b></p>
            <p className="exemplo" id="exemplo">
              {enq && acab && fundo ? (
                <>Exemplo: <b>{enq.nome}</b> ({brl(enq.preco)}) com <b>{acab.nome}</b> (+{Math.round((acab.fator - 1) * 100)}%), 1 personagem, {fundo.nome.toLowerCase()} = <b>{brl(Number(enq.preco) * Number(acab.fator) + Number(fundo.preco))}</b></>
              ) : null}
            </p>
            <p>Depois disso entram a quantidade, o <b>desconto por quantidade</b> (quando o pedido tem várias artes) e o <b>uso comercial</b>, se a pessoa marcar.</p>
          </div>

          <h3 className="fluxo-t">A agenda</h3>
          <p className="bloco-sub">Você cria uma agenda pra cada abertura, por exemplo &quot;Agenda de novembro: abre dia 1º, 4 vagas&quot;. O site cuida do resto sozinho:</p>
          <div className="agenda-estados">
            <div><span className="etiqueta fechada">Comms closed</span><p><b>Antes da data:</b> aparece &quot;abre em X dias&quot; e o botão &quot;Me avisa quando abrir&quot;.</p></div>
            <div><span className="etiqueta">Commissions open</span><p><b>No dia:</b> abre sozinha e mostra quantas vagas sobram. O botão do pedido vira &quot;Enviar pedido no WhatsApp&quot;.</p></div>
            <div><span className="etiqueta esgotado">Esgotado</span><p><b>Quando enche:</b> cada vez que alguém pagar os 50%, você marca <b>+1</b> no painel. Na última vaga, aparece ESGOTADO e o pedido vira lista de espera.</p></div>
          </div>
          <p className="bloco-sub">Se precisar parar antes (férias, imprevisto), tem a opção de pausar. As datas de entrega e avisos aparecem no calendário junto com as aberturas, e a fila mostra cada encomenda passando por Esboço, Lineart, Cor, Render e Entregue.</p>
          <p className="bloco-sub"><b>O botão &quot;Me avisa quando abrir&quot;</b> abre o seu WhatsApp com a mensagem já escrita: a pessoa só envia. O site não guarda a lista sozinho; quem avisa é você, pelas mensagens que chegarem.</p>

          <h3 className="fluxo-t">O painel</h3>
          <ol className="fluxo">
            <li><b>Entra</b><span>Com o usuário e a senha lá de cima.</span></li>
            <li><b>Muda</b><span>Agenda, preços, artes, textos, cores, fontes.</span></li>
            <li><b>Confere</b><span>O botão &quot;Prévia&quot; mostra o site com as mudanças antes de salvar, no modo claro ou escuro, no celular ou no computador.</span></li>
            <li><b>Salva</b><span>Uma barra aparece embaixo. Clicou em &quot;Salvar alterações&quot;, o site muda na hora.</span></li>
          </ol>
          <p className="bloco-sub"><b>Por enquanto</b>, o que você salva no painel fica guardado no navegador em que você editou (é pra testar e decidir como quer). Quando o site ganhar o banco de dados, que é a próxima etapa, as mudanças passam a valer pra todo mundo que visitar.</p>
        </section>

        {/* 7. estrutura */}
        <section className="bloco" aria-labelledby="b7">
          <p className="rotulo"><span className="num">07</span> a estrutura</p>
          <h2 className="t-cinema" id="b7">Do que o site é feito</h2>
          <div className="estrutura">
            <div><b>4 páginas do site</b><span><code>/</code> início · <code>/portfolio</code> · <code>/agenda</code> · <code>/encomendas</code> · e <code>/projeto</code>, que mostra cada projeto</span></div>
            <div><b>E mais duas</b><span><code>/admin</code> o painel · <code>/apresentacao</code> esta página</span></div>
            <div><b>Tecnologia</b><span>Feito em <b>Next.js</b> com <b>TypeScript</b>, as mesmas ferramentas de sites profissionais. A troca de página acontece sem recarregar, por isso a música não para. E o site já está pronto pra próxima etapa: o banco de dados.</span></div>
            <div><b>Onde fica no ar</b><span>Agora no <b>Firebase</b> (Google). Depois, no seu <b>domínio próprio</b>: os links desta página acompanham sozinhos o endereço onde o site estiver.</span></div>
            <div><b>Imagens</b><span>As do portfólio ficam numa pasta própria, cada uma em duas versões: uma menor pra grade e uma grande pra tela cheia.</span></div>
            <div><b>Conteúdo</b><span>Todo texto, preço, data, link, cor e fonte mora num lugar só, que o painel edita. Nada fica &quot;preso&quot; no código.</span></div>
            <div><b>Celular primeiro</b><span>Pensado pra tela do celular e ajustado pra tablet e computador.</span></div>
          </div>
        </section>

        {/* 8. painel */}
        <section className="bloco" aria-labelledby="b8">
          <p className="rotulo"><span className="num">08</span> o que você pode editar sozinha</p>
          <h2 className="t-cinema" id="b8">As abas do painel</h2>
          <p className="bloco-sub">Em qualquer campo de imagem tem o botão <b>&quot;Escolher das minhas artes&quot;</b>: é só clicar na arte, sem precisar saber o nome do arquivo. E embaixo de cada imagem aparece o <b>tamanho ideal</b> pra aquele lugar.</p>
          <ol className="abas-lista">
            <li><b>Início</b> atalhos pro que você mais usa, a situação da agenda e o +1 vaga num clique</li>
            <li><b>Agenda e vagas</b> agendas de cada mês (data, vagas e o botão +1 vaga), pausa, textos de cada situação, datas do calendário, fila e etapas</li>
            <li><b>Preços e pacotes</b> enquadramentos, acabamentos, personagem extra, fundos, descontos, uso comercial, regras de pagamento, os pacotes de identidade visual, a imagem da tabela de comissões e a nota do total estimado</li>
            <li><b>Minhas artes</b> enviar artes do computador, trocar título e categoria, esconder, reordenar ou apagar; marcar quais passam no topo, a parte da arte que aparece e a versão de celular</li>
            <li><b>Projetos</b> criar coleções, escolher a capa, a categoria (Ilustração ou Identidade visual), o texto e as imagens de cada projeto</li>
            <li><b>Textos e imagens</b> o topo de cada página, como as artes aparecem no carrossel, os interlúdios e as páginas de aviso (erro, página não existe, fora do ar)</li>
            <li><b>Sobre mim e contato</b> nome, título (ex.: <i>Illustrator &amp; Graphic Design</i>), avatar, frase, Instagram, WhatsApp e o botão flutuante, o mini player de música (a sua playlist), e tudo da ficha</li>
            <li><b>Links</b> adicionar, trocar ícone, esconder ou reordenar</li>
            <li><b>Perguntas</b> as perguntas e respostas do fim</li>
            <li><b>Cores e visual</b> cores do <b>modo claro</b> e do <b>modo escuro</b> separadas (fundo, faixas, letras, barra do topo, rodapé), cores da marca, paletas prontas, fontes, tela de carregamento e animações</li>
            <li><b>Backup</b> baixar uma cópia de tudo, restaurar e voltar à versão original</li>
          </ol>
        </section>

        {/* 9. tamanhos de imagem */}
        <section className="bloco" aria-labelledby="b9t">
          <p className="rotulo"><span className="num">09</span> tamanho das imagens</p>
          <h2 className="t-cinema" id="b9t">Cada lugar, um formato</h2>
          <p className="bloco-sub">Com o tamanho certo, a arte aparece bem enquadrada e nítida. O topo da página inicial e o topo das outras páginas pedem <b>imagens deitadas</b>: uma arte em pé ali sempre perde um pedaço. Essa mesma lista está no painel, na aba Início.</p>
          <div className="tamanhos-ap" id="tamanhos-ap">
            {TAMANHOS_IMAGEM.map((t) => (
              <div key={t.onde} className="tam-ap"><b>{t.onde}</b><span>{t.tamanho}</span><i>{t.formato}</i><small>{t.dica}</small></div>
            ))}
          </div>
        </section>

        {/* 10. conferir */}
        <section className="bloco destaque" aria-labelledby="b9">
          <p className="rotulo"><span className="num">10</span> pra você conferir</p>
          <h2 className="t-cinema" id="b9">Valores que eu coloquei como ponto de partida</h2>
          <p className="bloco-sub">Os preços de busto, meio corpo e corpo inteiro vieram da sua tabela. Os itens abaixo não estavam nela, então eu coloquei um valor inicial. Confira e ajuste no painel do jeito que você cobra:</p>
          <ul className="conferir" id="conferir">
            {conferir.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
          <p className="bloco-sub">Os pacotes de identidade visual estão como <b>&quot;sob consulta&quot;</b> até você colocar os preços no painel. Os projetos de ilustração foram montados com as artes que você mandou, com nomes e textos provisórios: troque à vontade. Os de identidade visual entram quando você mandar as imagens deles.</p>
        </section>
      </main>

      <footer className="rodape">
        <div className="wrap">
          <p className="fim">Fim</p>
          <p className="fim-sub">com carinho &#9825;</p>
          <div className="creditos"><span>Documento preparado pelo <b>Wellington</b> sobre o seu site</span></div>
          <p className="trirreme">Site desenvolvido pela <a href="https://trirreme.com" target="_blank" rel="noopener">TRIRREME</a></p>
        </div>
      </footer>
    </div>
  );
}
