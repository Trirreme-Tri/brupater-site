/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Motor do painel da Bru (/admin).
 *
 * Como funciona: o painel edita uma CÓPIA do conteúdo (rascunho). Nada muda
 * no site até clicar em "Salvar alterações": aí o rascunho vai pra camada de
 * dados (src/lib/loja.ts), e qualquer aba aberta do site se redesenha sozinha.
 *
 * Os campos são ligados ao conteúdo por um "caminho" (data-k="perfil.nome",
 * "precos.fundos.2.preco"...). Um único listener lê o caminho e grava o valor
 * no lugar certo: adicionar um campo novo é só chamar campo("caminho", "Rótulo").
 *
 * Este arquivo é a versão em TypeScript do painel que já estava aprovado (o
 * HTML dos formulários é montado em texto, com tudo passando por esc()). Os
 * caminhos são dinâmicos, por isso o rascunho é tratado como "any" aqui.
 *
 * ATENÇÃO: o login abaixo é só uma porta de entrada simples pra esta fase
 * (usuário e senha ficam no próprio código, visíveis pra quem procurar).
 * Na etapa do banco de dados, o login passa a ser o Firebase Authentication.
 */
import { PADRAO, OPCOES_FONTES, TAMANHOS_IMAGEM } from "@/lib/conteudo/padrao";
import type { Site } from "@/lib/conteudo/tipos";
import { LOJA_CHAVE, PREVIA_CHAVE, lojaCarregar, lojaPrevia, lojaRestaurarPadrao, lojaSalvar, mesclar } from "@/lib/loja";
import { TEMA_CHAVE, aplicarTema } from "@/lib/tema";
import { copiaProfunda, esc, img, urlSegura } from "@/lib/util";
import { ICONES, iconeSvg } from "@/lib/icones";
import { MESES, dataExtenso, estadoAgenda, estadoSessao } from "@/lib/agenda";
import { embedMusica } from "@/lib/musica";
import { SENHA, USUARIO } from "@/lib/acessoPainel";

const CHAVE_SESSAO = "brupater:painel";

type Opts = {
  tipo?: string;
  ajuda?: string;
  opcoes?: { v: any; t: string }[];
  passo?: number | string;
  linhas?: number;
  lista?: string;
  min?: number;
  max?: number;
  sufixo?: string;
  placeholder?: string;
  numero?: boolean;
  largo?: boolean;
};

export function iniciarPainel(): () => void {
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const raiz = $(".admin-raiz");
  let SITE: Site = lojaCarregar();
  let rascunho: any = copiaProfunda(SITE);
  let sujo = false;
  let abaAtual = "inicio";
  let modoCores: "claro" | "escuro" = "claro"; // qual modo a aba de cores está editando
  const limpar: (() => void)[] = [];
  const ouvir = (alvo: EventTarget, ev: string, fn: (e: any) => void) => {
    alvo.addEventListener(ev, fn);
    limpar.push(() => alvo.removeEventListener(ev, fn));
  };

  /* o painel aplica cores da marca e fontes em si mesmo (pra Bru ver), mas
     NÃO as cores por modo: assim o painel nunca fica ilegível */
  function aplicarNoPainel() {
    aplicarTema({ padrao: PADRAO.aparencia, lojaChave: LOJA_CHAVE, previaChave: PREVIA_CHAVE, temaChave: TEMA_CHAVE, ap: rascunho.aparencia, semModos: true });
  }

  /* ===================== caminho → valor ===================== */
  function get(caminho: string): any {
    return caminho.split(".").reduce((o: any, k) => (o == null ? undefined : o[k]), rascunho);
  }
  function set(caminho: string, valor: any) {
    const ks = caminho.split(".");
    let o = rascunho;
    for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = valor;
  }

  /* ===================== peças de formulário ===================== */
  let uid = 0;
  const novoId = () => "c" + ++uid;

  function secao(titulo: string, sub: string, corpo: string) {
    return '<section class="secao"><header class="secao-cab"><h2>' + titulo + "</h2>" + (sub ? "<p>" + sub + "</p>" : "") + "</header>" + corpo + "</section>";
  }
  function linha(...partes: string[]) {
    return '<div class="linha">' + partes.join("") + "</div>";
  }

  /* opts: tipo (text|textarea|number|date|url|select|check|cor|fator|faixa), ajuda, opcoes [{v,t}], passo, linhas, lista (datalist id) */
  function campo(caminho: string, rotulo: string, opts: Opts = {}) {
    const tipo = opts.tipo || "text", v = get(caminho), id = novoId();
    const ajuda = opts.ajuda ? '<small class="ajuda">' + opts.ajuda + "</small>" : "";
    const k = ' data-k="' + caminho + '" id="' + id + '"';
    if (tipo === "check") {
      return '<label class="check"><input type="checkbox" data-tipo="bool"' + k + (v ? " checked" : "") + "><span>" + rotulo + ajuda + "</span></label>";
    }
    let input: string;
    if (tipo === "textarea") {
      input = "<textarea" + k + ' rows="' + (opts.linhas || 3) + '">' + esc(v) + "</textarea>";
    } else if (tipo === "select") {
      input = "<select" + k + (opts.numero ? ' data-tipo="num"' : "") + ">" + (opts.opcoes || []).map((o) =>
        '<option value="' + esc(o.v) + '"' + (String(o.v) === String(v) ? " selected" : "") + ">" + esc(o.t) + "</option>").join("") + "</select>";
    } else if (tipo === "number") {
      input = '<input type="number" inputmode="decimal" data-tipo="num" step="' + (opts.passo || 1) + '"' + (opts.min != null ? ' min="' + opts.min + '"' : "") + k + ' value="' + esc(v) + '">';
    } else if (tipo === "faixa") {
      /* controle deslizante (ex.: volume de 0 a 100), com o número ao lado */
      input = '<span class="faixa-par"><input type="range" data-tipo="num" data-faixa min="' + (opts.min || 0) + '" max="' + (opts.max || 100) + '" step="' + (opts.passo || 1) + '"' + k +
        ' value="' + esc(v) + '" data-sufixo="' + esc(opts.sufixo || "") + '"><output>' + esc(v) + esc(opts.sufixo || "") + "</output></span>";
    } else if (tipo === "fator") {
      /* o código guarda multiplicador (1.25); a Bru edita em % de acréscimo (25) */
      input = '<input type="number" inputmode="decimal" data-tipo="fator" step="1"' + k + ' value="' + Math.round((Number(v) - 1) * 100) + '">';
    } else if (tipo === "cor") {
      input = '<span class="cor-par"><input type="color" data-tipo="cor"' + k + ' value="' + esc(v) + '"><input type="text" class="cor-hex" data-hex="' + caminho + '" value="' + esc(v) + '" maxlength="7" aria-label="' + esc(rotulo) + ' em hexadecimal"></span>';
    } else {
      input = '<input type="' + (tipo === "date" ? "date" : tipo === "url" ? "url" : "text") + '"' + k + ' value="' + esc(v) + '"' + (opts.lista ? ' list="' + opts.lista + '"' : "") + (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : "") + ">";
    }
    return '<div class="campo' + (opts.largo ? " largo" : "") + '"><label for="' + id + '">' + rotulo + "</label>" + input + ajuda + "</div>";
  }

  function campoImg(caminho: string, rotulo: string, ajuda?: string) {
    const v = get(caminho) || "", ehArquivo = /^data:/.test(v), id = novoId();
    const src = img(v);
    return '<div class="campo campo-img">' +
      '<span class="mini">' + (src ? '<img src="' + esc(src) + '" alt="">' : "<i>sem imagem</i>") + "</span>" +
      '<div class="campo-img-dir"><label for="' + id + '">' + rotulo + "</label>" +
      (ehArquivo
        ? '<p class="ajuda">Imagem enviada do computador. <button type="button" class="link-btn" data-limpar-img="' + caminho + '">trocar por link</button></p>'
        : '<input type="text" id="' + id + '" data-k="' + caminho + '" value="' + esc(v) + '" placeholder="assets/arte.webp ou https://...">') +
      '<span class="img-btns"><button type="button" class="btn mini-btn cheio" data-escolher="' + caminho + '">Escolher das minhas artes</button>' +
      '<label class="btn mini-btn"><input type="file" accept="image/*" data-img="' + caminho + '" hidden>Enviar do computador</label></span>' +
      (ajuda ? '<small class="ajuda">' + ajuda + "</small>" : "") + "</div></div>";
  }

  /* lista editável com subir/descer/remover e botão de adicionar */
  const NOVOS: Record<string, () => any> = {};
  function lista(caminho: string, itemHtml: (it: any, i: number, c: string) => string, novo: () => any, textoAdd: string, vazio?: string) {
    NOVOS[caminho] = novo;
    const itens: any[] = get(caminho) || [];
    const corpo = itens.length ? itens.map((it, i) =>
      '<div class="item"><div class="item-campos">' + itemHtml(it, i, caminho + "." + i) + "</div>" +
      '<div class="item-acoes">' +
      '<button type="button" class="ico-btn" data-mover="-1" data-l="' + caminho + '" data-i="' + i + '" aria-label="Subir"' + (i === 0 ? " disabled" : "") + ">&#8593;</button>" +
      '<button type="button" class="ico-btn" data-mover="1" data-l="' + caminho + '" data-i="' + i + '" aria-label="Descer"' + (i === itens.length - 1 ? " disabled" : "") + ">&#8595;</button>" +
      '<button type="button" class="ico-btn perigo" data-remover data-l="' + caminho + '" data-i="' + i + '" aria-label="Remover">&times;</button>' +
      "</div></div>").join("") : '<p class="vazio">' + (vazio || "Nada aqui ainda.") + "</p>";
    return '<div class="lista">' + corpo + '</div><button type="button" class="btn add" data-add="' + caminho + '">+ ' + textoAdd + "</button>";
  }

  const FOCOS = [
    { v: "50% 20%", t: "Topo" }, { v: "50% 40%", t: "Centro-alto" }, { v: "50% 50%", t: "Centro" },
    { v: "50% 80%", t: "Base" }, { v: "20% 50%", t: "Esquerda" }, { v: "80% 50%", t: "Direita" },
  ];
  function opcoesFoco(caminho: string) {
    const atual = get(caminho);
    const l = FOCOS.slice();
    if (!atual) l.unshift({ v: "", t: "Padrão" });
    else if (!l.some((f) => f.v === atual)) l.unshift({ v: atual, t: "Personalizado (" + atual + ")" });
    return l;
  }

  /* ===================== abas ===================== */
  const NOMES_ESTADO: Record<string, string> = { aberta: "Aberta", esgotado: "Esgotado", embreve: "Em breve", encerrada: "Encerrada", fechada: "Fechada" };
  const TIPOS_ADMIN: Record<string, string> = { abertura: "Abertura", fechamento: "Fechamento", entrega: "Entrega", aviso: "Aviso" };
  const hojeTxt = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

  const ABAS: { id: string; nome: string; icone: string; render: () => string; desc: string; previa: string | null }[] = [
    { id: "inicio", nome: "Início", icone: "estrela", render: abaInicio, desc: "Atalhos pro que você mais usa. Tudo que mudar aparece na prévia ao lado; quando gostar, clique em Salvar.", previa: "/" },
    { id: "agenda", nome: "Agenda e vagas", icone: "agenda", render: abaAgenda, desc: "Abrir e fechar encomendas, marcar vagas preenchidas, datas e a fila.", previa: "/agenda" },
    { id: "encomendas", nome: "Preços e pacotes", icone: "dado", render: abaEncomendas, desc: "Os preços da calculadora, os pacotes de identidade visual e a tabela.", previa: "/encomendas" },
    { id: "galeria", nome: "Minhas artes", icone: "estrela", render: abaGaleria, desc: "Todas as artes do portfólio. Marque \"Destaque\" pra arte passar no topo da página inicial.", previa: "/portfolio" },
    { id: "projetos", nome: "Projetos", icone: "artstation", render: abaProjetos, desc: "Suas coleções (ilustração e identidade visual): capa, texto e imagens.", previa: "/" },
    { id: "cenas", nome: "Textos e imagens", icone: "youtube", render: abaCenas, desc: "O topo de cada página, as faixas em tela cheia e as páginas de aviso (erro e fora do ar).", previa: "/" },
    { id: "perfil", nome: "Sobre mim e contato", icone: "coracao", render: abaPerfil, desc: "Seu nome, foto, frase, WhatsApp, Instagram e a ficha da personagem.", previa: "/" },
    { id: "links", nome: "Links", icone: "link", render: abaLinks, desc: "Os botões de links da página inicial.", previa: "/" },
    { id: "perguntas", nome: "Perguntas", icone: "email", render: abaPerguntas, desc: "As perguntas e respostas da página de encomendas.", previa: "/encomendas" },
    { id: "aparencia", nome: "Cores e visual", icone: "musica", render: abaAparencia, desc: "Cores do modo claro e do escuro, fontes, tela de carregamento e efeitos.", previa: null },
    { id: "backup", nome: "Backup", icone: "loja", render: abaBackup, desc: "Baixar uma cópia de tudo e restaurar.", previa: null },
  ];

  function renderAbas() {
    $("#abas").innerHTML = ABAS.map((a, i) =>
      '<button type="button" class="aba-btn" data-aba="' + a.id + '" aria-current="' + (a.id === abaAtual) + '">' +
      '<span class="aba-n">' + String(i + 1).padStart(2, "0") + "</span>" + iconeSvg(a.icone) + "<span>" + a.nome + "</span></button>").join("");
  }

  function render() {
    const a = ABAS.filter((x) => x.id === abaAtual)[0];
    const y = window.scrollY;
    $("#aba").innerHTML = '<h2 class="aba-titulo t-cinema">' + a.nome + "</h2>" + (a.desc ? '<p class="aba-desc">' + a.desc + "</p>" : "") + a.render();
    window.scrollTo(0, y);
    document.querySelectorAll<HTMLImageElement>(".js-avatar").forEach((el) => { el.src = img(rascunho.perfil.avatar) || img("assets/avatar.webp"); });
  }

  /* tabela de tamanhos de imagem (vem de TAMANHOS_IMAGEM) */
  function tamanhosHtml() {
    return '<div class="tamanhos">' + TAMANHOS_IMAGEM.map((t) =>
      '<div class="tam"><b>' + esc(t.onde) + '</b><span class="tam-medida">' + esc(t.tamanho) + " · " + esc(t.formato) + "</span><small>" + esc(t.dica) + "</small></div>").join("") + "</div>";
  }
  function tam(i: number) { const t = TAMANHOS_IMAGEM[i]; return "Tamanho ideal: <b>" + t.tamanho + "</b>, " + t.formato + ". " + t.dica; }

  /* ----- início: atalhos ----- */
  function abaInicio() {
    const a = rascunho.agenda, ag = estadoAgenda(a);
    let idx = ag.atual ? a.sessoes.indexOf(ag.atual.sessao) : -1;
    if (idx < 0 && ag.proxima) idx = a.sessoes.indexOf(ag.proxima.sessao);
    const ses = idx >= 0 ? a.sessoes[idx] : null, est = ses ? estadoSessao(ses) : null;
    let frase = ag.estado === "aberta" ? "Suas encomendas estão <b>abertas</b>." : ag.estado === "esgotado" ? "Suas vagas estão <b>esgotadas</b>." : "Suas encomendas estão <b>fechadas</b>.";
    if (ag.estado !== "aberta" && ag.proxima) frase += " A <b>" + esc(ag.proxima.sessao.nome) + "</b> abre em " + esc(dataExtenso(ag.proxima.abre)) + ".";
    const atalhos = [
      ["galeria", "estrela", "Trocar as artes do topo", "Marque quais artes passam no carrossel"],
      ["projetos", "artstation", "Projetos", "Criar ou editar uma coleção"],
      ["encomendas", "dado", "Mudar preços", "Ilustração e identidade visual"],
      ["aparencia", "musica", "Mudar as cores", "Modo claro e modo escuro"],
      ["cenas", "youtube", "Textos e fotos das páginas", "Topo, faixas e avisos"],
      ["perfil", "coracao", "WhatsApp e Instagram", "Seus contatos e sua foto"],
    ];
    return '<div class="ola"><img src="' + esc(img(rascunho.perfil.avatar) || img("assets/avatar.webp")) + '" alt=""><div><p class="t-mao">Oi, ' + esc(rascunho.perfil.apelido || "Bru") + '! ✨</p><p>O que você quer mudar hoje?</p></div></div>' +
      '<div class="cartao-agenda estado-' + ag.estado + '">' +
        '<div class="ca-topo"><span class="situacao-chip ch-' + ag.estado + '">' + NOMES_ESTADO[ag.estado] + "</span><p>" + frase + "</p></div>" +
        (ses && est ? '<div class="ca-vagas"><span>' + esc(ses.nome) + ": vagas preenchidas</span>" +
          '<span class="vagas-ctrl"><button type="button" class="ico-btn" data-vaga="' + idx + '" data-d="-1" aria-label="Uma vaga a menos"' + (est.ocupadas <= 0 ? " disabled" : "") + ">&minus;</button>" +
          "<b>" + est.ocupadas + " / " + est.vagas + "</b>" +
          '<button type="button" class="ico-btn" data-vaga="' + idx + '" data-d="1" aria-label="Uma vaga a mais"' + (est.ocupadas >= est.vagas ? " disabled" : "") + ">+</button></span></div>" : "") +
        campo("agenda.pausa", "Pausar tudo agora (férias, imprevisto)", { tipo: "check" }) +
        '<button type="button" class="link-btn" data-ir="agenda">Ver todas as agendas &#8594;</button>' +
      "</div>" +
      '<div class="atalhos">' + atalhos.map((t) =>
        '<button type="button" class="atalho" data-ir="' + t[0] + '">' + iconeSvg(t[1]) + "<b>" + t[2] + "</b><small>" + t[3] + "</small></button>").join("") + "</div>" +
      secao("Tamanho ideal das imagens", "Pra cada lugar do site. Com o tamanho certo, a arte aparece bem enquadrada e nítida.", tamanhosHtml()) +
      '<ol class="passos-ajuda"><li><b>Mude</b> o que quiser em qualquer aba.</li><li><b>Confira</b> na prévia (botão "Prévia" lá em cima).</li><li><b>Salve</b> na barra que aparece embaixo.</li></ol>' +
      '<p class="ajuda nota-banco"><b>Por enquanto</b> o que você salva fica guardado neste navegador, pra testar. Quando o site ganhar o banco de dados (próxima etapa), passa a valer pra todo mundo.</p>';
  }

  /* ----- agenda ----- */
  function abaAgenda() {
    const a = rascunho.agenda;
    const ag = estadoAgenda(a);
    const etapas = a.etapas.map((e: string, i: number) => ({ v: i, t: e }));
    const tipos = Object.keys(TIPOS_ADMIN).map((k) => ({ v: k, t: TIPOS_ADMIN[k] }));
    let agora = ag.estado === "aberta" && ag.atual ? "<b>" + esc(ag.atual.sessao.nome) + "</b> está aberta com " + ag.atual.livres + " de " + ag.atual.vagas + " vagas livres."
      : ag.estado === "esgotado" && ag.atual ? "<b>" + esc(ag.atual.sessao.nome) + "</b> está esgotada."
      : a.pausa ? "A pausa está ligada: o site mostra as encomendas fechadas."
      : "Nenhuma agenda aberta agora.";
    if (ag.estado !== "aberta" && ag.proxima) agora += " A próxima é <b>" + esc(ag.proxima.sessao.nome) + "</b>, em " + esc(dataExtenso(ag.proxima.abre)) + ".";

    return secao("Situação agora", "Calculada sozinha a partir das agendas abaixo. Não precisa trocar nada na mão.",
        '<div class="situacao estado-' + ag.estado + '"><span class="situacao-chip">' + NOMES_ESTADO[ag.estado] + "</span><p>" + agora + "</p></div>" +
        campo("agenda.pausa", "Pausar encomendas agora (fecha tudo, mesmo com vaga sobrando)", { tipo: "check" }) +
        campo("agenda.mostrarContagem", "Mostrar contagem regressiva (\"abre em X dias\") quando estiver fechada", { tipo: "check" })) +
      secao("Agendas de encomenda", "Cada agenda abre numa data e tem um número de vagas. Quando alguém confirmar o pagamento, marque +1 vaga preenchida. Quando enche, o site mostra ESGOTADO sozinho.",
        lista("agenda.sessoes", (x, i, c) => {
          const est = estadoSessao(x);
          return '<div class="sessao-admin">' +
            '<div class="vagas-rapido"><span class="situacao-chip ch-' + est.estado + '">' + NOMES_ESTADO[est.estado] + "</span>" +
            '<span class="vagas-txt">Vagas preenchidas</span>' +
            '<span class="vagas-ctrl"><button type="button" class="ico-btn" data-vaga="' + i + '" data-d="-1" aria-label="Uma vaga a menos"' + (est.ocupadas <= 0 ? " disabled" : "") + ">&minus;</button>" +
            "<b>" + est.ocupadas + " / " + est.vagas + "</b>" +
            '<button type="button" class="ico-btn" data-vaga="' + i + '" data-d="1" aria-label="Uma vaga a mais"' + (est.ocupadas >= est.vagas ? " disabled" : "") + ">+</button></span></div>" +
            linha(campo(c + ".nome", "Nome", { placeholder: "Agenda de novembro" }), campo(c + ".abre", "Abre em", { tipo: "date" }), campo(c + ".vagas", "Total de vagas", { tipo: "number", min: 1 })) +
            campo(c + ".nota", "Observação (opcional)", { placeholder: "Ex.: só busto e meio corpo" }) +
            campo(c + ".encerrada", "Encerrar esta agenda antes de encher", { tipo: "check" }) + "</div>";
        }, () => {
          let d = new Date(); d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
          return { nome: "Agenda de " + MESES[d.getMonth()], abre: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-01", vagas: 4, ocupadas: 0, encerrada: false, nota: "" };
        }, "Adicionar agenda", "Nenhuma agenda criada.")) +
      secao("Textos de cada situação", "A etiqueta inclinada (como o OPEN dos seus posts) e o recado do quadro da agenda.",
        ["aberta", "esgotado", "fechada"].map((k) =>
          '<h3 class="sub-t">' + NOMES_ESTADO[k] + "</h3>" + linha(campo("agenda.etiquetas." + k, "Etiqueta"), campo("agenda.avisos." + k, "Recado", { largo: true }))).join("")) +
      secao("Outras datas", "Entregas, avisos e pausas. As aberturas das agendas já entram no calendário sozinhas.",
        lista("agenda.eventos", (ev, i, c) =>
          linha(campo(c + ".data", "Data", { tipo: "date" }), campo(c + ".tipo", "Tipo", { tipo: "select", opcoes: tipos })) +
          campo(c + ".titulo", "Título") + campo(c + ".desc", "Descrição", { tipo: "textarea", linhas: 2 }),
        () => ({ data: hojeTxt(), tipo: "aviso", titulo: "Nova data", desc: "" }), "Adicionar data", "Nenhuma data marcada.")) +
      secao("Fila de produção", "Mostra em que etapa está cada encomenda. Use nomes genéricos se a pessoa preferir não aparecer.",
        lista("agenda.fila", (f, i, c) =>
          linha(campo(c + ".nome", "Nome"), campo(c + ".detalhe", "Detalhe"), campo(c + ".etapa", "Etapa", { tipo: "select", opcoes: etapas, numero: true })),
        () => ({ nome: "Encomenda " + String(rascunho.agenda.fila.length + 1).padStart(2, "0"), detalhe: "", etapa: 0 }), "Adicionar encomenda na fila", "A fila está vazia.")) +
      secao("Etapas da fila", "A última etapa é considerada \"entregue\".",
        lista("agenda.etapas", (e, i, c) => campo(c, "Etapa " + (i + 1)), () => "Nova etapa", "Adicionar etapa"));
  }

  /* ----- preços ----- */
  function abaEncomendas() {
    return secao("Enquadramentos", "O preço base de cada arte, antes do acabamento e dos extras.",
        lista("precos.enquadramentos", (o, i, c) =>
          linha(campo(c + ".nome", "Nome"), campo(c + ".preco", "Preço (R$)", { tipo: "number", passo: "0.01", min: 0 })) +
          campo(c + ".desc", "Descrição curta") + campoImg(c + ".img", "Imagem de exemplo"),
        () => ({ id: "enq" + Date.now(), nome: "Novo enquadramento", preco: 100, img: "", desc: "" }), "Adicionar enquadramento")) +
      secao("Acabamentos", "Quanto cada acabamento acrescenta sobre o preço base. 0% = preço base.",
        lista("precos.acabamentos", (o, i, c) =>
          linha(campo(c + ".nome", "Nome"), campo(c + ".fator", "Acréscimo (%)", { tipo: "fator" })) +
          campo(c + ".desc", "Descrição curta") + campoImg(c + ".img", "Imagem de exemplo"),
        () => ({ id: "acab" + Date.now(), nome: "Novo acabamento", fator: 1, img: "", desc: "" }), "Adicionar acabamento")) +
      secao("Personagens extras", "",
        linha(campo("precos.personagemExtraPct", "Cada personagem extra (%)", { tipo: "number", min: 0, ajuda: "Sobre o preço do enquadramento." }),
              campo("precos.maxPersonagens", "Máximo de personagens por arte", { tipo: "number", min: 1 }))) +
      secao("Fundos", "Valor fixo somado a cada arte.",
        lista("precos.fundos", (o, i, c) =>
          linha(campo(c + ".nome", "Nome"), campo(c + ".preco", "Preço (R$)", { tipo: "number", passo: "0.01", min: 0 })) + campo(c + ".desc", "Descrição curta"),
        () => ({ id: "fundo" + Date.now(), nome: "Novo fundo", preco: 0, desc: "" }), "Adicionar fundo")) +
      secao("Desconto por quantidade", "A partir de quantas artes no mesmo pedido o desconto vale.",
        lista("precos.descontosVolume", (o, i, c) =>
          linha(campo(c + ".min", "A partir de (artes)", { tipo: "number", min: 1 }), campo(c + ".pct", "Desconto (%)", { tipo: "number", min: 0 })),
        () => ({ min: 10, pct: 15 }), "Adicionar faixa de desconto")) +
      secao("Uso comercial", "Vale só para as ilustrações.", campo("precos.comercialPct", "Acréscimo para uso comercial (%)", { tipo: "number", min: 0 })) +
      secao("As duas categorias", "Os dois botões no alto da área de encomendas.",
        linha(campo("precos.ilustracao.titulo", "Ilustração: nome"), campo("precos.ilustracao.sub", "Ilustração: frase curta")) +
        linha(campo("precos.identidade.titulo", "Identidade visual: nome"), campo("precos.identidade.sub", "Identidade visual: frase curta"))) +
      secao("Pacotes de identidade visual", "Preço 0 aparece como \"sob consulta\" e o valor é combinado na conversa. Sem nenhum pacote, a categoria some do site.",
        lista("precos.identidade.pacotes", (o, i, c) =>
          linha(campo(c + ".nome", "Nome (ex.: Básico)"), campo(c + ".sub", "Subtítulo"), campo(c + ".preco", "Preço (R$)", { tipo: "number", passo: "0.01", min: 0 })) +
          campo(c + ".itens", "O que inclui", { tipo: "textarea", linhas: 2, ajuda: "Separe os itens com · (ponto do meio)." }),
        () => ({ id: "pac" + Date.now(), nome: "Novo pacote", sub: "", preco: 0, itens: "" }), "Adicionar pacote")) +
      secao("Tabela de comissões", "A imagem da sua tabela que aparece embaixo da calculadora.",
        campo("precos.tabela.mostrar", "Mostrar a tabela", { tipo: "check" }) +
        campoImg("precos.tabela.img", "Imagem da tabela") + campo("precos.tabela.legenda", "Frase embaixo da tabela")) +
      secao("Nota do total", "Aparece com * logo abaixo do \"Total estimado\".",
        campo("precos.notaTotal", "Texto da nota", { largo: true })) +
      secao("Regras de pagamento", "Os cartões numerados abaixo da calculadora.",
        lista("precos.regras", (r, i, c) => campo(c, "Regra " + (i + 1)), () => "Nova regra", "Adicionar regra"));
  }

  /* ----- galeria ----- */
  function abaGaleria() {
    const tags: string[] = [];
    rascunho.galeria.forEach((o: any) => { if (o.tag && tags.indexOf(o.tag) < 0) tags.push(o.tag); });
    const visiveis = rascunho.galeria.filter((o: any) => o.visivel !== false).length;
    const dest = rascunho.galeria.filter((o: any) => o.visivel !== false && o.destaque).length;
    return secao("Tamanho ideal das imagens", "", tamanhosHtml()) +
      secao("Galeria do portfólio", visiveis + " de " + rascunho.galeria.length + " artes aparecendo no site · " + dest + " no carrossel do topo. A ordem aqui é a ordem do site (e do carrossel).",
      '<label class="btn cheio upload-varios"><input type="file" accept="image/*" multiple data-galeria-upload hidden>Enviar artes do computador</label>' +
      '<datalist id="tags-galeria">' + tags.map((t) => '<option value="' + esc(t) + '">').join("") + "</datalist>" +
      lista("galeria", (o, i, c) =>
        '<div class="obra-admin' + (o.visivel === false ? " oculta" : "") + '">' + campoImg(c + ".img", "Arte") +
          linha(campo(c + ".titulo", "Título"), campo(c + ".tag", "Categoria", { lista: "tags-galeria", ajuda: "Vira um filtro no site." })) +
          campo(c + ".visivel", "Aparecer no site", { tipo: "check" }) +
          campo(c + ".destaque", "Destaque no carrossel do topo da página inicial", { tipo: "check" }) +
          (o.destaque ? '<p class="ajuda dica-tam">' + tam(0) + "</p>" +
            campo(c + ".foco", "Parte em destaque no topo", { tipo: "select", opcoes: opcoesFoco(c + ".foco"), ajuda: "Quando a arte cobre a tela toda, é essa parte que aparece." }) +
            campoImg(c + ".imgCelular", "Versão de celular (opcional)", tam(1)) : "") + "</div>",
      () => ({ img: "", titulo: "Nova arte", tag: tags[0] || "Personagens", visivel: true, destaque: false }), "Adicionar arte por link"));
  }

  /* ----- projetos (coleções) ----- */
  function abaProjetos() {
    const cats = ["Ilustração", "Identidade visual"];
    rascunho.projetos.forEach((p: any) => { if (p.categoria && cats.indexOf(p.categoria) < 0) cats.push(p.categoria); });
    const opGaleria = '<option value="">+ Adicionar arte da galeria…</option>' + rascunho.galeria.filter((o: any) => o.img && !/^data:/.test(o.img)).map((o: any) =>
      '<option value="' + esc(o.img) + '">' + esc(o.titulo || o.img) + "</option>").join("");
    return secao("Seção de projetos", "Na página inicial aparece só a capa de cada projeto. Ao clicar, abre a página do projeto com todas as imagens.",
        linha(campo("secaoProjetos.titulo", "Título da seção"), campo("secaoProjetos.sub", "Frase curta", { largo: true }))) +
      secao("Projetos", "A ordem aqui é a ordem da página inicial (os 2 primeiros aparecem maiores no computador). A categoria vira um filtro quando houver mais de uma.",
        '<datalist id="cats-projetos">' + cats.map((c) => '<option value="' + esc(c) + '">').join("") + "</datalist>" +
        lista("projetos", (p, i, c) => {
          const url = "/projeto?p=" + encodeURIComponent(p.id || "");
          return '<div class="obra-admin' + (p.visivel === false ? " oculta" : "") + '">' +
            linha(campo(c + ".titulo", "Nome do projeto"), campo(c + ".categoria", "Categoria", { lista: "cats-projetos" })) +
            campoImg(c + ".capa", "Capa (aparece na página inicial)", tam(4)) +
            campo(c + ".foco", "Parte da capa em destaque", { tipo: "select", opcoes: opcoesFoco(c + ".foco") }) +
            campo(c + ".resumo", "Linha curta embaixo do nome na capa") +
            campo(c + ".texto", "Texto do projeto", { tipo: "textarea", linhas: 4, ajuda: "Aparece no topo da página do projeto. Pule uma linha pra começar outro parágrafo." }) +
            linha(campo(c + ".id", "Endereço", { ajuda: 'Só letras minúsculas, números e hífen. Link: <a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url) + "</a>" }),
                  campo(c + ".visivel", "Aparecer no site", { tipo: "check" })) +
            '<h3 class="sub-t">Imagens do projeto (' + (p.imagens || []).length + ")</h3>" +
            '<div class="campo"><select data-add-galeria="' + c + '.imagens" aria-label="Adicionar arte da galeria">' + opGaleria + "</select></div>" +
            lista(c + ".imagens", (im, j, ci) => campoImg(ci + ".img", "Imagem " + (j + 1)) + campo(ci + ".legenda", "Legenda (opcional)"),
              () => ({ img: "", legenda: "" }), "Adicionar imagem por link ou do computador", "Nenhuma imagem ainda.") +
            "</div>";
        }, () => ({ id: "projeto-" + Date.now().toString(36), titulo: "Novo projeto", categoria: "Identidade visual", visivel: true, capa: "", foco: "50% 40%", resumo: "", texto: "", imagens: [] }),
        "Adicionar projeto", "Nenhum projeto ainda."));
  }

  /* ----- textos e imagens ----- */
  function abaCenas() {
    const nomes: Record<string, string> = { portfolio: "Portfólio", agenda: "Agenda", encomendas: "Encomendas" };
    return secao("Topo da página inicial (carrossel)", "As artes que passam no topo são as marcadas como \"Destaque\" na aba Minhas artes, na mesma ordem. Aqui ficam só os textos.",
        campo("cenas.abertura.modo", "Como as artes aparecem", { tipo: "select", opcoes: [{ v: "inteira", t: "Arte inteira, sem corte, centralizada" }, { v: "fundo", t: "Cobrindo a tela toda (recomendado; corta um pouco da arte)" }], ajuda: "Cobrindo a tela, cada arte mostra a parte escolhida em \"Parte em destaque no topo\" (aba Minhas artes)." }) +
        campo("cenas.abertura.kicker", "Linha pequena no alto") +
        campo("cenas.abertura.legenda", "Texto curto abaixo da frase", { tipo: "textarea", linhas: 2 })) +
      ["portfolio", "agenda", "encomendas"].map((k) => {
        const c = "cenas.paginas." + k;
        return secao("Topo da página " + nomes[k], "A faixa de cinema no alto da página " + nomes[k] + " e o cartão dela na página inicial.",
          campoImg(c + ".img", "Imagem", tam(2)) +
          campo(c + ".foco", "Parte da imagem em destaque", { tipo: "select", opcoes: opcoesFoco(c + ".foco") }) +
          linha(campo(c + ".titulo", "Título"), campo(c + ".sub", "Frase curta", { largo: true })));
      }).join("") +
      secao("Interlúdio 1", "A faixa em tela cheia depois da ficha, na página inicial.",
        campoImg("cenas.interludio1.img", "Imagem", tam(3)) +
        campo("cenas.interludio1.foco", "Parte da imagem em destaque", { tipo: "select", opcoes: opcoesFoco("cenas.interludio1.foco") }) +
        campo("cenas.interludio1.frase", "Frase grande") + campo("cenas.interludio1.credito", "Legenda pequena")) +
      secao("Páginas de aviso", "Aparecem quando alguém abre um endereço que não existe (404), quando dá erro, ou quando o site está fora do ar.",
        [["naoEncontrada", "Página não existe (404)", "/pagina-que-nao-existe"], ["erro", "Algo deu errado", "/erro"], ["manutencao", "Site fora do ar (manutenção)", "/manutencao"]].map((k) => {
          const c = "paginasAviso." + k[0];
          return '<h3 class="sub-t">' + k[1] + ' · <a href="' + k[2] + '" target="_blank" rel="noopener">ver &#8599;</a></h3>' +
            linha(campo(c + ".rotulo", "Linha pequena"), campo(c + ".titulo", "Título")) + campo(c + ".texto", "Texto", { tipo: "textarea", linhas: 2 }) +
            linha(campo(c + ".botao", "Texto do botão")) + campoImg(c + ".img", "Imagem", tam(6));
        }).join("")) +
      secao("Interlúdio 2", "A faixa em tela cheia no fim da página inicial.",
        campoImg("cenas.interludio2.img", "Imagem", tam(3)) +
        campo("cenas.interludio2.foco", "Parte da imagem em destaque", { tipo: "select", opcoes: opcoesFoco("cenas.interludio2.foco") }) +
        campo("cenas.interludio2.frase", "Frase grande") + campo("cenas.interludio2.credito", "Legenda pequena"));
  }

  /* mostra pra Bru se o link de música foi reconhecido */
  function musicaDetectada() {
    const url = (rascunho.perfil.trilha || {}).url;
    if (!url) return "Sem link: o mini player fica escondido.";
    const e = embedMusica(url);
    if (!e) return "&#9888; Não reconheci esse link. Use um link de playlist do YouTube, do Spotify ou do SoundCloud.";
    return "&#10003; Reconhecido: <b>" + esc(e.servico) + "</b> (" + esc(e.tipo) + ")" + (e.loop ? ", repete sem parar." : ". Esse serviço não repete sozinho.");
  }

  /* ----- perfil ----- */
  function abaPerfil() {
    return secao("Perfil", "",
        campoImg("perfil.avatar", "Foto de perfil (avatar)", tam(7)) +
        linha(campo("perfil.nome", "Nome completo"), campo("perfil.apelido", "Apelido")) +
        linha(campo("perfil.titulo", "Título"), campo("perfil.handle", "Arroba exibido")) +
        campo("perfil.frase", "Frase de destaque", { ajuda: "Aparece na abertura, em letra de mão." }) +
        campo("perfil.assinatura", "Assinatura do rodapé")) +
      secao("Contato e WhatsApp", "Com WhatsApp preenchido, o pedido vai direto pro WhatsApp com o resumo escrito e aparece o botão flutuante no cantinho da tela. Se ficar vazio, o pedido vai pela DM do Instagram (com o resumo copiado).",
        linha(campo("perfil.instagram", "Usuário do Instagram", { placeholder: "_.brupater" }),
              campo("perfil.whatsapp", "WhatsApp com DDD", { placeholder: "5511999999999", ajuda: "Só números, com 55 + DDD." })) +
        campo("perfil.whatsappFlutuante", "Mostrar o botão flutuante do WhatsApp", { tipo: "check" }) +
        linha(campo("perfil.whatsappBotao", "Texto do botão flutuante"), campo("perfil.whatsappMensagem", "Mensagem que já vem escrita", { largo: true }))) +
      secao("Trilha sonora (mini player)", "Um botão no canto esquerdo da tela abre um player pequeno com a sua playlist. A música só começa quando a pessoa clica (regra dos navegadores) e continua tocando enquanto ela navega pelas páginas.",
        campo("perfil.trilha.mostrar", "Mostrar o mini player no site", { tipo: "check" }) +
        campo("perfil.trilha.url", "Link da playlist", { tipo: "url", placeholder: "https://www.youtube.com/playlist?list=...",
          ajuda: "<b>Recomendado: playlist do YouTube</b> (ou YouTube Music): toca as músicas inteiras pra todo mundo e repete sem parar. Também aceita Spotify (quem não está logado no Spotify ouve só 30 segundos de cada música, e não repete sozinho) e SoundCloud." }) +
        '<p class="ajuda dica-tam" id="mu-detectado">' + musicaDetectada() + "</p>" +
        linha(campo("perfil.trilha.rotulo", "Nome no botão do canto"),
              campo("perfil.trilha.volume", "Volume inicial da música", { tipo: "faixa", min: 0, max: 100, passo: 1, sufixo: "%", ajuda: "Com quanto de volume a música começa. Quem visita ainda pode aumentar ou diminuir no próprio player." }))) +
      secao("Ficha da personagem (pôster)", "A seção no estilo do seu pôster Oásis.",
        linha(campoImg("sobre.retrato", "Retrato do topo"), campoImg("sobre.imagem", "Arte grande do pôster")) +
        campo("sobre.palavra", "Palavra gigante", { ajuda: "Curta funciona melhor (até ~8 letras)." }) +
        campo("sobre.texto", "Sobre você", { tipo: "textarea", linhas: 4 }) +
        campo("sobre.lema", "Frase de efeito", { ajuda: "A última frase fica rosa." }) +
        '<h3 class="sub-t">Itens da ficha</h3>' +
        lista("sobre.ficha", (f, i, c) =>
          linha(campo(c + ".rotulo", "Categoria"), campo(c + ".valor", "Itens", { ajuda: "Separe com · (ponto do meio)", largo: true })),
        () => ({ rotulo: "Nova categoria", valor: "" }), "Adicionar categoria") +
        linha(campo("sobre.extra.rotulo", "Linha extra: categoria"), campo("sobre.extra.valor", "Linha extra: itens", { largo: true })));
  }

  /* ----- links ----- */
  function abaLinks() {
    const icones = Object.keys(ICONES).map((k) => ({ v: k, t: ICONES[k].nome }));
    return secao("Links da página inicial", "Para levar a uma página do próprio site, use /encomendas, /agenda ou /portfolio. Para uma parte da página inicial, use #ficha ou #projetos.",
      lista("links", (l, i, c) =>
        '<div class="link-admin"><span class="link-ico">' + iconeSvg(l.icone) + "</span><div>" +
          linha(campo(c + ".nome", "Nome"), campo(c + ".icone", "Ícone", { tipo: "select", opcoes: icones })) +
          campo(c + ".desc", "Descrição") + campo(c + ".url", "Link") + campo(c + ".visivel", "Aparecer no site", { tipo: "check" }) + "</div></div>",
      () => ({ nome: "Novo link", desc: "", url: "https://", icone: "link", visivel: true }), "Adicionar link"));
  }

  /* ----- perguntas ----- */
  function abaPerguntas() {
    return secao("A Bru responde", "As perguntas frequentes do fim do site.",
      lista("faq", (f, i, c) => campo(c + ".p", "Pergunta") + campo(c + ".r", "Resposta", { tipo: "textarea", linhas: 3 }),
        () => ({ p: "Nova pergunta?", r: "" }), "Adicionar pergunta"));
  }

  /* ----- aparência ----- */
  const PALETAS: Record<string, Record<string, string>> = {
    "Pôster rosa (padrão)": PADRAO.aparencia.cores as unknown as Record<string, string>,
    "Neon das comissões": { rosa: "#D96BFF", poster: "#9B5CF6", vinho: "#3B1F5C", violeta: "#C79BFF", teal: "#5ED6E0", papel: "#EEE8F2", noite: "#0B0912" },
    "Brasa da cavaleira": { rosa: "#E8833A", poster: "#B8562E", vinho: "#5E2A16", violeta: "#F2C46D", teal: "#7FB89A", papel: "#F1E6DA", noite: "#0F0A07" },
    "Água turquesa": { rosa: "#3FD0BE", poster: "#2F8F9D", vinho: "#173B4A", violeta: "#A9B8FF", teal: "#E8347F", papel: "#E6EFEE", noite: "#081012" },
  };
  const NOMES_CORES: Record<string, string[]> = {
    rosa: ["Rosa choque", "Botões, etiquetas e destaques"],
    poster: ["Rosa do pôster", "Títulos da ficha e números"],
    vinho: ["Vinho", "Tons de fundo misturados"],
    violeta: ["Violeta neon", "Estrelas das vagas e brilho da agenda"],
    teal: ["Turquesa", "Etapas da fila e entregas"],
    papel: ["Papel", "Fundo das seções impressas"],
    noite: ["Noite", "Fundo das partes escuras"],
  };
  const NOMES_MODO: Record<string, string[]> = {
    fundo: ["Fundo do site", "A cor de trás de tudo"],
    secao: ["Fundo das faixas", "A faixa dos projetos e áreas alternadas"],
    texto: ["Letras", "Títulos e textos principais"],
    textoSuave: ["Letras suaves", "Legendas e textos menores"],
    barra: ["Barra do topo", "O menu, quando a pessoa rola a página"],
    barraTexto: ["Letras da barra do topo", "Os nomes do menu"],
    rodape: ["Rodapé", "A faixa do fim da página"],
    rodapeTexto: ["Letras do rodapé", ""],
  };
  function abaAparencia() {
    const ap = rascunho.aparencia;
    const paletas = '<div class="paletas">' + Object.keys(PALETAS).map((nome) => {
      const p = PALETAS[nome];
      return '<button type="button" class="paleta" data-paleta="' + esc(nome) + '"><span class="paleta-cores">' +
        ["noite", "vinho", "poster", "rosa", "violeta", "teal", "papel"].map((k) => '<i style="background:' + p[k] + '"></i>').join("") +
        "</span><b>" + esc(nome) + "</b></button>";
    }).join("") + "</div>";
    const m = modoCores, mo = ap.modos[m];
    /* mini prévia do modo: fundo, barra, letras e botão, pra ver na hora */
    const amostra = '<div class="amostra-modo" style="background:' + esc(mo.fundo) + ";color:" + esc(mo.texto) + '">' +
      '<div class="am-barra" style="background:' + esc(mo.barra) + ";color:" + esc(mo.barraTexto) + '"><b>' + esc(rascunho.perfil.nome) + "</b><span>Início · Portfólio · Agenda</span></div>" +
      '<div class="am-corpo"><p class="am-titulo">Projetos</p><p style="color:' + esc(mo.textoSuave) + '">Texto menor, legendas e descrições.</p>' +
      '<span class="am-btn" style="background:' + esc(ap.cores.rosa) + '">Fazer encomenda</span></div>' +
      '<div class="am-faixa" style="background:' + esc(mo.secao) + '"></div>' +
      '<div class="am-rodape" style="background:' + esc(mo.rodape) + ";color:" + esc(mo.rodapeTexto) + '">Rodapé · Site desenvolvido pela TRIRREME</div></div>';
    const coresModo = '<div class="grade-cores">' + Object.keys(NOMES_MODO).map((k) =>
      campo("aparencia.modos." + m + "." + k, NOMES_MODO[k][0], { tipo: "cor", ajuda: NOMES_MODO[k][1] })).join("") + "</div>";
    const cores = '<div class="grade-cores">' + Object.keys(NOMES_CORES).map((k) =>
      campo("aparencia.cores." + k, NOMES_CORES[k][0], { tipo: "cor", ajuda: NOMES_CORES[k][1] })).join("") + "</div>";
    const fonte = (papel: "cinema" | "poster" | "mao", rotulo: string, amostraTxt: string, classe: string) => {
      const atual = ap.fontes[papel];
      return '<div class="fonte-escolha">' + campo("aparencia.fontes." + papel, rotulo, { tipo: "select", opcoes: OPCOES_FONTES[papel].map((f) => ({ v: f, t: f })) }) +
        '<p class="amostra ' + classe + '" style="font-family:\'' + esc(atual) + '\'">' + amostraTxt + "</p></div>";
    };
    return secao("Cores de cada modo", "O site tem modo claro e modo escuro (o botão de sol/lua no topo). Escolha qual modo você quer pintar: a mudança vale só pra ele.",
        '<div class="seg" role="group" aria-label="Qual modo editar">' +
          '<button type="button" data-modo-cores="claro" aria-pressed="' + (m === "claro") + '">&#9728; Modo claro</button>' +
          '<button type="button" data-modo-cores="escuro" aria-pressed="' + (m === "escuro") + '">&#9790; Modo escuro</button></div>' +
        '<div class="modo-edicao">' + amostra + coresModo + "</div>" +
        '<button type="button" class="btn mini-btn" data-cores-padrao>Voltar às cores originais do modo ' + m + "</button>") +
      secao("Como o site abre", "",
        linha(campo("aparencia.tema", "Modo da primeira visita", { tipo: "select", opcoes: [{ v: "claro", t: "Claro" }, { v: "escuro", t: "Escuro" }, { v: "auto", t: "Igual ao celular/computador da pessoa" }] })) +
        campo("aparencia.botaoTema", "Mostrar o botão sol/lua no topo (quem visita escolhe claro ou escuro)", { tipo: "check" }) +
        campo("aparencia.carregamento", "Tela de carregamento com abertura de cinema", { tipo: "check", ajuda: "Na primeira visita aparece seu nome e a barrinha; depois as faixas abrem como uma tela de cinema." })) +
      secao("Paletas prontas", "Um clique troca as cores da marca e os fundos dos dois modos. Dá pra ajustar uma por uma depois.", paletas) +
      secao("Cores da marca", "Valem nos dois modos: botões, etiquetas, destaques e as partes escuras.", cores) +
      secao("Fontes", "",
        fonte("cinema", "Fonte de cinema (títulos grandes)", "Brunna Paternostro", "am-cinema") +
        fonte("poster", "Fonte de pôster (ficha e rótulos)", "Força e ódio", "am-poster") +
        fonte("mao", "Fonte de mão (frases e anotações)", "Colors and lines bring your ideas to life.", "am-mao")) +
      secao("Efeitos", "",
        campo("aparencia.grao", "Grão de filme por cima do site", { tipo: "check" }) +
        linha(campo("aparencia.movimento", "Animações", { tipo: "select", opcoes: [{ v: "normal", t: "Normais" }, { v: "suave", t: "Suaves" }, { v: "desligado", t: "Desligadas" }] })));
  }

  /* ----- backup ----- */
  function abaBackup() {
    const kb = Math.round(JSON.stringify(rascunho).length / 1024);
    return secao("Cópia de segurança", "Baixe um arquivo com tudo o que está no site (textos, preços, agenda, imagens enviadas). Guarde antes de grandes mudanças.",
        '<div class="botoes"><button type="button" class="btn cheio" data-exportar>Baixar cópia (.json)</button>' +
        '<label class="btn"><input type="file" accept="application/json,.json" data-importar hidden>Restaurar de um arquivo</label></div>') +
      secao("Espaço usado", "", '<p class="uso"><b>' + kb + " KB</b> de cerca de 5.000 KB. Imagens enviadas do computador ocupam mais espaço que imagens por link.</p>") +
      secao("Voltar ao começo", "Apaga todas as mudanças e volta o site para a versão entregue.",
        '<button type="button" class="btn perigo" data-restaurar>Restaurar versão original</button>');
  }

  /* ===================== mudanças ===================== */
  function marcarSujo() {
    agendarPrevia();
    sujo = true;
    $("#salvar").classList.add("ativa");
    $("#salvar").setAttribute("aria-hidden", "false");
  }
  function limparSujo() {
    sujo = false;
    $("#salvar").classList.remove("ativa");
    $("#salvar").setAttribute("aria-hidden", "true");
  }
  let timerToast: number | undefined;
  function toast(txt: string, erro?: boolean) {
    const t = $("#toast");
    t.textContent = txt;
    t.className = "aviso-flutuante visivel" + (erro ? " erro" : "");
    window.clearTimeout(timerToast);
    timerToast = window.setTimeout(() => { t.className = "aviso-flutuante"; }, erro ? 6000 : 2800);
  }

  /* a galeria guarda duas versões (mini para a grade, img para tela cheia).
     Se a Bru trocar a imagem, a mini antiga e o tamanho deixam de valer. */
  function limparMiniatura(caminho: string) {
    if (caminho === "precos.tabela.img") { delete rascunho.precos.tabela.w; delete rascunho.precos.tabela.h; return; }
    const m = /^galeria\.(\d+)\.img$/.exec(caminho);
    if (!m) return;
    const o = rascunho.galeria[Number(m[1])];
    if (o) { o.mini = ""; delete o.w; delete o.h; }
  }

  function aoMudarCampo(el: HTMLInputElement) {
    const caminho = el.dataset.k!, tipo = el.dataset.tipo;
    let v: any;
    if (el.type === "radio" && !el.checked) return;
    if (tipo === "bool") v = el.checked;
    else if (tipo === "num") v = el.value === "" ? 0 : Number(el.value);
    else if (tipo === "fator") v = Math.round((1 + (Number(el.value) || 0) / 100) * 1000) / 1000;
    else v = el.value;
    set(caminho, v);
    limparMiniatura(caminho);
    marcarSujo();
    if (tipo === "cor") { const hex = document.querySelector<HTMLInputElement>('[data-hex="' + caminho + '"]'); if (hex) hex.value = v; }
    if (el.hasAttribute("data-faixa")) { const out = el.nextElementSibling; if (out) out.textContent = el.value + (el.dataset.sufixo || ""); }
    if (caminho.indexOf("aparencia.") === 0) aplicarNoPainel();
    if (el.hasAttribute("data-rerender") || el.tagName === "SELECT" || tipo === "bool" || caminho.indexOf("aparencia.fontes") === 0) render();
  }

  /* imagens enviadas: reduz pra no máximo `max` px e vira texto (data URL),
     pra caber no armazenamento do navegador */
  const webpOk = (() => { try { return document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0; } catch { return false; } })();
  function processarImagem(arquivo: File, max: number): Promise<string> {
    return new Promise((ok, falha) => {
      const url = URL.createObjectURL(arquivo), im = new Image();
      im.onload = () => {
        const fator = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * fator); c.height = Math.round(im.height * fator);
        c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok(c.toDataURL(webpOk ? "image/webp" : "image/jpeg", 0.82));
      };
      im.onerror = () => { URL.revokeObjectURL(url); falha(new Error("Não consegui abrir essa imagem.")); };
      im.src = url;
    });
  }

  function baixar(nome: string, texto: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
    a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function ligarEventos() {
    const aba = $("#aba");

    ouvir(aba, "input", (e: Event) => {
      const el = e.target as HTMLInputElement;
      if (el.dataset.k && el.tagName !== "SELECT" && el.type !== "checkbox" && el.type !== "radio") aoMudarCampo(el);
      if (el.dataset.hex && /^#[0-9a-f]{6}$/i.test(el.value)) {
        set(el.dataset.hex, el.value); marcarSujo(); aplicarNoPainel();
        const cor = document.querySelector<HTMLInputElement>('[data-k="' + el.dataset.hex + '"]'); if (cor) cor.value = el.value;
      }
    });
    ouvir(aba, "change", (e: Event) => {
      const el = e.target as HTMLInputElement;
      if (el.dataset.k && (el.tagName === "SELECT" || el.type === "checkbox" || el.type === "radio")) aoMudarCampo(el);
      /* campos de texto: ao sair do campo, redesenha pra atualizar miniaturas e títulos */
      else if (el.dataset.k && /^aparencia\.modos\./.test(el.dataset.k)) render();
      else if (el.dataset.k === "perfil.trilha.url") { const d = document.getElementById("mu-detectado"); if (d) d.innerHTML = musicaDetectada(); }
      else if (el.dataset.k && (/\.img$|avatar$|retrato$|imagem$|capa$/.test(el.dataset.k) || /^agenda\.sessoes\.\d+\.(abre|vagas)$/.test(el.dataset.k))) render();

      if (el.dataset.img && el.files && el.files[0]) {
        const grande = /^cenas\.|^projetos\./.test(el.dataset.img);
        const caminho = el.dataset.img;
        processarImagem(el.files[0], grande ? 1800 : 1200).then((dataUrl) => {
          set(caminho, dataUrl); limparMiniatura(caminho); marcarSujo(); render(); toast("Imagem carregada. Lembre de salvar.");
        }).catch((err: Error) => toast(err.message, true));
      }
      if (el.dataset.addGaleria && el.value) {
        get(el.dataset.addGaleria).push({ img: el.value, legenda: "" }); marcarSujo(); render(); toast("Arte adicionada ao projeto.");
        return;
      }
      if (el.hasAttribute("data-galeria-upload") && el.files && el.files.length) {
        const arquivos = Array.from(el.files);
        Promise.all(arquivos.map((f) => processarImagem(f, 1200))).then((urls) => {
          urls.forEach((u, i) => {
            rascunho.galeria.unshift({ img: u, titulo: arquivos[i].name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), tag: "Personagens", visivel: true });
          });
          marcarSujo(); render(); toast(urls.length + (urls.length === 1 ? " arte adicionada" : " artes adicionadas") + " no topo da galeria.");
        }).catch((err: Error) => toast(err.message, true));
      }
      if (el.hasAttribute("data-importar") && el.files && el.files[0]) {
        el.files[0].text().then((txt) => {
          const dados = JSON.parse(txt);
          if (!dados || !dados.perfil || !dados.precos) throw new Error("Esse arquivo não parece uma cópia do site.");
          rascunho = mesclar(copiaProfunda(PADRAO), dados);
          marcarSujo(); aplicarNoPainel(); render(); toast("Cópia carregada. Confira e clique em Salvar.");
        }).catch((err: Error) => toast("Não deu pra restaurar: " + err.message, true));
      }
    });

    ouvir(aba, "click", (e: Event) => {
      const alvo = e.target as HTMLElement;
      let b: HTMLElement | null;
      if ((b = alvo.closest("[data-ir]"))) { irPara(b.dataset.ir!); return; }
      if ((b = alvo.closest("[data-modo-cores]"))) {
        modoCores = b.dataset.modoCores as "claro" | "escuro";
        previa.tema = modoCores === "escuro" ? "dark" : "light";
        carregarPrevia(); render(); return;
      }
      if ((b = alvo.closest("[data-cores-padrao]"))) {
        rascunho.aparencia.modos[modoCores] = copiaProfunda(PADRAO.aparencia.modos[modoCores]);
        marcarSujo(); render(); toast("Cores originais do modo " + modoCores + " de volta. Lembre de salvar."); return;
      }
      if ((b = alvo.closest("[data-escolher]"))) { abrirEscolha(b.dataset.escolher!); return; }
      if ((b = alvo.closest("[data-add]"))) {
        get(b.dataset.add!).push(NOVOS[b.dataset.add!]()); marcarSujo(); render();
        return;
      }
      if ((b = alvo.closest("[data-mover]"))) {
        const arr = get(b.dataset.l!), i = Number(b.dataset.i), j = i + Number(b.dataset.mover);
        if (j < 0 || j >= arr.length) return;
        const t = arr[i]; arr[i] = arr[j]; arr[j] = t; marcarSujo(); render(); return;
      }
      if ((b = alvo.closest("[data-remover]"))) {
        if (!confirm("Remover este item?")) return;
        get(b.dataset.l!).splice(Number(b.dataset.i), 1); marcarSujo(); render(); return;
      }
      if ((b = alvo.closest("[data-vaga]"))) {
        const ses = rascunho.agenda.sessoes[Number(b.dataset.vaga)];
        ses.ocupadas = Math.max(0, Math.min(Number(ses.vagas) || 0, (Number(ses.ocupadas) || 0) + Number(b.dataset.d)));
        marcarSujo(); render(); return;
      }
      if ((b = alvo.closest("[data-limpar-img]"))) { set(b.dataset.limparImg!, ""); limparMiniatura(b.dataset.limparImg!); marcarSujo(); render(); return; }
      if ((b = alvo.closest("[data-paleta]"))) {
        const pal = PALETAS[b.dataset.paleta!];
        rascunho.aparencia.cores = copiaProfunda(pal);
        const mc = rascunho.aparencia.modos;
        mc.claro.fundo = mc.claro.barra = pal.papel;
        mc.escuro.fundo = mc.escuro.barra = pal.noite;
        marcarSujo(); aplicarNoPainel(); render();
        toast("Paleta aplicada no painel. Salve pra levar pro site."); return;
      }
      if (alvo.closest("[data-exportar]")) {
        baixar("site-brupater-" + hojeTxt() + ".json", JSON.stringify(rascunho, null, 2)); return;
      }
      if (alvo.closest("[data-restaurar]")) {
        if (!confirm("Isso apaga todas as mudanças feitas no painel e volta o site para a versão original. Continuar?")) return;
        lojaRestaurarPadrao(); SITE = lojaCarregar(); rascunho = copiaProfunda(SITE); limparSujo(); aplicarNoPainel(); render();
        toast("Site restaurado para a versão original.");
      }
    });

    ouvir($("#abas"), "click", (e: Event) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-aba]");
      if (!b) return;
      irPara(b.dataset.aba!);
    });

    const salvar = () => {
      try {
        lojaSalvar(rascunho);
        SITE = copiaProfunda(rascunho);
        limparSujo(); agendarPrevia();
        toast("Salvo! Neste navegador o site já mostra as mudanças.");
      } catch (err) { toast((err as Error).message, true); }
    };
    ouvir($("#salvar-btn"), "click", salvar);
    ouvir($("#descartar"), "click", () => {
      rascunho = copiaProfunda(SITE); limparSujo(); aplicarNoPainel(); render(); agendarPrevia(); toast("Mudanças descartadas.");
    });
    ouvir(document, "keydown", (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !$("#painel").hidden) { e.preventDefault(); if (sujo) salvar(); }
    });
    ouvir(window, "beforeunload", (e: BeforeUnloadEvent) => { if (sujo) { e.preventDefault(); e.returnValue = ""; } });
  }

  /* ===================== navegar entre abas ===================== */
  function irPara(id: string) {
    if (!ABAS.some((a) => a.id === id)) return;
    abaAtual = id;
    const a = ABAS.filter((x) => x.id === id)[0];
    if (a.previa && a.previa !== previa.pagina) { previa.pagina = a.previa; carregarPrevia(); }
    renderAbas(); render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ===================== prévia ao vivo =====================
     O rascunho vai pra PREVIA_CHAVE e o site, aberto num quadro com
     ?previa=1, redesenha sozinho a cada mudança (evento storage). */
  const previa = { pagina: "/", tema: "light", aparelho: "celular", aberta: false };
  let timerPrevia: number | undefined;
  function agendarPrevia() {
    window.clearTimeout(timerPrevia);
    timerPrevia = window.setTimeout(() => {
      if (!lojaPrevia(rascunho)) toast("A prévia não atualizou: as imagens enviadas estão ocupando muito espaço.", true);
    }, 250);
  }
  function carregarPrevia() {
    const f = $<HTMLIFrameElement>("#previa-frame");
    if (!f || !previa.aberta) return;
    lojaPrevia(rascunho);
    f.src = previa.pagina + (previa.pagina.indexOf("?") < 0 ? "?" : "&") + "previa=1&tema=" + previa.tema;
    pintarPrevia();
  }
  function pintarPrevia() {
    const box = $("#previa");
    if (!box) return;
    box.hidden = !previa.aberta;
    raiz.classList.toggle("com-previa", previa.aberta);
    $("#previa-btn").setAttribute("aria-pressed", String(previa.aberta));
    $<HTMLSelectElement>("#previa-pagina").value = previa.pagina;
    document.querySelectorAll<HTMLElement>("[data-previa-tema]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.previaTema === previa.tema)));
    document.querySelectorAll<HTMLElement>("[data-previa-aparelho]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.previaAparelho === previa.aparelho)));
    box.dataset.aparelho = previa.aparelho;
    escalarPrevia();
  }
  /* no modo "computador", o site (1280px) é encolhido pra caber no quadro */
  function escalarPrevia() {
    const tela = $("#previa-tela"), f = $("#previa-frame");
    if (!tela || !f) return;
    const larg = previa.aparelho === "computador" ? 1280 : 390;
    const fator = Math.min(1, tela.clientWidth / larg);
    f.style.width = larg + "px";
    f.style.height = tela.clientHeight / fator + "px";
    f.style.transform = "scale(" + fator + ")";
  }
  function ligarPrevia() {
    ouvir($("#previa-btn"), "click", () => {
      previa.aberta = !previa.aberta;
      try { localStorage.setItem("brupater:painel-previa", previa.aberta ? "1" : "0"); } catch { /* sem armazenamento */ }
      if (previa.aberta) carregarPrevia(); else pintarPrevia();
    });
    ouvir($("#previa-fechar"), "click", () => { $("#previa-btn").click(); });
    ouvir($("#previa-pagina"), "change", (e: Event) => { previa.pagina = (e.target as HTMLSelectElement).value; carregarPrevia(); });
    ouvir($("#previa"), "click", (e: Event) => {
      let b = (e.target as HTMLElement).closest<HTMLElement>("[data-previa-tema]");
      if (b) { previa.tema = b.dataset.previaTema!; carregarPrevia(); return; }
      b = (e.target as HTMLElement).closest<HTMLElement>("[data-previa-aparelho]");
      if (b) { previa.aparelho = b.dataset.previaAparelho!; pintarPrevia(); }
    });
    ouvir(window, "resize", escalarPrevia);
    /* começa aberta no computador (tela larga); no celular, fica no botão */
    let guardado: string | null = null;
    try { guardado = localStorage.getItem("brupater:painel-previa"); } catch { guardado = null; }
    previa.aberta = guardado ? guardado === "1" : window.innerWidth >= 1280;
  }

  /* ===================== escolher imagem das minhas artes ===================== */
  let escolhendo: string | null = null;
  function abrirEscolha(caminho: string) {
    escolhendo = caminho;
    const vistas: Record<string, 1> = {}, itens: { img: string; mini: string; titulo: string }[] = [];
    const add = (im: string, mini: string, titulo: string) => {
      if (!im || vistas[im] || (/^data:/.test(im) && !mini)) return;
      vistas[im] = 1; itens.push({ img: im, mini: mini || im, titulo: titulo || "" });
    };
    rascunho.galeria.forEach((o: any) => add(o.img, o.mini, o.titulo));
    rascunho.projetos.forEach((p: any) => { add(p.capa, "", p.titulo); (p.imagens || []).forEach((i: any) => add(i.img, "", p.titulo)); });
    $("#escolher-grade").innerHTML = itens.map((o) =>
      '<button type="button" class="escolher-item" data-pegar="' + esc(o.img) + '"><img src="' + esc(img(o.mini) || urlSegura(o.mini, true)) + '" alt="" loading="lazy"><span>' + esc(o.titulo) + "</span></button>").join("");
    $<HTMLDialogElement>("#escolher").showModal();
  }
  function ligarEscolha() {
    const d = $<HTMLDialogElement>("#escolher");
    ouvir(d, "click", (e: Event) => {
      const alvo = e.target as HTMLElement;
      if (alvo === d || alvo.closest("[data-fechar-escolha]")) { d.close(); return; }
      const b = alvo.closest<HTMLElement>("[data-pegar]");
      if (!b || !escolhendo) return;
      set(escolhendo, b.dataset.pegar); limparMiniatura(escolhendo);
      const g = rascunho.galeria.filter((o: any) => o.img === b.dataset.pegar)[0];
      const mt = /^galeria\.(\d+)\.img$/.exec(escolhendo);
      if (g && mt) { const o = rascunho.galeria[Number(mt[1])]; o.mini = g.mini; o.w = g.w; o.h = g.h; }
      if (escolhendo === "precos.tabela.img") { delete rascunho.precos.tabela.w; delete rascunho.precos.tabela.h; }
      d.close(); marcarSujo(); render(); toast("Imagem trocada. Lembre de salvar.");
    });
  }

  /* ===================== login ===================== */
  const logado = () => { try { return sessionStorage.getItem(CHAVE_SESSAO) === "1"; } catch { return false; } };
  function mostrar() {
    const ok = logado();
    $("#login").hidden = ok;
    $("#painel").hidden = !ok;
    raiz.classList.toggle("em-login", !ok);
    if (ok) { aplicarNoPainel(); renderAbas(); render(); agendarPrevia(); if (previa.aberta) carregarPrevia(); else pintarPrevia(); }
  }

  ouvir($("#login-form"), "submit", (e: Event) => {
    e.preventDefault();
    const u = $<HTMLInputElement>("#login-usuario").value.trim().toLowerCase(), s = $<HTMLInputElement>("#login-senha").value;
    if (u === USUARIO && s === SENHA) {
      try { sessionStorage.setItem(CHAVE_SESSAO, "1"); } catch { /* sem armazenamento */ }
      $("#login-erro").hidden = true;
      mostrar();
    } else {
      $("#login-erro").hidden = false;
    }
  });
  ouvir($("#sair"), "click", () => {
    if (sujo && !confirm("Tem mudanças não salvas. Sair mesmo assim?")) return;
    try { sessionStorage.removeItem(CHAVE_SESSAO); } catch { /* sem armazenamento */ }
    limparSujo(); rascunho = copiaProfunda(SITE);
    mostrar();
  });

  /* o painel mostra todas as fontes disponíveis, pra Bru comparar antes de escolher */
  (function carregarTodasAsFontes() {
    const familias: string[] = [];
    (Object.keys(OPCOES_FONTES) as (keyof typeof OPCOES_FONTES)[]).forEach((k) => OPCOES_FONTES[k].forEach((f) => { if (familias.indexOf(f) < 0 && f !== "Montserrat") familias.push(f); }));
    if (document.getElementById("fontes-painel")) return;
    const l = document.createElement("link");
    l.id = "fontes-painel";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?" + familias.map((f) => "family=" + f.replace(/ /g, "+")).join("&") + "&display=swap";
    document.head.appendChild(l);
  })();

  ligarEventos();
  ligarPrevia();
  ligarEscolha();
  mostrar();

  return () => {
    limpar.forEach((f) => f());
    window.clearTimeout(timerToast);
    window.clearTimeout(timerPrevia);
  };
}
