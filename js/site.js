"use strict";

/*
 * Desenha a página pública a partir de SITE (js/tema.js carrega com
 * lojaCarregar()). Nada de conteúdo fixo aqui: tudo vem de SITE.
 */

/* ===== contato: WhatsApp se tiver número, senão DM do Instagram ===== */
function contatoTemWhats() { return !!String(SITE.perfil.whatsapp || "").replace(/\D/g, ""); }
function contatoLink(texto) {
  var num = String(SITE.perfil.whatsapp || "").replace(/\D/g, "");
  if (num) return "https://wa.me/" + num + (texto ? "?text=" + encodeURIComponent(texto) : "");
  return "https://ig.me/m/" + encodeURIComponent(SITE.perfil.instagram || "");
}
function instagramUrl() { return "https://www.instagram.com/" + encodeURIComponent(SITE.perfil.instagram || "") + "/"; }

/* datas "AAAA-MM-DD" viram data local (sem o fuso empurrar pro dia anterior) */
function dataLocal(txt) {
  var p = String(txt || "").split("-").map(Number);
  if (p.length !== 3 || !p[0]) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}
function hojeZero() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
function dataExtenso(d) { return d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear(); }

var STATUS = {
  aberta:  { etiqueta: "Commissions open", classe: "", titulo: "Encomendas abertas" },
  espera:  { etiqueta: "Lista de espera", classe: "espera", titulo: "Lista de espera aberta" },
  fechada: { etiqueta: "Comms closed", classe: "fechada", titulo: "Encomendas fechadas" }
};
var TIPOS_EVENTO = {
  abertura:   { nome: "Abertura", cor: "var(--rosa)" },
  fechamento: { nome: "Fechamento", cor: "var(--cine-ink)" },
  entrega:    { nome: "Entrega", cor: "var(--teal)" },
  aviso:      { nome: "Aviso", cor: "var(--violeta)" }
};

var Site = (function () {
  var $ = function (s) { return document.querySelector(s); };
  var filtroAtual = "Todos";
  var mesCal = null; // primeiro dia do mês mostrado no calendário

  function img(url) { return urlSegura(url, true); }

  function renderAvatar() {
    var a = img(SITE.perfil.avatar) || "assets/avatar.webp";
    Array.prototype.forEach.call(document.querySelectorAll(".js-avatar"), function (el) { el.src = a; });
    var ret = $("#ficha-retrato");
    if (ret) ret.src = img(SITE.sobre.retrato) || a;
    var nc = $(".js-nome-curto");
    if (nc) nc.textContent = String(SITE.perfil.handle || "brupater").replace(/^[_.@]+/, "");
  }

  function renderAbertura() {
    var c = SITE.cenas.abertura, p = SITE.perfil;
    var fundo = $("#abertura-img");
    fundo.style.backgroundImage = "url('" + img(c.img) + "')";
    fundo.style.setProperty("--foco", c.foco || "50% 40%");
    $("#ab-kicker").textContent = c.kicker || p.titulo;
    var partes = String(p.nome || "").trim().split(/\s+/);
    var l1 = partes.shift() || "", l2 = partes.join(" ");
    $("#ab-nome").innerHTML = '<span class="linha"><span>' + esc(l1) + "</span></span>" + (l2 ? '<span class="linha"><span>' + esc(l2) + "</span></span>" : "");
    $("#ab-frase").textContent = p.frase;
    $("#ab-legenda").textContent = c.legenda;

    var trilha = $("#ab-trilha"), url = urlSegura(p.trilha && p.trilha.url);
    trilha.hidden = !url;
    if (url) { trilha.href = url; $("#ab-trilha-txt").textContent = p.trilha.texto || "Dar play"; }

    var st = STATUS[SITE.agenda.status] || STATUS.fechada;
    $("#ab-status").innerHTML = '<a href="#agenda" aria-label="' + esc(st.titulo) + ', ver agenda"><span class="etiqueta ' + st.classe + '">' + esc(st.etiqueta) + "</span></a>";
  }

  function renderLinks() {
    $("#links").innerHTML = SITE.links.filter(function (l) { return l.visivel !== false; }).map(function (l) {
      var url = urlSegura(l.url) || "#";
      var externo = /^https?:/i.test(url);
      return '<a class="link surge" href="' + esc(url) + '"' + (externo ? ' target="_blank" rel="noopener"' : "") + ">" +
        '<span class="ico">' + iconeSvg(l.icone) + "</span>" +
        '<span><span class="nome">' + esc(l.nome) + '</span><span class="desc">' + esc(l.desc) + "</span></span>" +
        '<span class="seta" aria-hidden="true">' + (externo ? "&#8599;" : "&#8595;") + "</span></a>";
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
    var s = SITE.sobre;
    $("#ficha-nome").textContent = SITE.perfil.nome;
    $("#ficha-lista").innerHTML = linhaFicha(s.ficha || []);
    var ex = $("#ficha-extra");
    ex.hidden = !(s.extra && s.extra.valor);
    if (!ex.hidden) ex.innerHTML = linhaFicha([s.extra]);
    $("#ficha-palavra").textContent = s.palavra || "";
    var arte = $("#ficha-arte");
    arte.src = img(s.imagem) || "assets/hey.webp";
    $("#ficha-texto").textContent = s.texto;
    /* o lema do pôster: a última frase ganha a cor de destaque, como no Oásis */
    var frases = String(s.lema || "").replace(/([.!?])\s+/g, "$1\n").split("\n");
    var ultima = frases.length > 1 ? frases.pop() : "";
    $("#ficha-lema").innerHTML = esc(frases.join(" ")) + (ultima ? "<br><em>" + esc(ultima) + "</em>" : "");
    $("#ano").textContent = new Date().getFullYear();
  }

  function renderInterludio(id, cena) {
    var sec = document.getElementById(id);
    var fundo = sec.querySelector(".interludio-img");
    fundo.style.backgroundImage = "url('" + img(cena.img) + "')";
    fundo.style.setProperty("--foco", cena.foco || "50% 40%");
    var p = sec.querySelector(".interludio-frase p"), cite = sec.querySelector(".interludio-frase cite");
    p.textContent = cena.frase; p.classList.add("surge-frase");
    cite.textContent = cena.credito; cite.classList.add("surge-frase");
    sec.setAttribute("aria-label", cena.frase || "Interlúdio");
  }

  function obrasVisiveis() { return SITE.galeria.filter(function (o) { return o.visivel !== false && img(o.img); }); }

  function renderGaleria() {
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
        '<figure style="margin:0"><img src="' + esc(img(o.img)) + '" alt="' + esc(o.titulo || "Arte da Brunna") + '" loading="lazy">' +
        "<figcaption><small>" + esc(o.tag) + "</small><b>" + esc(o.titulo) + "</b></figcaption></figure></button>";
    }).join("");
    $("#galeria-ig").href = instagramUrl();
  }

  /* ===== agenda ===== */
  function estrela(cheia) {
    return '<svg viewBox="0 0 24 24" class="' + (cheia ? "cheia" : "vazia") + '" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>';
  }

  function renderStatus() {
    var a = SITE.agenda, st = STATUS[a.status] || STATUS.fechada;
    var total = Math.max(0, Number(a.vagas.total) || 0);
    var ocupadas = Math.min(total, Math.max(0, Number(a.vagas.ocupadas) || 0));
    var livres = total - ocupadas;
    var abre = dataLocal(a.proximaAbertura);
    var dias = abre ? Math.round((abre - hojeZero()) / 86400000) : null;

    var numeroEsq;
    if (a.status === "aberta") {
      numeroEsq = '<div class="st-num"><span class="rotulo">vagas livres</span><strong>' + livres + "</strong><small>de " + total + " nesta sessão</small></div>";
    } else if (a.mostrarContagem && dias !== null && dias >= 0) {
      numeroEsq = '<div class="st-num"><span class="rotulo">abre em</span><strong>' + (dias === 0 ? "hoje" : dias) + "</strong><small>" +
        (dias === 0 ? "" : (dias === 1 ? "dia · " : "dias · ")) + esc(dataExtenso(abre)) + "</small></div>";
    } else {
      numeroEsq = '<div class="st-num"><span class="rotulo">próxima abertura</span><strong>' + (abre ? esc(String(abre.getDate()).padStart(2, "0") + "/" + String(abre.getMonth() + 1).padStart(2, "0")) : "em breve") + "</strong><small>" + (abre ? esc(dataExtenso(abre)) : "fique de olho no Instagram") + "</small></div>";
    }
    var estrelas = "";
    for (var i = 0; i < total; i++) estrelas += estrela(i < ocupadas);
    var numeroDir = '<div class="st-num"><span class="rotulo">vagas da sessão</span><div class="estrelas" role="img" aria-label="' + ocupadas + " de " + total + ' vagas preenchidas">' + estrelas +
      "</div><small>" + ocupadas + " de " + total + " preenchidas</small></div>";

    var ctas;
    if (a.status === "aberta") {
      ctas = '<a class="btn cheio" href="#encomendas">Encomendar agora</a><a class="btn" href="' + esc(contatoLink("")) + '" target="_blank" rel="noopener">Tirar dúvida</a>';
    } else if (a.status === "espera") {
      ctas = '<a class="btn cheio" href="#encomendas">Montar pedido e entrar na lista</a><a class="btn" href="' + esc(instagramUrl()) + '" target="_blank" rel="noopener">Seguir no Instagram</a>';
    } else {
      ctas = '<a class="btn cheio" href="' + esc(contatoLink("Oi, Bru! Quero ser avisada(o) quando as encomendas abrirem ✨")) + '" target="_blank" rel="noopener">Me avisa quando abrir</a><a class="btn" href="#encomendas">Simular meu pedido</a>';
    }

    $("#agenda-status").innerHTML =
      '<div class="st-topo"><span class="etiqueta ' + st.classe + '">' + esc(st.etiqueta) + "</span></div>" +
      '<h3 class="st-titulo">' + esc(st.titulo) + "</h3>" +
      '<p class="st-aviso">' + esc(a.aviso) + "</p>" +
      '<div class="st-numeros">' + numeroEsq + numeroDir + "</div>" +
      '<div class="st-ctas">' + ctas + "</div>";
  }

  function eventosOrdenados() {
    return (SITE.agenda.eventos || []).map(function (e) { return { e: e, d: dataLocal(e.data) }; })
      .filter(function (x) { return x.d; }).sort(function (a, b) { return a.d - b.d; });
  }

  function renderCalendario() {
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
        if (evs.some(function (e) { return e.tipo === "abertura"; })) cls.push("abertura");
        var cor = (TIPOS_EVENTO[evs[0].tipo] || TIPOS_EVENTO.aviso).cor;
        cel.push('<button type="button" class="' + cls.join(" ") + '" data-dia="' + d + '" style="--cor-ev:' + cor + '" aria-label="' + d + " de " + MESES[mes] + ": " + esc(evs.map(function (e) { return e.titulo; }).join(", ")) + '">' + d + "</button>");
      } else {
        cel.push('<span class="' + cls.join(" ") + '">' + d + "</span>");
      }
    }
    var legenda = Object.keys(TIPOS_EVENTO).map(function (k) { return '<span style="--c:' + TIPOS_EVENTO[k].cor + '">' + TIPOS_EVENTO[k].nome + "</span>"; }).join("");
    $("#agenda-cal").innerHTML =
      '<div class="cal-topo"><h3 class="cal-mes">' + MESES[mes] + " <small style=\"font-size:.55em;opacity:.6\">" + ano + "</small></h3>" +
      '<div class="cal-nav"><button type="button" data-cal="-1" aria-label="Mês anterior">&#8592;</button><button type="button" data-cal="1" aria-label="Próximo mês">&#8594;</button></div></div>' +
      '<div class="cal-grade">' + cel.join("") + "</div>" +
      '<p class="cal-detalhe" id="cal-detalhe" aria-live="polite">' + (Object.keys(porDia).length ? "Toque num dia marcado para ver o que acontece." : "Nenhuma data marcada neste mês.") + "</p>" +
      '<div class="legenda">' + legenda + "</div>";
    $("#agenda-cal").porDia = porDia;
  }

  function renderEventos() {
    var hoje = hojeZero();
    var lista = eventosOrdenados();
    $("#agenda-eventos").innerHTML = lista.length ? lista.map(function (x) {
      var t = TIPOS_EVENTO[x.e.tipo] || TIPOS_EVENTO.aviso;
      return '<li class="ev' + (x.d < hoje ? " passado" : "") + '" style="--cor-ev:' + t.cor + '">' +
        '<div class="ev-data"><b>' + String(x.d.getDate()).padStart(2, "0") + "</b><small>" + MESES[x.d.getMonth()].slice(0, 3) + "</small></div>" +
        '<div><span class="ev-tipo">' + t.nome + '</span><span class="ev-titulo">' + esc(x.e.titulo) + '</span><span class="ev-desc">' + esc(x.e.desc) + "</span></div></li>";
    }).join("") : '<li class="vazio-cine">Nenhuma data marcada por enquanto.</li>';
  }

  function renderFila() {
    var etapas = SITE.agenda.etapas || [];
    var n = etapas.length;
    var fila = SITE.agenda.fila || [];
    $("#agenda-fila").innerHTML = fila.length ? fila.map(function (f) {
      var e = Math.max(0, Math.min(n - 1, Number(f.etapa) || 0));
      var barras = "";
      for (var i = 0; i < n; i++) barras += "<i class=\"" + (i < e || e === n - 1 ? "ok" : (i === e ? "agora" : "")) + "\"></i>";
      return '<li class="fila-item"><div class="fila-cab"><span><b>' + esc(f.nome) + "</b> <small>" + esc(f.detalhe) + '</small></span><span class="fila-etapa">' + esc(etapas[e] || "") + "</span></div>" +
        '<div class="fila-barra" style="--n:' + n + '" role="img" aria-label="Etapa ' + (e + 1) + " de " + n + ": " + esc(etapas[e] || "") + '">' + barras + "</div></li>";
    }).join("") : '<li class="vazio-cine">A fila está vazia agora.</li>';
  }

  function renderFaq() {
    $("#faq").innerHTML = SITE.faq.map(function (f) {
      return '<details class="surge"><summary>' + esc(f.p) + '</summary><p class="resp">' + esc(f.r) + "</p></details>";
    }).join("");
  }

  function renderRodape() {
    $("#rod-assinatura").textContent = SITE.perfil.assinatura ? SITE.perfil.assinatura + " ✦" : "";
    $("#rod-nome").textContent = SITE.perfil.nome;
    var ig = $("#rod-ig");
    ig.href = instagramUrl();
    ig.textContent = "@" + SITE.perfil.instagram;
  }

  function renderTudo() {
    renderAvatar();
    renderAbertura();
    renderLinks();
    renderFicha();
    renderInterludio("interludio1", SITE.cenas.interludio1);
    renderInterludio("interludio2", SITE.cenas.interludio2);
    renderGaleria();
    renderStatus();
    renderCalendario();
    renderEventos();
    renderFila();
    renderFaq();
    renderRodape();
    Cinema.observar();
  }

  function ligarEventos() {
    document.addEventListener("click", function (e) {
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
        $("#cal-detalhe").innerHTML = evs.map(function (ev) {
          return "<b>" + esc(ev.titulo) + "</b> · " + esc(ev.desc);
        }).join("<br>");
      }
    });

    /* o painel salvou em outra aba? redesenha na hora, sem recarregar */
    window.addEventListener("storage", function (e) {
      if (e.key !== LOJA_CHAVE) return;
      SITE = lojaCarregar();
      temaAplicar(SITE);
      renderTudo();
      if (window.Encomenda) Encomenda.recarregar();
    });
  }

  function iniciar() {
    renderTudo();
    ligarEventos();
    Cinema.iniciar();
  }

  return { iniciar: iniciar, renderTudo: renderTudo };
})();

Site.iniciar();
