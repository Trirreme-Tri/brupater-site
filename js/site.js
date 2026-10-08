"use strict";

/*
 * Desenha as páginas públicas a partir de SITE (carregado em js/tema.js).
 * Cada função de desenho só roda se a página tiver o lugar dela — assim o
 * mesmo arquivo serve pra Início, Portfólio, Agenda e Encomendas.
 */

/* ===== contato: WhatsApp se tiver número, senão DM do Instagram ===== */
function contatoTemWhats() { return !!String(SITE.perfil.whatsapp || "").replace(/\D/g, ""); }
function contatoLink(texto) {
  var num = String(SITE.perfil.whatsapp || "").replace(/\D/g, "");
  if (num) return "https://wa.me/" + num + (texto ? "?text=" + encodeURIComponent(texto) : "");
  return "https://ig.me/m/" + encodeURIComponent(SITE.perfil.instagram || "");
}
function instagramUrl() { return "https://www.instagram.com/" + encodeURIComponent(SITE.perfil.instagram || "") + "/"; }

function copiarTexto(txt) {
  return new Promise(function (ok, falha) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, tentar);
    else tentar();
    function tentar() {
      var ta = document.createElement("textarea");
      ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) { falha(e); }
      document.body.removeChild(ta);
    }
  });
}

var timerAviso;
function avisoSite(txt) {
  var el = document.getElementById("aviso-site");
  if (!el) return;
  el.textContent = txt;
  el.classList.add("visivel");
  clearTimeout(timerAviso);
  timerAviso = setTimeout(function () { el.classList.remove("visivel"); }, 5000);
}

var TITULOS_ESTADO = { aberta: "Encomendas abertas", esgotado: "Vagas esgotadas", fechada: "Encomendas fechadas" };
var CLASSE_ESTADO = { aberta: "", esgotado: "esgotado", fechada: "fechada" };
function etiquetaHtml(estado) {
  var txt = (SITE.agenda.etiquetas || {})[estado] || TITULOS_ESTADO[estado];
  return '<span class="etiqueta ' + CLASSE_ESTADO[estado] + '">' + esc(txt) + "</span>";
}
var MSG_AVISAR = "Oi, Bru! Quero ser avisada(o) quando a próxima agenda de encomendas abrir ✨";

var TIPOS_EVENTO = {
  abertura:   { nome: "Abertura", cor: "var(--rosa)" },
  fechamento: { nome: "Fechamento", cor: "var(--cine-ink)" },
  entrega:    { nome: "Entrega", cor: "var(--teal)" },
  aviso:      { nome: "Aviso", cor: "var(--violeta)" }
};

var Site = (function () {
  var $ = function (s) { return document.querySelector(s); };
  var tem = function (s) { return !!document.querySelector(s); };
  var filtroAtual = "Todos";
  var mesCal = null;

  function img(url) { return urlSegura(url, true); }

  /* ===== comum ===== */
  function renderAvatar() {
    var a = img(SITE.perfil.avatar) || "assets/avatar.webp";
    Array.prototype.forEach.call(document.querySelectorAll(".js-avatar"), function (el) { el.src = a; });
    var nc = $(".js-nome-curto");
    /* a Bru pediu o nome menor, no canto superior esquerdo */
    if (nc) nc.textContent = SITE.perfil.nome || String(SITE.perfil.handle || "").replace(/^[_.@]+/, "");
  }
  function renderRodape() {
    if (!tem("#rod-nome")) return;
    $("#rod-assinatura").textContent = SITE.perfil.assinatura ? SITE.perfil.assinatura + " ✦" : "";
    $("#rod-nome").textContent = SITE.perfil.nome;
    $("#rod-ig").href = instagramUrl();
    $("#rod-ig").textContent = "@" + SITE.perfil.instagram;
  }
  /* cabeçalho de cinema das páginas internas */
  function renderCabecalho() {
    var cab = $("#cabecalho");
    if (!cab) return;
    var c = (SITE.cenas.paginas || {})[document.body.dataset.pagina] || {};
    var fundo = cab.querySelector(".cab-img");
    fundo.style.backgroundImage = "url('" + img(c.img) + "')";
    fundo.style.setProperty("--foco", c.foco || "50% 40%");
    medirArte(cab, img(c.img));
    cab.querySelector(".cab-titulo").textContent = c.titulo || "";
    cab.querySelector(".cab-sub").textContent = c.sub || "";
  }

  /* A arte do topo fica encostada à direita na altura toda. Pra borda esquerda
     dela se dissolver no degradê (sem corte reto), o CSS precisa saber onde a
     arte começa: calculamos isso pelo tamanho real da imagem (--arte-ini). */
  var medirTimer;
  function medirArte(cab, url) {
    if (!url) return;
    var im = new Image();
    im.onload = function () {
      function medir() {
        var box = cab.querySelector(".cab-img");
        if (!box || !im.naturalHeight) return;
        var larg = box.clientHeight * im.naturalWidth / im.naturalHeight;
        var ini = Math.max(0, (box.clientWidth - larg) / box.clientWidth * 100);
        box.style.setProperty("--arte-ini", ini.toFixed(1) + "%");
      }
      medir();
      window.addEventListener("resize", function () { clearTimeout(medirTimer); medirTimer = setTimeout(medir, 150); });
    };
    im.src = url;
  }

  /* ===== início ===== */
  /* topo da página inicial: textos e etiqueta (as artes do carrossel ficam no js/vitrine.js) */
  function renderAbertura() {
    if (!tem("#abertura")) return;
    var c = SITE.cenas.abertura, p = SITE.perfil;
    $("#ab-kicker").textContent = c.kicker || p.titulo;
    $("#ab-h1").textContent = (p.nome || "") + (p.titulo ? " · " + p.titulo : "");
    $("#ab-frase").textContent = p.frase;
    $("#ab-legenda").textContent = c.legenda;
    /* (a música fica só no mini player do canto, js/musica.js) */
    var ag = estadoAgenda();
    $("#ab-status").innerHTML = '<a href="agenda.html" aria-label="' + esc(TITULOS_ESTADO[ag.estado]) + ', ver agenda">' + etiquetaHtml(ag.estado) + "</a>";
  }

  function renderLinks() {
    if (!tem("#links")) return;
    $("#links").innerHTML = SITE.links.filter(function (l) { return l.visivel !== false; }).map(function (l) {
      var url = urlSegura(l.url) || "#";
      var externo = /^https?:/i.test(url);
      return '<a class="link surge" href="' + esc(url) + '"' + (externo ? ' target="_blank" rel="noopener"' : "") + ">" +
        '<span class="ico">' + iconeSvg(l.icone) + "</span>" +
        '<span><span class="nome">' + esc(l.nome) + '</span><span class="desc">' + esc(l.desc) + "</span></span>" +
        '<span class="seta" aria-hidden="true">' + (externo ? "&#8599;" : "&#8594;") + "</span></a>";
    }).join("");
  }

  /* espaço dos dois lados do separador: sem ele a linha inteira vira uma
     "palavra" só e não quebra no celular */
  var SEP = ' <span class="sep" aria-hidden="true">&#10022;</span> ';
  function linhaFicha(itens) {
    return itens.map(function (f) {
      var valores = String(f.valor || "").split("·").map(function (v) { return esc(v.trim()); }).filter(Boolean);
      return '<span class="r">' + esc(f.rotulo) + "</span>" + SEP + valores.join(SEP);
    }).join(SEP);
  }
  function renderFicha() {
    if (!tem("#ficha")) return;
    var s = SITE.sobre;
    $("#ficha-retrato").src = img(s.retrato) || img(SITE.perfil.avatar) || "assets/avatar.webp";
    $("#ficha-nome").textContent = SITE.perfil.nome;
    $("#ficha-lista").innerHTML = linhaFicha(s.ficha || []);
    var ex = $("#ficha-extra");
    ex.hidden = !(s.extra && s.extra.valor);
    if (!ex.hidden) ex.innerHTML = linhaFicha([s.extra]);
    $("#ficha-palavra").textContent = s.palavra || "";
    $("#ficha-arte").src = img(s.imagem) || "assets/obras/hey.webp";
    $("#ficha-texto").textContent = s.texto;
    /* o lema do pôster: a última frase ganha a cor de destaque, como no Oásis */
    var frases = String(s.lema || "").replace(/([.!?])\s+/g, "$1\n").split("\n");
    var ultima = frases.length > 1 ? frases.pop() : "";
    $("#ficha-lema").innerHTML = esc(frases.join(" ")) + (ultima ? "<br><em>" + esc(ultima) + "</em>" : "");
    $("#ano").textContent = new Date().getFullYear();
  }

  function renderInterludio(id, cena) {
    var sec = document.getElementById(id);
    if (!sec || !cena) return;
    var fundo = sec.querySelector(".interludio-img");
    fundo.style.backgroundImage = "url('" + img(cena.img) + "')";
    fundo.style.setProperty("--foco", cena.foco || "50% 40%");
    sec.querySelector(".interludio-frase p").textContent = cena.frase;
    sec.querySelector(".interludio-frase cite").textContent = cena.credito;
    sec.setAttribute("aria-label", cena.frase || "Interlúdio");
  }

  /* cartões das outras páginas, na página inicial */
  function renderChamadas() {
    if (!tem("#chamadas")) return;
    var pg = SITE.cenas.paginas || {};
    var ag = estadoAgenda();
    var txtAgenda = ag.estado === "aberta" ? ag.atual.livres + (ag.atual.livres === 1 ? " vaga livre" : " vagas livres") + " · " + ag.atual.sessao.nome
      : (ag.proxima ? "Próxima: " + ag.proxima.sessao.nome + " · abre " + dataExtenso(ag.proxima.abre) : TITULOS_ESTADO[ag.estado]);
    var cartoes = [
      { href: "portfolio.html", n: "03", c: pg.portfolio, extra: obrasVisiveis().length + " artes" },
      { href: "agenda.html", n: "04", c: pg.agenda, extra: txtAgenda, etiqueta: etiquetaHtml(ag.estado) },
      { href: "encomendas.html", n: "05", c: pg.encomendas, extra: "a partir de " + brl(Math.min.apply(null, SITE.precos.enquadramentos.map(function (e) { return Number(e.preco) || 0; }).concat([Infinity]))) }
    ];
    $("#chamadas").innerHTML = cartoes.map(function (k) {
      var c = k.c || {};
      return '<a class="chamada surge" href="' + k.href + '">' +
        '<span class="chamada-img" style="background-image:url(\'' + esc(img(c.img)) + '\');--foco:' + esc(c.foco || "50% 40%") + '"></span>' +
        '<span class="chamada-txt">' +
        (k.etiqueta || "") +
        '<span class="chamada-t t-cinema">' + esc(c.titulo) + "</span>" +
        '<span class="chamada-sub">' + esc(c.sub) + "</span>" +
        '<span class="chamada-extra">' + esc(k.extra) + ' <b aria-hidden="true">&#8594;</b></span></span></a>';
    }).join("");
  }

  /* ===== portfólio ===== */
  function obrasVisiveis() { return SITE.galeria.filter(function (o) { return o.visivel !== false && img(o.img); }); }
  function renderGaleria() {
    if (!tem("#galeria")) return;
    var obras = obrasVisiveis();
    var tags = ["Todos"];
    obras.forEach(function (o) { if (o.tag && tags.indexOf(o.tag) < 0) tags.push(o.tag); });
    if (tags.indexOf(filtroAtual) < 0) filtroAtual = "Todos";
    $("#filtros").innerHTML = tags.map(function (t) {
      return '<button type="button" class="filtro" data-tag="' + esc(t) + '" aria-pressed="' + (t === filtroAtual) + '">' + esc(t) + "</button>";
    }).join("");
    $("#galeria").innerHTML = obras.map(function (o, i) {
      var sai = filtroAtual !== "Todos" && o.tag !== filtroAtual;
      return '<button type="button" class="obra surge' + (sai ? " sai" : "") + '" data-i="' + i + '" aria-label="Ver ' + esc(o.titulo || "arte") + ' em tela cheia">' +
        '<figure style="margin:0"><img src="' + esc(img(o.mini) || img(o.img)) + '" alt="' + esc(o.titulo || "Arte da Brunna") + '"' +
        (o.w && o.h ? ' width="' + o.w + '" height="' + o.h + '"' : "") + ' loading="lazy" decoding="async">' +
        "<figcaption><small>" + esc(o.tag) + "</small><b>" + esc(o.titulo) + "</b></figcaption></figure></button>";
    }).join("");
    $("#galeria-ig").href = instagramUrl();
  }

  /* ===== agenda ===== */
  function estrela(cheia) {
    return '<svg viewBox="0 0 24 24" class="' + (cheia ? "cheia" : "vazia") + '" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>';
  }
  function estrelas(ocupadas, total) {
    var h = "";
    for (var i = 0; i < total; i++) h += estrela(i < ocupadas);
    return '<div class="estrelas" role="img" aria-label="' + ocupadas + " de " + total + ' vagas preenchidas">' + h + "</div>";
  }
  function ctaAvisar(classe) {
    return '<button type="button" class="btn ' + (classe || "") + '" data-avisar>Me avisa quando abrir</button>';
  }

  function renderStatus() {
    if (!tem("#agenda-status")) return;
    var ag = estadoAgenda(), a = SITE.agenda;
    var esq, dir = "";
    if (ag.estado === "aberta") {
      esq = '<div class="st-num"><span class="rotulo">vagas livres</span><strong>' + ag.atual.livres + "</strong><small>de " + ag.atual.vagas + " · " + esc(ag.atual.sessao.nome) + "</small></div>";
      dir = '<div class="st-num"><span class="rotulo">vagas preenchidas</span>' + estrelas(ag.atual.ocupadas, ag.atual.vagas) + "<small>" + ag.atual.ocupadas + " de " + ag.atual.vagas + "</small></div>";
    } else {
      if (ag.proxima && a.mostrarContagem) {
        var d = diasAte(ag.proxima.abre);
        esq = '<div class="st-num"><span class="rotulo">próxima agenda abre em</span><strong>' + (d === 0 ? "hoje" : d) + "</strong><small>" + (d === 0 ? "" : (d === 1 ? "dia · " : "dias · ")) + esc(dataExtenso(ag.proxima.abre)) + "</small></div>";
      } else if (ag.proxima) {
        esq = '<div class="st-num"><span class="rotulo">próxima agenda</span><strong>' + String(ag.proxima.abre.getDate()).padStart(2, "0") + "/" + String(ag.proxima.abre.getMonth() + 1).padStart(2, "0") + "</strong><small>" + esc(dataExtenso(ag.proxima.abre)) + "</small></div>";
      } else {
        esq = '<div class="st-num"><span class="rotulo">próxima agenda</span><strong>em breve</strong><small>fique de olho no Instagram</small></div>';
      }
      if (ag.proxima) dir = '<div class="st-num"><span class="rotulo">' + esc(ag.proxima.sessao.nome) + "</span>" + estrelas(0, ag.proxima.vagas) + "<small>" + ag.proxima.vagas + " vagas</small></div>";
    }
    var ctas = ag.estado === "aberta"
      ? '<a class="btn cheio" href="encomendas.html">Garantir minha vaga</a><a class="btn" href="' + esc(contatoLink("")) + '" target="_blank" rel="noopener">Tirar dúvida</a>'
      : ctaAvisar("cheio") + '<a class="btn" href="encomendas.html">Simular meu pedido</a>';

    $("#agenda-status").innerHTML =
      '<div class="st-topo">' + etiquetaHtml(ag.estado) + "</div>" +
      '<h2 class="st-titulo">' + esc(TITULOS_ESTADO[ag.estado]) + "</h2>" +
      '<p class="st-aviso">' + esc((a.avisos || {})[ag.estado] || "") + "</p>" +
      '<div class="st-numeros">' + esq + dir + "</div>" +
      '<div class="st-ctas">' + ctas + "</div>" +
      (ag.estado !== "aberta" ? '<p class="st-nota">O botão copia a mensagem e abre a minha DM: é só colar e enviar.</p>' : "");
  }

  var NOMES_SESSAO = { aberta: "Aberta", esgotado: "Esgotado", embreve: "Em breve", encerrada: "Encerrada" };
  function renderSessoes() {
    if (!tem("#agenda-sessoes")) return;
    var lista = sessoesOrdenadas();
    var hoje = hojeZero();
    /* esconde sessões antigas que já acabaram: mostra a atual e as próximas */
    var ag = estadoAgenda();
    var visiveis = lista.filter(function (x) { return x.abre >= hoje || (ag.atual && x.sessao === ag.atual.sessao); });
    $("#agenda-sessoes").innerHTML = visiveis.length ? visiveis.map(function (x) {
      var estado = SITE.agenda.pausa && x.estado === "aberta" ? "encerrada" : x.estado;
      var info = estado === "embreve" ? "abre em " + dataExtenso(x.abre)
        : estado === "aberta" ? x.livres + (x.livres === 1 ? " vaga livre" : " vagas livres")
        : estado === "esgotado" ? "todas as " + x.vagas + " vagas preenchidas" : "agenda encerrada";
      return '<li class="sessao ' + estado + ' surge">' +
        '<div class="sessao-cab">' + (estado === "esgotado"
          ? '<span class="carimbo">' + esc((SITE.agenda.etiquetas || {}).esgotado || "Esgotado") + "</span>"
          : '<span class="sessao-chip">' + NOMES_SESSAO[estado] + "</span>") + "</div>" +
        '<h3 class="sessao-nome">' + esc(x.sessao.nome) + "</h3>" +
        estrelas(x.ocupadas, x.vagas) +
        '<p class="sessao-info">' + esc(info) + "</p>" +
        (x.sessao.nota ? '<p class="sessao-nota">' + esc(x.sessao.nota) + "</p>" : "") +
        (estado === "aberta" ? '<a class="btn cheio" href="encomendas.html">Garantir minha vaga</a>' : estado === "embreve" ? ctaAvisar("") : "") +
        "</li>";
    }).join("") : '<li class="vazio-cine">Nenhuma agenda marcada por enquanto. Fique de olho no Instagram!</li>';
  }

  /* datas manuais + aberturas das sessões, tudo junto */
  function eventosOrdenados() {
    var manuais = (SITE.agenda.eventos || []).map(function (e) { return { e: e, d: dataLocal(e.data) }; });
    var sessoes = sessoesOrdenadas().map(function (x) {
      return { e: { tipo: "abertura", titulo: "Abre: " + x.sessao.nome, desc: x.vagas + (x.vagas === 1 ? " vaga" : " vagas") + (x.sessao.nota ? " · " + x.sessao.nota : "") }, d: x.abre };
    });
    return manuais.concat(sessoes).filter(function (x) { return x.d; }).sort(function (a, b) { return a.d - b.d; });
  }

  function renderCalendario() {
    if (!tem("#agenda-cal")) return;
    var hoje = hojeZero();
    if (!mesCal) mesCal = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    var ano = mesCal.getFullYear(), mes = mesCal.getMonth();
    var porDia = {};
    eventosOrdenados().forEach(function (x) {
      if (x.d.getFullYear() === ano && x.d.getMonth() === mes) (porDia[x.d.getDate()] = porDia[x.d.getDate()] || []).push(x.e);
    });
    var inicio = new Date(ano, mes, 1).getDay();
    var diasMes = new Date(ano, mes + 1, 0).getDate();
    var cel = ["D", "S", "T", "Q", "Q", "S", "S"].map(function (s) { return '<span class="cal-sem" aria-hidden="true">' + s + "</span>"; });
    for (var i = 0; i < inicio; i++) cel.push('<span class="cal-dia fora"></span>');
    for (var d = 1; d <= diasMes; d++) {
      var data = new Date(ano, mes, d), evs = porDia[d];
      var cls = ["cal-dia"];
      if (data < hoje) cls.push("passado");
      if (data.getTime() === hoje.getTime()) cls.push("hoje");
      if (evs) {
        cls.push("marcado");
        if (evs.some(function (e) { return e.tipo === "abertura"; })) cls.push("dia-abertura");
        var cor = (TIPOS_EVENTO[evs[0].tipo] || TIPOS_EVENTO.aviso).cor;
        cel.push('<button type="button" class="' + cls.join(" ") + '" data-dia="' + d + '" style="--cor-ev:' + cor + '" aria-label="' + d + " de " + MESES[mes] + ": " + esc(evs.map(function (e) { return e.titulo; }).join(", ")) + '">' + d + "</button>");
      } else {
        cel.push('<span class="' + cls.join(" ") + '">' + d + "</span>");
      }
    }
    var legenda = Object.keys(TIPOS_EVENTO).map(function (k) { return '<span style="--c:' + TIPOS_EVENTO[k].cor + '">' + TIPOS_EVENTO[k].nome + "</span>"; }).join("");
    $("#agenda-cal").innerHTML =
      '<div class="cal-topo"><h3 class="cal-mes">' + MESES[mes] + ' <small style="font-size:.55em;opacity:.6">' + ano + "</small></h3>" +
      '<div class="cal-nav"><button type="button" data-cal="-1" aria-label="Mês anterior">&#8592;</button><button type="button" data-cal="1" aria-label="Próximo mês">&#8594;</button></div></div>' +
      '<div class="cal-grade">' + cel.join("") + "</div>" +
      '<p class="cal-detalhe" id="cal-detalhe" aria-live="polite">' + (Object.keys(porDia).length ? "Toque num dia marcado para ver o que acontece." : "Nenhuma data marcada neste mês.") + "</p>" +
      '<div class="legenda">' + legenda + "</div>";
    $("#agenda-cal").porDia = porDia;
  }

  function renderEventos() {
    if (!tem("#agenda-eventos")) return;
    var hoje = hojeZero();
    /* só o que ainda vai acontecer (e o que passou nos últimos 7 dias) */
    var lista = eventosOrdenados().filter(function (x) { return x.d >= new Date(hoje.getTime() - 7 * 86400000); });
    $("#agenda-eventos").innerHTML = lista.length ? lista.map(function (x) {
      var t = TIPOS_EVENTO[x.e.tipo] || TIPOS_EVENTO.aviso;
      return '<li class="ev' + (x.d < hoje ? " passado" : "") + '" style="--cor-ev:' + t.cor + '">' +
        '<div class="ev-data"><b>' + String(x.d.getDate()).padStart(2, "0") + "</b><small>" + MESES[x.d.getMonth()].slice(0, 3) + "</small></div>" +
        '<div><span class="ev-tipo">' + t.nome + '</span><span class="ev-titulo">' + esc(x.e.titulo) + '</span><span class="ev-desc">' + esc(x.e.desc) + "</span></div></li>";
    }).join("") : '<li class="vazio-cine">Nenhuma data marcada por enquanto.</li>';
  }

  function renderFila() {
    if (!tem("#agenda-fila")) return;
    var etapas = SITE.agenda.etapas || [];
    var n = etapas.length;
    var fila = SITE.agenda.fila || [];
    $("#agenda-fila").innerHTML = fila.length ? fila.map(function (f) {
      var e = Math.max(0, Math.min(n - 1, Number(f.etapa) || 0));
      var barras = "";
      for (var i = 0; i < n; i++) barras += '<i class="' + (i < e || e === n - 1 ? "ok" : (i === e ? "agora" : "")) + '"></i>';
      return '<li class="fila-item"><div class="fila-cab"><span><b>' + esc(f.nome) + "</b> <small>" + esc(f.detalhe) + '</small></span><span class="fila-etapa">' + esc(etapas[e] || "") + "</span></div>" +
        '<div class="fila-barra" style="--n:' + n + '" role="img" aria-label="Etapa ' + (e + 1) + " de " + n + ": " + esc(etapas[e] || "") + '">' + barras + "</div></li>";
    }).join("") : '<li class="vazio-cine">A fila está vazia agora.</li>';
  }

  /* ===== encomendas: perguntas ===== */
  function renderFaq() {
    if (!tem("#faq")) return;
    $("#faq").innerHTML = SITE.faq.map(function (f) {
      return '<details class="surge"><summary>' + esc(f.p) + '</summary><p class="resp">' + esc(f.r) + "</p></details>";
    }).join("");
  }

  /* botão flutuante do WhatsApp (criado no js/layout.js) — só aparece com número */
  function renderWhats() {
    var b = $("#whats-flut");
    if (!b) return;
    var p = SITE.perfil;
    b.hidden = !contatoTemWhats() || p.whatsappFlutuante === false;
    b.href = contatoLink(p.whatsappMensagem || "");
    var txt = p.whatsappBotao || "Fale comigo no WhatsApp";
    b.querySelector(".wf-txt").textContent = txt;
    b.querySelector(".wf-ico").innerHTML = iconeSvg("whatsapp");
    b.setAttribute("aria-label", txt);
  }

  function renderTudo() {
    renderAvatar();
    renderWhats();
    renderCabecalho();
    renderAbertura();
    renderLinks();
    renderFicha();
    renderInterludio("interludio1", SITE.cenas.interludio1);
    renderInterludio("interludio2", SITE.cenas.interludio2);
    renderChamadas();
    renderGaleria();
    renderStatus();
    renderSessoes();
    renderCalendario();
    renderEventos();
    renderFila();
    renderFaq();
    renderRodape();
    Cinema.observar();
  }

  function ligarEventos() {
    document.addEventListener("click", function (e) {
      var av = e.target.closest("[data-avisar]");
      if (av) {
        var link = contatoLink(MSG_AVISAR);
        if (contatoTemWhats()) { window.open(link, "_blank", "noopener"); return; }
        /* DM do Instagram não aceita texto pronto: copia antes de abrir */
        copiarTexto(MSG_AVISAR).then(function () { avisoSite("Mensagem copiada! Cole na DM que vai abrir e envie ✨"); }, function () {});
        window.open(link, "_blank", "noopener");
        return;
      }
      var f = e.target.closest(".filtro");
      if (f) {
        filtroAtual = f.dataset.tag;
        Array.prototype.forEach.call(document.querySelectorAll(".filtro"), function (b) { b.setAttribute("aria-pressed", String(b === f)); });
        var obras = obrasVisiveis();
        Array.prototype.forEach.call(document.querySelectorAll(".obra"), function (el) {
          var o = obras[Number(el.dataset.i)];
          el.classList.toggle("sai", filtroAtual !== "Todos" && o.tag !== filtroAtual);
        });
        return;
      }
      var obra = e.target.closest(".obra");
      if (obra) {
        var visiveis = obrasVisiveis().filter(function (o) { return filtroAtual === "Todos" || o.tag === filtroAtual; });
        var atual = obrasVisiveis()[Number(obra.dataset.i)];
        Cinema.lbAbrir(visiveis.map(function (o) { return { src: img(o.img), titulo: o.titulo }; }), visiveis.indexOf(atual), obra);
        return;
      }
      var nav = e.target.closest("[data-cal]");
      if (nav) {
        mesCal = new Date(mesCal.getFullYear(), mesCal.getMonth() + Number(nav.dataset.cal), 1);
        renderCalendario();
        return;
      }
      var dia = e.target.closest(".cal-dia[data-dia]");
      if (dia) {
        Array.prototype.forEach.call(document.querySelectorAll(".cal-dia.sel"), function (d) { d.classList.remove("sel"); });
        dia.classList.add("sel");
        var evs = $("#agenda-cal").porDia[dia.dataset.dia] || [];
        $("#cal-detalhe").innerHTML = evs.map(function (ev) { return "<b>" + esc(ev.titulo) + "</b> · " + esc(ev.desc); }).join("<br>");
      }
    });

    /* o painel salvou em outra aba? redesenha na hora, sem recarregar */
    window.addEventListener("storage", function (e) {
      if (e.key !== lojaChaveAtual()) return;
      SITE = lojaCarregar();
      temaAplicar(SITE);
      renderTudo();
      if (window.Encomenda) Encomenda.recarregar();
      if (window.Vitrine) Vitrine.montar();
      if (window.Projetos) Projetos.render();
      if (window.Musica) Musica.montar();
      Cinema.pintarBotaoTema();
    });

    /* na prévia do painel, os links entre páginas continuam na prévia */
    if (PREVIA) document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]");
      if (!a || a.target === "_blank") return;
      var h = a.getAttribute("href");
      if (!/^[\w-]+\.html/.test(h) || /previa=1/.test(h)) return;
      var extra = location.search.replace(/^\?/, "");
      a.setAttribute("href", h.replace(/(\.html)(\?)?/, function (m, html, q) { return html + "?" + extra + (q ? "&" : ""); }));
    }, true);

    /* o texto do botão do WhatsApp aparece no topo da página; ao rolar, fica
       só o ícone, pra não cobrir o conteúdo */
    var wf = $("#whats-flut"), pedindo = false;
    if (wf) window.addEventListener("scroll", function () {
      if (pedindo) return;
      pedindo = true;
      requestAnimationFrame(function () { wf.classList.toggle("compacto", window.scrollY > 240); pedindo = false; });
    }, { passive: true });
  }

  function iniciar() {
    renderTudo();
    ligarEventos();
    Cinema.iniciar();
  }

  return { iniciar: iniciar, renderTudo: renderTudo };
})();

Site.iniciar();
