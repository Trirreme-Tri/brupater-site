"use strict";

/*
 * Painel da Bru (admin.html).
 *
 * Como funciona: o painel edita uma CÓPIA do conteúdo (rascunho). Nada muda
 * no site até clicar em "Salvar alterações" — aí o rascunho vai pro
 * js/loja.js, e qualquer aba aberta do site se redesenha sozinha.
 *
 * Os campos são ligados ao conteúdo por um "caminho" (data-k="perfil.nome",
 * "precos.fundos.2.preco"...). Um único listener lê o caminho e grava o
 * valor no lugar certo — por isso adicionar um campo novo é só chamar
 * campo("caminho", "Rótulo") na aba.
 *
 * ATENÇÃO: o login abaixo é só uma porta de entrada simples pra esta fase
 * (usuário e senha ficam no próprio código, visíveis pra quem souber
 * procurar). Quando o conteúdo for pra um banco de dados, o login passa a
 * ser feito pelo serviço do banco, como no site da Anne.
 */
(function () {
  /* se trocar, troque também o que aparece em apresentacao.html */
  var USUARIO = "brunna";
  var SENHA = "brupater";
  var CHAVE_SESSAO = "brupater:painel";

  var $ = function (s) { return document.querySelector(s); };
  var rascunho = copiaProfunda(SITE);
  var sujo = false;
  var abaAtual = "inicio";
  var modoCores = "claro"; // qual modo a aba de cores está editando

  /* o painel aplica cores da marca e fontes em si mesmo (pra Bru ver), mas
     NÃO as cores por modo: assim o painel nunca fica ilegível */
  function aplicarNoPainel() {
    temaAplicar(rascunho);
    var st = document.getElementById("tema-modos");
    if (st) st.textContent = "";
  }

  /* ===================== caminho → valor ===================== */
  function get(caminho) {
    return caminho.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, rascunho);
  }
  function set(caminho, valor) {
    var ks = caminho.split("."), o = rascunho;
    for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = valor;
  }

  /* ===================== peças de formulário ===================== */
  var uid = 0;
  function novoId() { return "c" + (++uid); }

  function secao(titulo, sub, corpo) {
    return '<section class="secao"><header class="secao-cab"><h2>' + titulo + "</h2>" + (sub ? "<p>" + sub + "</p>" : "") + "</header>" + corpo + "</section>";
  }
  function linha() { return '<div class="linha">' + Array.prototype.join.call(arguments, "") + "</div>"; }

  /* opts: tipo (text|textarea|number|date|url|select|check|cor|fator), ajuda, opcoes [{v,t}], passo, linhas, lista (datalist id) */
  function campo(caminho, rotulo, opts) {
    opts = opts || {};
    var tipo = opts.tipo || "text", v = get(caminho), id = novoId();
    var ajuda = opts.ajuda ? '<small class="ajuda">' + opts.ajuda + "</small>" : "";
    var k = ' data-k="' + caminho + '" id="' + id + '"';

    if (tipo === "check") {
      return '<label class="check"><input type="checkbox" data-tipo="bool"' + k + (v ? " checked" : "") + "><span>" + rotulo + ajuda + "</span></label>";
    }
    var input;
    if (tipo === "textarea") {
      input = "<textarea" + k + ' rows="' + (opts.linhas || 3) + '">' + esc(v) + "</textarea>";
    } else if (tipo === "select") {
      input = "<select" + k + (opts.numero ? ' data-tipo="num"' : "") + ">" + opts.opcoes.map(function (o) {
        return '<option value="' + esc(o.v) + '"' + (String(o.v) === String(v) ? " selected" : "") + ">" + esc(o.t) + "</option>";
      }).join("") + "</select>";
    } else if (tipo === "number") {
      input = '<input type="number" inputmode="decimal" data-tipo="num" step="' + (opts.passo || 1) + '"' + (opts.min != null ? ' min="' + opts.min + '"' : "") + k + ' value="' + esc(v) + '">';
    } else if (tipo === "fator") {
      /* o código guarda multiplicador (1.25); a Bru edita em % de acréscimo (25) */
      input = '<input type="number" inputmode="decimal" data-tipo="fator" step="1"' + k + ' value="' + Math.round((Number(v) - 1) * 100) + '">';
    } else if (tipo === "cor") {
      input = '<span class="cor-par"><input type="color" data-tipo="cor"' + k + ' value="' + esc(v) + '"><input type="text" class="cor-hex" data-hex="' + caminho + '" value="' + esc(v) + '" maxlength="7" aria-label="' + esc(rotulo) + ' em hexadecimal"></span>';
    } else {
      input = '<input type="' + (tipo === "date" ? "date" : (tipo === "url" ? "url" : "text")) + '"' + k + ' value="' + esc(v) + '"' + (opts.lista ? ' list="' + opts.lista + '"' : "") + (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : "") + ">";
    }
    return '<div class="campo' + (opts.largo ? " largo" : "") + '"><label for="' + id + '">' + rotulo + "</label>" + input + ajuda + "</div>";
  }

  function campoImg(caminho, rotulo, ajuda) {
    var v = get(caminho) || "", ehArquivo = /^data:/.test(v), id = novoId();
    var src = urlSegura(v, true);
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
  var NOVOS = {};
  function lista(caminho, itemHtml, novo, textoAdd, vazio) {
    NOVOS[caminho] = novo;
    var itens = get(caminho) || [];
    var corpo = itens.length ? itens.map(function (it, i) {
      return '<div class="item"><div class="item-campos">' + itemHtml(it, i, caminho + "." + i) + "</div>" +
        '<div class="item-acoes">' +
        '<button type="button" class="ico-btn" data-mover="-1" data-l="' + caminho + '" data-i="' + i + '" aria-label="Subir"' + (i === 0 ? " disabled" : "") + ">&#8593;</button>" +
        '<button type="button" class="ico-btn" data-mover="1" data-l="' + caminho + '" data-i="' + i + '" aria-label="Descer"' + (i === itens.length - 1 ? " disabled" : "") + ">&#8595;</button>" +
        '<button type="button" class="ico-btn perigo" data-remover data-l="' + caminho + '" data-i="' + i + '" aria-label="Remover">&times;</button>' +
        "</div></div>";
    }).join("") : '<p class="vazio">' + (vazio || "Nada aqui ainda.") + "</p>";
    return '<div class="lista">' + corpo + '</div><button type="button" class="btn add" data-add="' + caminho + '">+ ' + textoAdd + "</button>";
  }

  var FOCOS = [
    { v: "50% 20%", t: "Topo" }, { v: "50% 40%", t: "Centro-alto" }, { v: "50% 50%", t: "Centro" },
    { v: "50% 80%", t: "Base" }, { v: "20% 50%", t: "Esquerda" }, { v: "80% 50%", t: "Direita" }
  ];
  function opcoesFoco(caminho) {
    var atual = get(caminho);
    var lista = FOCOS.slice();
    if (!atual) lista.unshift({ v: "", t: "Padrão" });
    else if (!lista.some(function (f) { return f.v === atual; })) lista.unshift({ v: atual, t: "Personalizado (" + atual + ")" });
    return lista;
  }

  /* ===================== abas ===================== */
  var ABAS = [
    { id: "inicio", nome: "Início", icone: "estrela", render: abaInicio, desc: "Atalhos pro que você mais usa. Tudo que mudar aparece na prévia ao lado; quando gostar, clique em Salvar.", previa: "index.html" },
    { id: "agenda", nome: "Agenda e vagas", icone: "agenda", render: abaAgenda, desc: "Abrir e fechar encomendas, marcar vagas preenchidas, datas e a fila.", previa: "agenda.html" },
    { id: "encomendas", nome: "Preços e pacotes", icone: "dado", render: abaEncomendas, desc: "Os preços da calculadora, os pacotes de identidade visual e a tabela.", previa: "encomendas.html" },
    { id: "galeria", nome: "Minhas artes", icone: "estrela", render: abaGaleria, desc: "Todas as artes do portfólio. Marque \"Destaque\" pra arte passar no topo da página inicial.", previa: "portfolio.html" },
    { id: "projetos", nome: "Projetos", icone: "artstation", render: abaProjetos, desc: "Suas coleções (ilustração e identidade visual): capa, texto e imagens.", previa: "index.html" },
    { id: "cenas", nome: "Textos e imagens", icone: "youtube", render: abaCenas, desc: "O topo de cada página, as cenas em tela cheia e as páginas de aviso (erro e fora do ar).", previa: "index.html" },
    { id: "perfil", nome: "Sobre mim e contato", icone: "coracao", render: abaPerfil, desc: "Seu nome, foto, frase, WhatsApp, Instagram e a ficha da personagem.", previa: "index.html" },
    { id: "links", nome: "Links", icone: "link", render: abaLinks, desc: "Os botões de links da página inicial.", previa: "index.html" },
    { id: "perguntas", nome: "Perguntas", icone: "email", render: abaPerguntas, desc: "As perguntas e respostas da página de encomendas.", previa: "encomendas.html" },
    { id: "aparencia", nome: "Cores e visual", icone: "musica", render: abaAparencia, desc: "Cores do modo claro e do escuro, fontes, tela de carregamento e efeitos.", previa: null },
    { id: "backup", nome: "Backup", icone: "loja", render: abaBackup, desc: "Baixar uma cópia de tudo e restaurar.", previa: null }
  ];

  function renderAbas() {
    $("#abas").innerHTML = ABAS.map(function (a, i) {
      return '<button type="button" class="aba-btn" data-aba="' + a.id + '" aria-current="' + (a.id === abaAtual) + '">' +
        '<span class="aba-n">' + String(i + 1).padStart(2, "0") + "</span>" + iconeSvg(a.icone) + "<span>" + a.nome + "</span></button>";
    }).join("");
  }

  function render() {
    var a = ABAS.filter(function (x) { return x.id === abaAtual; })[0];
    var y = window.scrollY;
    $("#aba").innerHTML = '<h2 class="aba-titulo t-cinema">' + a.nome + "</h2>" + (a.desc ? '<p class="aba-desc">' + a.desc + "</p>" : "") + a.render();
    window.scrollTo(0, y);
    Array.prototype.forEach.call(document.querySelectorAll(".js-avatar"), function (el) { el.src = urlSegura(rascunho.perfil.avatar, true) || "assets/avatar.webp"; });
  }

  /* tabela de tamanhos de imagem (vem de TAMANHOS_IMAGEM, em js/dados.js) */
  function tamanhosHtml() {
    return '<div class="tamanhos">' + TAMANHOS_IMAGEM.map(function (t) {
      return '<div class="tam"><b>' + esc(t.onde) + '</b><span class="tam-medida">' + esc(t.tamanho) + " · " + esc(t.formato) + "</span><small>" + esc(t.dica) + "</small></div>";
    }).join("") + "</div>";
  }
  function tam(i) { var t = TAMANHOS_IMAGEM[i]; return "Tamanho ideal: <b>" + t.tamanho + "</b>, " + t.formato + ". " + t.dica; }

  /* ----- início: atalhos ----- */
  function abaInicio() {
    var a = rascunho.agenda, ag = estadoAgenda(a);
    var idx = ag.atual ? a.sessoes.indexOf(ag.atual.sessao) : -1;
    if (idx < 0 && ag.proxima) idx = a.sessoes.indexOf(ag.proxima.sessao);
    var ses = idx >= 0 ? a.sessoes[idx] : null, est = ses ? estadoSessao(ses) : null;
    var frase = ag.estado === "aberta" ? "Suas encomendas estão <b>abertas</b>." : ag.estado === "esgotado" ? "Suas vagas estão <b>esgotadas</b>." : "Suas encomendas estão <b>fechadas</b>.";
    if (ag.estado !== "aberta" && ag.proxima) frase += " A <b>" + esc(ag.proxima.sessao.nome) + "</b> abre em " + esc(dataExtenso(ag.proxima.abre)) + ".";
    var atalhos = [
      ["galeria", "estrela", "Trocar as artes do topo", "Marque quais artes passam no carrossel"],
      ["projetos", "artstation", "Projetos", "Criar ou editar uma coleção"],
      ["encomendas", "dado", "Mudar preços", "Ilustração e identidade visual"],
      ["aparencia", "musica", "Mudar as cores", "Modo claro e modo escuro"],
      ["cenas", "youtube", "Textos e fotos das páginas", "Topo, cenas e avisos"],
      ["perfil", "coracao", "WhatsApp e Instagram", "Seus contatos e sua foto"]
    ];
    return '<div class="ola"><img src="' + esc(urlSegura(rascunho.perfil.avatar, true) || "assets/avatar.webp") + '" alt=""><div><p class="t-mao">Oi, ' + esc(rascunho.perfil.apelido || "Bru") + '! ✨</p><p>O que você quer mudar hoje?</p></div></div>' +
      '<div class="cartao-agenda estado-' + ag.estado + '">' +
        '<div class="ca-topo"><span class="situacao-chip ch-' + ag.estado + '">' + NOMES_ESTADO[ag.estado] + "</span><p>" + frase + "</p></div>" +
        (ses ? '<div class="ca-vagas"><span>' + esc(ses.nome) + ": vagas preenchidas</span>" +
          '<span class="vagas-ctrl"><button type="button" class="ico-btn" data-vaga="' + idx + '" data-d="-1" aria-label="Uma vaga a menos"' + (est.ocupadas <= 0 ? " disabled" : "") + ">&minus;</button>" +
          "<b>" + est.ocupadas + " / " + est.vagas + "</b>" +
          '<button type="button" class="ico-btn" data-vaga="' + idx + '" data-d="1" aria-label="Uma vaga a mais"' + (est.ocupadas >= est.vagas ? " disabled" : "") + ">+</button></span></div>" : "") +
        campo("agenda.pausa", "Pausar tudo agora (férias, imprevisto)", { tipo: "check" }) +
        '<button type="button" class="link-btn" data-ir="agenda">Ver todas as agendas &#8594;</button>' +
      "</div>" +
      '<div class="atalhos">' + atalhos.map(function (t) {
        return '<button type="button" class="atalho" data-ir="' + t[0] + '">' + iconeSvg(t[1]) + "<b>" + t[2] + "</b><small>" + t[3] + "</small></button>";
      }).join("") + "</div>" +
      secao("Tamanho ideal das imagens", "Pra cada lugar do site. Com o tamanho certo, a arte aparece bem enquadrada e nítida.", tamanhosHtml()) +
      '<ol class="passos-ajuda"><li><b>Mude</b> o que quiser em qualquer aba.</li><li><b>Confira</b> na prévia (botão "Prévia" lá em cima).</li><li><b>Salve</b> na barra que aparece embaixo.</li></ol>' +
      '<p class="ajuda nota-banco"><b>Por enquanto</b> o que você salva fica guardado neste navegador, pra testar. Quando o site ganhar o banco de dados (próxima etapa), passa a valer pra todo mundo.</p>';
  }

  /* ----- 01 agenda ----- */
  var NOMES_ESTADO = { aberta: "Aberta", esgotado: "Esgotado", embreve: "Em breve", encerrada: "Encerrada", fechada: "Fechada" };
  function abaAgenda() {
    var a = rascunho.agenda;
    var ag = estadoAgenda(a);
    var etapas = a.etapas.map(function (e, i) { return { v: i, t: e }; });
    var tipos = Object.keys(TIPOS_ADMIN).map(function (k) { return { v: k, t: TIPOS_ADMIN[k] }; });

    var agora = ag.estado === "aberta" ? "<b>" + esc(ag.atual.sessao.nome) + "</b> está aberta com " + ag.atual.livres + " de " + ag.atual.vagas + " vagas livres."
      : ag.estado === "esgotado" ? "<b>" + esc(ag.atual.sessao.nome) + "</b> está esgotada."
      : a.pausa ? "A pausa está ligada: o site mostra as encomendas fechadas."
      : "Nenhuma agenda aberta agora.";
    if (ag.estado !== "aberta" && ag.proxima) agora += " A próxima é <b>" + esc(ag.proxima.sessao.nome) + "</b>, em " + esc(dataExtenso(ag.proxima.abre)) + ".";

    return secao("Situação agora", "Calculada sozinha a partir das agendas abaixo. Não precisa trocar nada na mão.",
        '<div class="situacao estado-' + ag.estado + '"><span class="situacao-chip">' + NOMES_ESTADO[ag.estado] + "</span><p>" + agora + "</p></div>" +
        campo("agenda.pausa", "Pausar encomendas agora (fecha tudo, mesmo com vaga sobrando)", { tipo: "check" }) +
        campo("agenda.mostrarContagem", "Mostrar contagem regressiva (\"abre em X dias\") quando estiver fechada", { tipo: "check" })) +
      secao("Agendas de encomenda", "Cada agenda abre numa data e tem um número de vagas. Quando alguém confirmar o pagamento, marque +1 vaga preenchida. Quando enche, o site mostra ESGOTADO sozinho.",
        lista("agenda.sessoes", function (x, i, c) {
          var est = estadoSessao(x);
          return '<div class="sessao-admin">' +
            '<div class="vagas-rapido"><span class="situacao-chip ch-' + est.estado + '">' + NOMES_ESTADO[est.estado] + "</span>" +
            '<span class="vagas-txt">Vagas preenchidas</span>' +
            '<span class="vagas-ctrl"><button type="button" class="ico-btn" data-vaga="' + i + '" data-d="-1" aria-label="Uma vaga a menos"' + (est.ocupadas <= 0 ? " disabled" : "") + ">&minus;</button>" +
            "<b>" + est.ocupadas + " / " + est.vagas + "</b>" +
            '<button type="button" class="ico-btn" data-vaga="' + i + '" data-d="1" aria-label="Uma vaga a mais"' + (est.ocupadas >= est.vagas ? " disabled" : "") + ">+</button></span></div>" +
            linha(campo(c + ".nome", "Nome", { placeholder: "Agenda de novembro" }), campo(c + ".abre", "Abre em", { tipo: "date" }), campo(c + ".vagas", "Total de vagas", { tipo: "number", min: 1 })) +
            campo(c + ".nota", "Observação (opcional)", { placeholder: "Ex.: só busto e meio corpo" }) +
            campo(c + ".encerrada", "Encerrar esta agenda antes de encher", { tipo: "check" }) + "</div>";
        }, function () {
          var d = new Date(); d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
          return { nome: "Agenda de " + MESES[d.getMonth()], abre: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-01", vagas: 4, ocupadas: 0, encerrada: false, nota: "" };
        }, "Adicionar agenda", "Nenhuma agenda criada.")) +
      secao("Textos de cada situação", "A etiqueta inclinada (como o OPEN dos seus posts) e o recado do quadro da agenda.",
        ["aberta", "esgotado", "fechada"].map(function (k) {
          return '<h3 class="sub-t">' + NOMES_ESTADO[k] + "</h3>" + linha(campo("agenda.etiquetas." + k, "Etiqueta"), campo("agenda.avisos." + k, "Recado", { largo: true }));
        }).join("")) +
      secao("Outras datas", "Entregas, avisos e pausas. As aberturas das agendas já entram no calendário sozinhas.",
        lista("agenda.eventos", function (ev, i, c) {
          return linha(campo(c + ".data", "Data", { tipo: "date" }), campo(c + ".tipo", "Tipo", { tipo: "select", opcoes: tipos })) +
            campo(c + ".titulo", "Título") + campo(c + ".desc", "Descrição", { tipo: "textarea", linhas: 2 });
        }, function () { return { data: hojeTxt(), tipo: "aviso", titulo: "Nova data", desc: "" }; }, "Adicionar data", "Nenhuma data marcada.")) +
      secao("Fila de produção", "Mostra em que etapa está cada encomenda. Use nomes genéricos se a pessoa preferir não aparecer.",
        lista("agenda.fila", function (f, i, c) {
          return linha(campo(c + ".nome", "Nome"), campo(c + ".detalhe", "Detalhe"), campo(c + ".etapa", "Etapa", { tipo: "select", opcoes: etapas, numero: true }));
        }, function () { return { nome: "Encomenda " + String(rascunho.agenda.fila.length + 1).padStart(2, "0"), detalhe: "", etapa: 0 }; }, "Adicionar encomenda na fila", "A fila está vazia.")) +
      secao("Etapas da fila", "A última etapa é considerada \"entregue\".",
        lista("agenda.etapas", function (e, i, c) { return campo(c, "Etapa " + (i + 1)); }, function () { return "Nova etapa"; }, "Adicionar etapa"));
  }
  var TIPOS_ADMIN = { abertura: "Abertura", fechamento: "Fechamento", entrega: "Entrega", aviso: "Aviso" };
  function hojeTxt() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

  /* ----- 02 encomendas ----- */
  function abaEncomendas() {
    return secao("Enquadramentos", "O preço base de cada arte, antes do acabamento e dos extras.",
        lista("precos.enquadramentos", function (o, i, c) {
          return linha(campo(c + ".nome", "Nome"), campo(c + ".preco", "Preço (R$)", { tipo: "number", passo: "0.01", min: 0 })) +
            campo(c + ".desc", "Descrição curta") + campoImg(c + ".img", "Imagem de exemplo");
        }, function () { return { id: "enq" + Date.now(), nome: "Novo enquadramento", preco: 100, img: "", desc: "" }; }, "Adicionar enquadramento")) +
      secao("Acabamentos", "Quanto cada acabamento acrescenta sobre o preço base. 0% = preço base.",
        lista("precos.acabamentos", function (o, i, c) {
          return linha(campo(c + ".nome", "Nome"), campo(c + ".fator", "Acréscimo (%)", { tipo: "fator" })) +
            campo(c + ".desc", "Descrição curta") + campoImg(c + ".img", "Imagem de exemplo");
        }, function () { return { id: "acab" + Date.now(), nome: "Novo acabamento", fator: 1, img: "", desc: "" }; }, "Adicionar acabamento")) +
      secao("Personagens extras", "",
        linha(campo("precos.personagemExtraPct", "Cada personagem extra (%)", { tipo: "number", min: 0, ajuda: "Sobre o preço do enquadramento." }),
              campo("precos.maxPersonagens", "Máximo de personagens por arte", { tipo: "number", min: 1 }))) +
      secao("Fundos", "Valor fixo somado a cada arte.",
        lista("precos.fundos", function (o, i, c) {
          return linha(campo(c + ".nome", "Nome"), campo(c + ".preco", "Preço (R$)", { tipo: "number", passo: "0.01", min: 0 })) + campo(c + ".desc", "Descrição curta");
        }, function () { return { id: "fundo" + Date.now(), nome: "Novo fundo", preco: 0, desc: "" }; }, "Adicionar fundo")) +
      secao("Desconto por quantidade", "A partir de quantas artes no mesmo pedido o desconto vale.",
        lista("precos.descontosVolume", function (o, i, c) {
          return linha(campo(c + ".min", "A partir de (artes)", { tipo: "number", min: 1 }), campo(c + ".pct", "Desconto (%)", { tipo: "number", min: 0 }));
        }, function () { return { min: 10, pct: 15 }; }, "Adicionar faixa de desconto")) +
      secao("Uso comercial", "Vale só para as ilustrações.", campo("precos.comercialPct", "Acréscimo para uso comercial (%)", { tipo: "number", min: 0 })) +
      secao("As duas categorias", "Os dois botões no alto da área de encomendas.",
        linha(campo("precos.ilustracao.titulo", "Ilustração: nome"), campo("precos.ilustracao.sub", "Ilustração: frase curta")) +
        linha(campo("precos.identidade.titulo", "Identidade visual: nome"), campo("precos.identidade.sub", "Identidade visual: frase curta"))) +
      secao("Pacotes de identidade visual", "Preço 0 aparece como \"sob consulta\" e o valor é combinado na conversa. Sem nenhum pacote, a categoria some do site.",
        lista("precos.identidade.pacotes", function (o, i, c) {
          return linha(campo(c + ".nome", "Nome (ex.: Básico)"), campo(c + ".sub", "Subtítulo"), campo(c + ".preco", "Preço (R$)", { tipo: "number", passo: "0.01", min: 0 })) +
            campo(c + ".itens", "O que inclui", { tipo: "textarea", linhas: 2, ajuda: "Separe os itens com · (ponto do meio)." });
        }, function () { return { id: "pac" + Date.now(), nome: "Novo pacote", sub: "", preco: 0, itens: "" }; }, "Adicionar pacote")) +
      secao("Tabela de comissões", "A imagem da sua tabela que aparece embaixo da calculadora.",
        campo("precos.tabela.mostrar", "Mostrar a tabela", { tipo: "check" }) +
        campoImg("precos.tabela.img", "Imagem da tabela") + campo("precos.tabela.legenda", "Frase embaixo da tabela")) +
      secao("Nota do total", "Aparece com * logo abaixo do \"Total estimado\".",
        campo("precos.notaTotal", "Texto da nota", { largo: true })) +
      secao("Regras de pagamento", "Os cartões numerados abaixo da calculadora.",
        lista("precos.regras", function (r, i, c) { return campo(c, "Regra " + (i + 1)); }, function () { return "Nova regra"; }, "Adicionar regra"));
  }

  /* ----- 03 galeria ----- */
  function abaGaleria() {
    var tags = [];
    rascunho.galeria.forEach(function (o) { if (o.tag && tags.indexOf(o.tag) < 0) tags.push(o.tag); });
    var visiveis = rascunho.galeria.filter(function (o) { return o.visivel !== false; }).length;
    var dest = rascunho.galeria.filter(function (o) { return o.visivel !== false && o.destaque; }).length;
    return secao("Tamanho ideal das imagens", "", tamanhosHtml()) +
      secao("Galeria do portfólio", visiveis + " de " + rascunho.galeria.length + " artes aparecendo no site · " + dest + " no carrossel do topo. A ordem aqui é a ordem do site (e do carrossel).",
      '<label class="btn cheio upload-varios"><input type="file" accept="image/*" multiple data-galeria-upload hidden>Enviar artes do computador</label>' +
      '<datalist id="tags-galeria">' + tags.map(function (t) { return '<option value="' + esc(t) + '">'; }).join("") + "</datalist>" +
      lista("galeria", function (o, i, c) {
        return '<div class="obra-admin' + (o.visivel === false ? " oculta" : "") + '">' + campoImg(c + ".img", "Arte") +
          linha(campo(c + ".titulo", "Título"), campo(c + ".tag", "Categoria", { lista: "tags-galeria", ajuda: "Vira um filtro no site." })) +
          campo(c + ".visivel", "Aparecer no site", { tipo: "check" }) +
          campo(c + ".destaque", "Destaque no carrossel do topo da página inicial", { tipo: "check" }) +
          (o.destaque ? '<p class="ajuda dica-tam">' + tam(0) + "</p>" +
            campo(c + ".foco", "Parte em destaque no topo", { tipo: "select", opcoes: opcoesFoco(c + ".foco"), ajuda: "Quando a arte cobre a tela toda, é essa parte que aparece." }) +
            campoImg(c + ".imgCelular", "Versão de celular (opcional)", tam(1)) : "") + "</div>";
      }, function () { return { img: "", titulo: "Nova arte", tag: tags[0] || "Personagens", visivel: true, destaque: false }; }, "Adicionar arte por link"));
  }

  /* ----- projetos (coleções) ----- */
  function abaProjetos() {
    var cats = ["Ilustração", "Identidade visual"];
    rascunho.projetos.forEach(function (p) { if (p.categoria && cats.indexOf(p.categoria) < 0) cats.push(p.categoria); });
    var opGaleria = '<option value="">+ Adicionar arte da galeria…</option>' + rascunho.galeria.filter(function (o) { return o.img && !/^data:/.test(o.img); }).map(function (o) {
      return '<option value="' + esc(o.img) + '">' + esc(o.titulo || o.img) + "</option>";
    }).join("");
    return secao("Seção de projetos", "Na página inicial aparece só a capa de cada projeto. Ao clicar, abre a página do projeto com todas as imagens.",
        linha(campo("secaoProjetos.titulo", "Título da seção"), campo("secaoProjetos.sub", "Frase curta", { largo: true }))) +
      secao("Projetos", "A ordem aqui é a ordem da página inicial (os 2 primeiros aparecem maiores no computador). A categoria vira um filtro quando houver mais de uma.",
        '<datalist id="cats-projetos">' + cats.map(function (c) { return '<option value="' + esc(c) + '">'; }).join("") + "</datalist>" +
        lista("projetos", function (p, i, c) {
          var url = "projeto.html?p=" + encodeURIComponent(p.id || "");
          return '<div class="obra-admin' + (p.visivel === false ? " oculta" : "") + '">' +
            linha(campo(c + ".titulo", "Nome do projeto"), campo(c + ".categoria", "Categoria", { lista: "cats-projetos" })) +
            campoImg(c + ".capa", "Capa (aparece na página inicial)", tam(4)) +
            campo(c + ".foco", "Parte da capa em destaque", { tipo: "select", opcoes: opcoesFoco(c + ".foco") }) +
            campo(c + ".resumo", "Linha curta embaixo do nome na capa") +
            campo(c + ".texto", "Texto do projeto", { tipo: "textarea", linhas: 4, ajuda: "Aparece no topo da página do projeto. Pule uma linha pra começar outro parágrafo." }) +
            linha(campo(c + ".id", "Endereço", { ajuda: 'Só letras, números e hífen. Link: <a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url) + "</a>" }),
                  campo(c + ".visivel", "Aparecer no site", { tipo: "check" })) +
            '<h3 class="sub-t">Imagens do projeto (' + (p.imagens || []).length + ")</h3>" +
            '<div class="campo"><select data-add-galeria="' + c + '.imagens" aria-label="Adicionar arte da galeria">' + opGaleria + "</select></div>" +
            lista(c + ".imagens", function (im, j, ci) {
              return campoImg(ci + ".img", "Imagem " + (j + 1)) + campo(ci + ".legenda", "Legenda (opcional)");
            }, function () { return { img: "", legenda: "" }; }, "Adicionar imagem por link ou do computador", "Nenhuma imagem ainda.") +
            "</div>";
        }, function () {
          return { id: "projeto-" + Date.now().toString(36), titulo: "Novo projeto", categoria: "Identidade visual", visivel: true, capa: "", foco: "50% 40%", resumo: "", texto: "", imagens: [] };
        }, "Adicionar projeto", "Nenhum projeto ainda."));
  }

  /* ----- 04 cenas ----- */
  function abaCenas() {
    return secao("Topo da página inicial (carrossel)", "As artes que passam no topo são as marcadas como \"Destaque\" na aba Galeria, na mesma ordem. Aqui ficam só os textos.",
        campo("cenas.abertura.modo", "Como as artes aparecem", { tipo: "select", opcoes: [{ v: "inteira", t: "Arte inteira, sem corte, centralizada (recomendado)" }, { v: "fundo", t: "Cobrindo a tela toda (corta um pouco da arte)" }], ajuda: "Cobrindo a tela, cada arte mostra a parte escolhida em \"Parte em destaque no topo\" (aba Minhas artes)." }) +
        campo("cenas.abertura.kicker", "Linha pequena no alto") +
        campo("cenas.abertura.legenda", "Texto curto abaixo da frase", { tipo: "textarea", linhas: 2 })) +
      ["portfolio", "agenda", "encomendas"].map(function (k) {
        var nomes = { portfolio: "Portfólio", agenda: "Agenda", encomendas: "Encomendas" };
        var c = "cenas.paginas." + k;
        return secao("Topo da página " + nomes[k], "A faixa de cinema no alto da página " + nomes[k] + " e o cartão dela na página inicial.",
          campoImg(c + ".img", "Imagem", tam(2)) +
          campo(c + ".foco", "Parte da imagem em destaque", { tipo: "select", opcoes: opcoesFoco(c + ".foco") }) +
          linha(campo(c + ".titulo", "Título"), campo(c + ".sub", "Frase curta", { largo: true })));
      }).join("") +
      secao("Interlúdio 1", "A cena em tela cheia depois da ficha, na página inicial.",
        campoImg("cenas.interludio1.img", "Imagem", tam(3)) +
        campo("cenas.interludio1.foco", "Parte da imagem em destaque", { tipo: "select", opcoes: opcoesFoco("cenas.interludio1.foco") }) +
        campo("cenas.interludio1.frase", "Frase grande") + campo("cenas.interludio1.credito", "Legenda pequena")) +
      secao("Páginas de aviso", "Aparecem quando alguém abre um endereço que não existe (404), quando dá erro, ou quando o site está fora do ar.",
        [["naoEncontrada", "Página não existe (404)", "404.html"], ["erro", "Algo deu errado", "erro.html"], ["manutencao", "Site fora do ar (manutenção)", "manutencao.html"]].map(function (k) {
          var c = "paginasAviso." + k[0];
          return '<h3 class="sub-t">' + k[1] + ' · <a href="' + k[2] + '" target="_blank" rel="noopener">ver &#8599;</a></h3>' +
            linha(campo(c + ".rotulo", "Linha pequena"), campo(c + ".titulo", "Título")) + campo(c + ".texto", "Texto", { tipo: "textarea", linhas: 2 }) +
            linha(campo(c + ".botao", "Texto do botão")) + campoImg(c + ".img", "Imagem", tam(6));
        }).join("")) +
      secao("Interlúdio 2", "A cena em tela cheia no fim da página inicial.",
        campoImg("cenas.interludio2.img", "Imagem", tam(3)) +
        campo("cenas.interludio2.foco", "Parte da imagem em destaque", { tipo: "select", opcoes: opcoesFoco("cenas.interludio2.foco") }) +
        campo("cenas.interludio2.frase", "Frase grande") + campo("cenas.interludio2.credito", "Legenda pequena"));
  }

  /* ----- 05 perfil ----- */
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
      secao("Trilha sonora", "Um botão \"play\" na abertura, pra quem quiser ouvir uma música enquanto vê o portfólio. Sem link, o botão some.",
        linha(campo("perfil.trilha.texto", "Texto do botão"), campo("perfil.trilha.url", "Link da música", { tipo: "url", placeholder: "https://open.spotify.com/..." }))) +
      secao("Ficha da personagem (pôster)", "A seção no estilo do seu pôster Oásis.",
        linha(campoImg("sobre.retrato", "Retrato do topo"), campoImg("sobre.imagem", "Arte grande do pôster")) +
        campo("sobre.palavra", "Palavra gigante", { ajuda: "Curta funciona melhor (até ~8 letras)." }) +
        campo("sobre.texto", "Sobre você", { tipo: "textarea", linhas: 4 }) +
        campo("sobre.lema", "Frase de efeito", { ajuda: "A última frase fica rosa." }) +
        '<h3 class="sub-t">Itens da ficha</h3>' +
        lista("sobre.ficha", function (f, i, c) {
          return linha(campo(c + ".rotulo", "Categoria"), campo(c + ".valor", "Itens", { ajuda: "Separe com · (ponto do meio)", largo: true }));
        }, function () { return { rotulo: "Nova categoria", valor: "" }; }, "Adicionar categoria") +
        linha(campo("sobre.extra.rotulo", "Linha extra: categoria"), campo("sobre.extra.valor", "Linha extra: itens", { largo: true })));
  }

  /* ----- 06 links ----- */
  function abaLinks() {
    var icones = Object.keys(ICONES).map(function (k) { return { v: k, t: ICONES[k].nome }; });
    return secao("Créditos iniciais (links)", "Para levar a uma parte do próprio site, use #encomendas, #agenda, #portfolio ou #ficha.",
      lista("links", function (l, i, c) {
        return '<div class="link-admin"><span class="link-ico">' + iconeSvg(l.icone) + "</span><div>" +
          linha(campo(c + ".nome", "Nome"), campo(c + ".icone", "Ícone", { tipo: "select", opcoes: icones })) +
          campo(c + ".desc", "Descrição") + campo(c + ".url", "Link") + campo(c + ".visivel", "Aparecer no site", { tipo: "check" }) + "</div></div>";
      }, function () { return { nome: "Novo link", desc: "", url: "https://", icone: "link", visivel: true }; }, "Adicionar link"));
  }

  /* ----- 07 perguntas ----- */
  function abaPerguntas() {
    return secao("A Bru responde", "As perguntas frequentes do fim do site.",
      lista("faq", function (f, i, c) {
        return campo(c + ".p", "Pergunta") + campo(c + ".r", "Resposta", { tipo: "textarea", linhas: 3 });
      }, function () { return { p: "Nova pergunta?", r: "" }; }, "Adicionar pergunta"));
  }

  /* ----- 08 aparência ----- */
  var PALETAS = {
    "Pôster rosa (padrão)": PADRAO.aparencia.cores,
    "Neon das comissões": { rosa: "#D96BFF", poster: "#9B5CF6", vinho: "#3B1F5C", violeta: "#C79BFF", teal: "#5ED6E0", papel: "#EEE8F2", noite: "#0B0912" },
    "Brasa da cavaleira": { rosa: "#E8833A", poster: "#B8562E", vinho: "#5E2A16", violeta: "#F2C46D", teal: "#7FB89A", papel: "#F1E6DA", noite: "#0F0A07" },
    "Água turquesa": { rosa: "#3FD0BE", poster: "#2F8F9D", vinho: "#173B4A", violeta: "#A9B8FF", teal: "#E8347F", papel: "#E6EFEE", noite: "#081012" }
  };
  var NOMES_CORES = {
    rosa: ["Rosa choque", "Botões, etiquetas e destaques"],
    poster: ["Rosa do pôster", "Títulos da ficha e números"],
    vinho: ["Vinho", "Tons de fundo misturados"],
    violeta: ["Violeta neon", "Estrelas das vagas e brilho da agenda"],
    teal: ["Turquesa", "Etapas da fila e entregas"],
    papel: ["Papel", "Fundo das seções impressas"],
    noite: ["Noite", "Fundo das cenas de cinema"]
  };
  var NOMES_MODO = {
    fundo: ["Fundo do site", "A cor de trás de tudo"],
    secao: ["Fundo das faixas", "A faixa dos projetos e áreas alternadas"],
    texto: ["Letras", "Títulos e textos principais"],
    textoSuave: ["Letras suaves", "Legendas e textos menores"],
    barra: ["Barra do topo", "O menu, quando a pessoa rola a página"],
    barraTexto: ["Letras da barra do topo", "Os nomes do menu"],
    rodape: ["Rodapé", "A faixa do fim da página"],
    rodapeTexto: ["Letras do rodapé", ""]
  };
  function abaAparencia() {
    var ap = rascunho.aparencia;
    var paletas = '<div class="paletas">' + Object.keys(PALETAS).map(function (nome) {
      var p = PALETAS[nome];
      return '<button type="button" class="paleta" data-paleta="' + esc(nome) + '"><span class="paleta-cores">' +
        ["noite", "vinho", "poster", "rosa", "violeta", "teal", "papel"].map(function (k) { return '<i style="background:' + p[k] + '"></i>'; }).join("") +
        "</span><b>" + esc(nome) + "</b></button>";
    }).join("") + "</div>";
    var m = modoCores, mo = ap.modos[m];
    /* mini prévia do modo: fundo, barra, letras e botão, pra ver na hora */
    var amostra = '<div class="amostra-modo" style="background:' + esc(mo.fundo) + ';color:' + esc(mo.texto) + '">' +
      '<div class="am-barra" style="background:' + esc(mo.barra) + ';color:' + esc(mo.barraTexto) + '"><b>' + esc(rascunho.perfil.nome) + "</b><span>Início · Portfólio · Agenda</span></div>" +
      '<div class="am-corpo"><p class="am-titulo">Projetos</p><p style="color:' + esc(mo.textoSuave) + '">Texto menor, legendas e descrições.</p>' +
      '<span class="am-btn" style="background:' + esc(ap.cores.rosa) + '">Fazer encomenda</span></div>' +
      '<div class="am-faixa" style="background:' + esc(mo.secao) + '"></div>' +
      '<div class="am-rodape" style="background:' + esc(mo.rodape) + ';color:' + esc(mo.rodapeTexto) + '">Rodapé · Site desenvolvido pela TRIRREME</div></div>';
    var coresModo = '<div class="grade-cores">' + Object.keys(NOMES_MODO).map(function (k) {
      return campo("aparencia.modos." + m + "." + k, NOMES_MODO[k][0], { tipo: "cor", ajuda: NOMES_MODO[k][1] });
    }).join("") + "</div>";
    var cores = '<div class="grade-cores">' + Object.keys(NOMES_CORES).map(function (k) {
      return campo("aparencia.cores." + k, NOMES_CORES[k][0], { tipo: "cor", ajuda: NOMES_CORES[k][1] });
    }).join("") + "</div>";

    function fonte(papel, rotulo, amostraTxt, classe) {
      var atual = ap.fontes[papel];
      return '<div class="fonte-escolha">' + campo("aparencia.fontes." + papel, rotulo, { tipo: "select", opcoes: OPCOES_FONTES[papel].map(function (f) { return { v: f, t: f }; }) }) +
        '<p class="amostra ' + classe + '" style="font-family:\'' + esc(atual) + '\'">' + amostraTxt + "</p></div>";
    }

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
      secao("Cores da marca", "Valem nos dois modos: botões, etiquetas, destaques e as cenas de cinema.", cores) +
      secao("Fontes", "",
        fonte("cinema", "Fonte de cinema (títulos grandes)", "Brunna Paternostro", "am-cinema") +
        fonte("poster", "Fonte de pôster (ficha e rótulos)", "Força e ódio", "am-poster") +
        fonte("mao", "Fonte de mão (frases e anotações)", "Colors and lines bring your ideas to life.", "am-mao")) +
      secao("Efeitos", "",
        campo("aparencia.grao", "Grão de filme por cima do site", { tipo: "check" }) +
        linha(campo("aparencia.movimento", "Animações", { tipo: "select", opcoes: [{ v: "normal", t: "Normais" }, { v: "suave", t: "Suaves" }, { v: "desligado", t: "Desligadas" }] })));
  }

  /* ----- 09 backup ----- */
  function abaBackup() {
    var kb = Math.round(JSON.stringify(rascunho).length / 1024);
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
  var timerToast;
  function toast(txt, erro) {
    var t = $("#toast");
    t.textContent = txt;
    t.className = "aviso-flutuante visivel" + (erro ? " erro" : "");
    clearTimeout(timerToast);
    timerToast = setTimeout(function () { t.className = "aviso-flutuante"; }, erro ? 6000 : 2800);
  }

  /* a galeria guarda duas versões (mini para a grade, img para tela cheia).
     Se a Bru trocar a imagem, a mini antiga e o tamanho deixam de valer. */
  function limparMiniatura(caminho) {
    if (caminho === "precos.tabela.img") { delete rascunho.precos.tabela.w; delete rascunho.precos.tabela.h; return; }
    var m = /^galeria\.(\d+)\.img$/.exec(caminho);
    if (!m) return;
    var o = rascunho.galeria[Number(m[1])];
    if (o) { o.mini = ""; delete o.w; delete o.h; }
  }

  function aoMudarCampo(el) {
    var caminho = el.dataset.k, tipo = el.dataset.tipo, v;
    if (el.type === "radio" && !el.checked) return;
    if (tipo === "bool") v = el.checked;
    else if (tipo === "num") v = el.value === "" ? 0 : Number(el.value);
    else if (tipo === "fator") v = Math.round((1 + (Number(el.value) || 0) / 100) * 1000) / 1000;
    else v = el.value;
    set(caminho, v);
    limparMiniatura(caminho);
    marcarSujo();
    if (tipo === "cor") { var hex = document.querySelector('[data-hex="' + caminho + '"]'); if (hex) hex.value = v; }
    if (caminho.indexOf("aparencia.") === 0) aplicarNoPainel();
    if (el.hasAttribute("data-rerender") || el.tagName === "SELECT" || tipo === "bool" || caminho.indexOf("aparencia.fontes") === 0) render();
  }

  /* imagens enviadas: reduz pra no máximo `max` px e vira texto (data URL),
     pra caber no armazenamento do navegador */
  var webpOk = (function () { try { return document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0; } catch (e) { return false; } })();
  function processarImagem(arquivo, max) {
    return new Promise(function (ok, falha) {
      var url = URL.createObjectURL(arquivo), im = new Image();
      im.onload = function () {
        var esc_ = Math.min(1, max / Math.max(im.width, im.height));
        var c = document.createElement("canvas");
        c.width = Math.round(im.width * esc_); c.height = Math.round(im.height * esc_);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok(c.toDataURL(webpOk ? "image/webp" : "image/jpeg", 0.82));
      };
      im.onerror = function () { URL.revokeObjectURL(url); falha(new Error("Não consegui abrir essa imagem.")); };
      im.src = url;
    });
  }

  function baixar(nome, texto) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
    a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function ligarEventos() {
    var aba = $("#aba");

    aba.addEventListener("input", function (e) {
      var el = e.target;
      if (el.dataset.k && el.tagName !== "SELECT" && el.type !== "checkbox" && el.type !== "radio") aoMudarCampo(el);
      if (el.dataset.hex && /^#[0-9a-f]{6}$/i.test(el.value)) {
        set(el.dataset.hex, el.value); marcarSujo(); aplicarNoPainel();
        var cor = document.querySelector('[data-k="' + el.dataset.hex + '"]'); if (cor) cor.value = el.value;
      }
    });
    aba.addEventListener("change", function (e) {
      var el = e.target;
      if (el.dataset.k && (el.tagName === "SELECT" || el.type === "checkbox" || el.type === "radio")) aoMudarCampo(el);
      /* campos de texto: ao sair do campo, redesenha pra atualizar miniaturas e títulos */
      else if (el.dataset.k && /^aparencia\.modos\./.test(el.dataset.k)) render();
      else if (el.dataset.k && (/\.img$|avatar$|retrato$|imagem$|capa$/.test(el.dataset.k) || /^agenda\.sessoes\.\d+\.(abre|vagas)$/.test(el.dataset.k))) render();

      if (el.dataset.img && el.files[0]) {
        var grande = /^cenas\.|^projetos\./.test(el.dataset.img);
        processarImagem(el.files[0], grande ? 1800 : 1200).then(function (dataUrl) {
          set(el.dataset.img, dataUrl); limparMiniatura(el.dataset.img); marcarSujo(); render(); toast("Imagem carregada. Lembre de salvar.");
        }).catch(function (err) { toast(err.message, true); });
      }
      if (el.dataset.addGaleria && el.value) {
        get(el.dataset.addGaleria).push({ img: el.value, legenda: "" }); marcarSujo(); render(); toast("Arte adicionada ao projeto.");
        return;
      }
      if (el.hasAttribute("data-galeria-upload") && el.files.length) {
        var arquivos = Array.prototype.slice.call(el.files);
        Promise.all(arquivos.map(function (f) { return processarImagem(f, 1200); })).then(function (urls) {
          urls.forEach(function (u, i) {
            rascunho.galeria.unshift({ img: u, titulo: arquivos[i].name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), tag: "Personagens", visivel: true });
          });
          marcarSujo(); render(); toast(urls.length + (urls.length === 1 ? " arte adicionada" : " artes adicionadas") + " no topo da galeria.");
        }).catch(function (err) { toast(err.message, true); });
      }
      if (el.hasAttribute("data-importar") && el.files[0]) {
        el.files[0].text().then(function (txt) {
          var dados = JSON.parse(txt);
          if (!dados || !dados.perfil || !dados.precos) throw new Error("Esse arquivo não parece uma cópia do site.");
          rascunho = mesclar(copiaProfunda(PADRAO), dados);
          marcarSujo(); aplicarNoPainel(); render(); toast("Cópia carregada. Confira e clique em Salvar.");
        }).catch(function (err) { toast("Não deu pra restaurar: " + err.message, true); });
      }
    });

    aba.addEventListener("click", function (e) {
      var b;
      if ((b = e.target.closest("[data-ir]"))) { irPara(b.dataset.ir); return; }
      if ((b = e.target.closest("[data-modo-cores]"))) {
        modoCores = b.dataset.modoCores;
        previa.tema = modoCores === "escuro" ? "dark" : "light";
        carregarPrevia(); render(); return;
      }
      if ((b = e.target.closest("[data-cores-padrao]"))) {
        rascunho.aparencia.modos[modoCores] = copiaProfunda(PADRAO.aparencia.modos[modoCores]);
        marcarSujo(); render(); toast("Cores originais do modo " + modoCores + " de volta. Lembre de salvar."); return;
      }
      if ((b = e.target.closest("[data-escolher]"))) { abrirEscolha(b.dataset.escolher); return; }
      if ((b = e.target.closest("[data-add]"))) {
        get(b.dataset.add).push(NOVOS[b.dataset.add]()); marcarSujo(); render();
        return;
      }
      if ((b = e.target.closest("[data-mover]"))) {
        var arr = get(b.dataset.l), i = Number(b.dataset.i), j = i + Number(b.dataset.mover);
        if (j < 0 || j >= arr.length) return;
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t; marcarSujo(); render(); return;
      }
      if ((b = e.target.closest("[data-remover]"))) {
        if (!confirm("Remover este item?")) return;
        get(b.dataset.l).splice(Number(b.dataset.i), 1); marcarSujo(); render(); return;
      }
      if ((b = e.target.closest("[data-vaga]"))) {
        var ses = rascunho.agenda.sessoes[Number(b.dataset.vaga)];
        ses.ocupadas = Math.max(0, Math.min(Number(ses.vagas) || 0, (Number(ses.ocupadas) || 0) + Number(b.dataset.d)));
        marcarSujo(); render(); return;
      }
      if ((b = e.target.closest("[data-limpar-img]"))) { set(b.dataset.limparImg, ""); limparMiniatura(b.dataset.limparImg); marcarSujo(); render(); return; }
      if ((b = e.target.closest("[data-paleta]"))) {
        var pal = PALETAS[b.dataset.paleta];
        rascunho.aparencia.cores = copiaProfunda(pal);
        var mc = rascunho.aparencia.modos;
        mc.claro.fundo = mc.claro.barra = pal.papel;
        mc.escuro.fundo = mc.escuro.barra = pal.noite;
        marcarSujo(); aplicarNoPainel(); render();
        toast("Paleta aplicada no painel. Salve pra levar pro site."); return;
      }
      if (e.target.closest("[data-exportar]")) {
        baixar("site-brupater-" + hojeTxt() + ".json", JSON.stringify(rascunho, null, 2)); return;
      }
      if (e.target.closest("[data-restaurar]")) {
        if (!confirm("Isso apaga todas as mudanças feitas no painel e volta o site para a versão original. Continuar?")) return;
        lojaRestaurarPadrao(); SITE = lojaCarregar(); rascunho = copiaProfunda(SITE); limparSujo(); aplicarNoPainel(); render();
        toast("Site restaurado para a versão original.");
      }
    });

    $("#abas").addEventListener("click", function (e) {
      var b = e.target.closest("[data-aba]");
      if (!b) return;
      irPara(b.dataset.aba);
    });

    function salvar() {
      try {
        lojaSalvar(rascunho);
        SITE = copiaProfunda(rascunho);
        limparSujo(); agendarPrevia();
        toast("Salvo! Neste navegador o site já mostra as mudanças.");
      } catch (err) { toast(err.message, true); }
    }
    $("#salvar-btn").addEventListener("click", salvar);
    $("#descartar").addEventListener("click", function () {
      rascunho = copiaProfunda(SITE); limparSujo(); aplicarNoPainel(); render(); agendarPrevia(); toast("Mudanças descartadas.");
    });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !$("#painel").hidden) { e.preventDefault(); if (sujo) salvar(); }
    });
    window.addEventListener("beforeunload", function (e) { if (sujo) { e.preventDefault(); e.returnValue = ""; } });
  }

  /* ===================== navegar entre abas ===================== */
  function irPara(id) {
    if (!ABAS.some(function (a) { return a.id === id; })) return;
    abaAtual = id;
    var a = ABAS.filter(function (x) { return x.id === id; })[0];
    if (a.previa && a.previa !== previa.pagina) { previa.pagina = a.previa; carregarPrevia(); }
    renderAbas(); render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ===================== prévia ao vivo =====================
     O rascunho vai pra PREVIA_CHAVE e o site, aberto num quadro com
     ?previa=1, redesenha sozinho a cada mudança (evento storage). */
  var previa = { pagina: "index.html", tema: "light", aparelho: "celular", aberta: false };
  var timerPrevia;
  function agendarPrevia() {
    clearTimeout(timerPrevia);
    timerPrevia = setTimeout(function () {
      if (!lojaPrevia(rascunho)) toast("A prévia não atualizou: as imagens enviadas estão ocupando muito espaço.", true);
    }, 250);
  }
  function carregarPrevia() {
    var f = $("#previa-frame");
    if (!f || !previa.aberta) return;
    lojaPrevia(rascunho);
    f.src = previa.pagina + (previa.pagina.indexOf("?") < 0 ? "?" : "&") + "previa=1&tema=" + previa.tema;
    pintarPrevia();
  }
  function pintarPrevia() {
    var box = $("#previa");
    if (!box) return;
    box.hidden = !previa.aberta;
    document.body.classList.toggle("com-previa", previa.aberta);
    $("#previa-btn").setAttribute("aria-pressed", String(previa.aberta));
    $("#previa-pagina").value = previa.pagina;
    Array.prototype.forEach.call(document.querySelectorAll("[data-previa-tema]"), function (b) { b.setAttribute("aria-pressed", String(b.dataset.previaTema === previa.tema)); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-previa-aparelho]"), function (b) { b.setAttribute("aria-pressed", String(b.dataset.previaAparelho === previa.aparelho)); });
    box.dataset.aparelho = previa.aparelho;
    escalarPrevia();
  }
  /* no modo "computador", o site (1280px) é encolhido pra caber no quadro */
  function escalarPrevia() {
    var tela = $("#previa-tela"), f = $("#previa-frame");
    if (!tela || !f) return;
    var larg = previa.aparelho === "computador" ? 1280 : 390;
    var fator = Math.min(1, tela.clientWidth / larg);
    f.style.width = larg + "px";
    f.style.height = (tela.clientHeight / fator) + "px";
    f.style.transform = "scale(" + fator + ")";
  }
  function ligarPrevia() {
    $("#previa-btn").addEventListener("click", function () {
      previa.aberta = !previa.aberta;
      try { localStorage.setItem("brupater:painel-previa", previa.aberta ? "1" : "0"); } catch (e) {}
      if (previa.aberta) carregarPrevia(); else pintarPrevia();
    });
    $("#previa-fechar").addEventListener("click", function () { $("#previa-btn").click(); });
    $("#previa-pagina").addEventListener("change", function (e) { previa.pagina = e.target.value; carregarPrevia(); });
    $("#previa").addEventListener("click", function (e) {
      var b = e.target.closest("[data-previa-tema]");
      if (b) { previa.tema = b.dataset.previaTema; carregarPrevia(); return; }
      b = e.target.closest("[data-previa-aparelho]");
      if (b) { previa.aparelho = b.dataset.previaAparelho; pintarPrevia(); }
    });
    window.addEventListener("resize", escalarPrevia);
    /* começa aberta no computador (tela larga); no celular, fica no botão */
    var guardado = null;
    try { guardado = localStorage.getItem("brupater:painel-previa"); } catch (e) {}
    previa.aberta = guardado ? guardado === "1" : window.innerWidth >= 1280;
  }

  /* ===================== escolher imagem das minhas artes ===================== */
  var escolhendo = null;
  function abrirEscolha(caminho) {
    escolhendo = caminho;
    var vistas = {}, itens = [];
    function add(img, mini, titulo) {
      if (!img || vistas[img] || /^data:/.test(img) && !mini) return;
      vistas[img] = 1; itens.push({ img: img, mini: mini || img, titulo: titulo || "" });
    }
    rascunho.galeria.forEach(function (o) { add(o.img, o.mini, o.titulo); });
    rascunho.projetos.forEach(function (p) { add(p.capa, "", p.titulo); (p.imagens || []).forEach(function (i) { add(i.img, "", p.titulo); }); });
    $("#escolher-grade").innerHTML = itens.map(function (o) {
      return '<button type="button" class="escolher-item" data-pegar="' + esc(o.img) + '"><img src="' + esc(urlSegura(o.mini, true)) + '" alt="" loading="lazy"><span>' + esc(o.titulo) + "</span></button>";
    }).join("");
    $("#escolher").showModal();
  }
  function ligarEscolha() {
    var d = $("#escolher");
    d.addEventListener("click", function (e) {
      if (e.target === d || e.target.closest("[data-fechar-escolha]")) { d.close(); return; }
      var b = e.target.closest("[data-pegar]");
      if (!b || !escolhendo) return;
      set(escolhendo, b.dataset.pegar); limparMiniatura(escolhendo);
      var g = rascunho.galeria.filter(function (o) { return o.img === b.dataset.pegar; })[0];
      var mt = /^galeria\.(\d+)\.img$/.exec(escolhendo);
      if (g && mt) { var o = rascunho.galeria[Number(mt[1])]; o.mini = g.mini; o.w = g.w; o.h = g.h; }
      if (escolhendo === "precos.tabela.img") { delete rascunho.precos.tabela.w; delete rascunho.precos.tabela.h; }
      d.close(); marcarSujo(); render(); toast("Imagem trocada. Lembre de salvar.");
    });
  }

  /* ===================== login ===================== */
  function logado() { try { return sessionStorage.getItem(CHAVE_SESSAO) === "1"; } catch (e) { return false; } }
  function mostrar() {
    var ok = logado();
    $("#login").hidden = ok;
    $("#painel").hidden = !ok;
    document.body.classList.toggle("em-login", !ok);
    if (ok) { aplicarNoPainel(); renderAbas(); render(); agendarPrevia(); if (previa.aberta) carregarPrevia(); else pintarPrevia(); }
  }

  $("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var u = $("#login-usuario").value.trim().toLowerCase(), s = $("#login-senha").value;
    if (u === USUARIO && s === SENHA) {
      try { sessionStorage.setItem(CHAVE_SESSAO, "1"); } catch (err) {}
      $("#login-erro").hidden = true;
      mostrar();
    } else {
      $("#login-erro").hidden = false;
    }
  });
  $("#sair").addEventListener("click", function () {
    if (sujo && !confirm("Tem mudanças não salvas. Sair mesmo assim?")) return;
    try { sessionStorage.removeItem(CHAVE_SESSAO); } catch (err) {}
    limparSujo(); rascunho = copiaProfunda(SITE);
    mostrar();
  });

  /* o painel mostra todas as fontes disponíveis, pra Bru comparar antes de escolher */
  (function carregarTodasAsFontes() {
    var familias = [];
    Object.keys(OPCOES_FONTES).forEach(function (k) { OPCOES_FONTES[k].forEach(function (f) { if (familias.indexOf(f) < 0 && f !== "Montserrat") familias.push(f); }); });
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?" + familias.map(function (f) { return "family=" + f.replace(/ /g, "+"); }).join("&") + "&display=swap";
    document.head.appendChild(l);
  })();

  ligarEventos();
  ligarPrevia();
  ligarEscolha();
  mostrar();
})();
