"use strict";

/*
 * Efeitos de cinema da página pública:
 *  - barras pretas (letterbox) da abertura que recolhem ao rolar
 *  - navegação que fica sólida depois da abertura
 *  - botão de tema claro/escuro
 *  - entrada dos elementos ao rolar (.surge → .visto)
 *  - lightbox (arte em tela cheia)
 * Tudo respeita "movimento" do painel e o "reduzir movimento" do sistema.
 */
var Cinema = (function () {
  var raiz = document.documentElement;
  var reduzido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function semMovimento() { return reduzido || raiz.dataset.movimento === "desligado"; }

  /* ===== botão de tema claro/escuro (sol/lua no topo) ===== */
  var SOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var LUA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>';
  function temaAtual() {
    var t = raiz.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function pintarBotaoTema() {
    var btn = document.getElementById("tema-btn");
    if (!btn) return;
    btn.hidden = window.SITE && SITE.aparencia && SITE.aparencia.botaoTema === false;
    var escuro = temaAtual() === "dark";
    btn.innerHTML = escuro ? SOL : LUA;
    btn.setAttribute("aria-label", escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro");
    btn.setAttribute("aria-pressed", String(escuro));
  }
  function ligarTema() {
    var btn = document.getElementById("tema-btn");
    if (!btn) return;
    pintarBotaoTema();
    btn.addEventListener("click", function () {
      var novo = temaAtual() === "dark" ? "light" : "dark";
      raiz.setAttribute("data-theme", novo);
      try { localStorage.setItem(TEMA_CHAVE, novo); } catch (e) { /* sem armazenamento: vale até recarregar */ }
      pintarBotaoTema();
    });
  }

  /* ===== tela de carregamento → abertura de cinema =====
     Progresso de verdade: imagens da tela + fontes. Quando termina (ou passa
     do tempo máximo), as faixas se abrem. Primeira visita: versão completa,
     com um tempo mínimo pra dar pra ver; depois, só a abertura rápida. */
  /* avisa o CSS que a "cena" começou (letreiro do topo, arte assentando) */
  function cenaAberta() {
    raiz.classList.remove("esperando-cena");
    raiz.classList.add("cena-aberta");
  }
  function cortina() {
    var c = document.getElementById("cortina");
    if (!c) { cenaAberta(); return; }
    if (c.classList.contains("pular")) { c.remove(); cenaAberta(); return; }
    var rapida = c.classList.contains("rapida");
    if (semMovimento()) c.classList.add("simples");
    var barra = document.getElementById("cort-prog"), pct = document.getElementById("cort-pct");
    var t0 = performance.now(), MIN = rapida ? 0 : 1300, MAX = rapida ? 2500 : 6000;
    var total = 1, prontos = 0, mostrado = 0, alvo = 0, fim = false;

    function pintar() {
      mostrado += (alvo - mostrado) * 0.12;
      if (alvo - mostrado < 0.004) mostrado = alvo;
      if (barra) barra.style.transform = "scaleX(" + mostrado.toFixed(3) + ")";
      if (pct) pct.textContent = Math.round(mostrado * 100) + "%";
      if (!fim || mostrado < 1) requestAnimationFrame(pintar);
    }
    function um() { prontos++; alvo = Math.min(1, prontos / total); checar(); }
    function checar() {
      if (prontos >= total) terminar();
    }
    function terminar() {
      if (fim) return;
      fim = true; alvo = 1;
      var espera = Math.max(0, MIN - (performance.now() - t0)) + (rapida ? 0 : 350);
      setTimeout(abrir, espera);
    }
    function abrir() {
      try { sessionStorage.setItem("brupater:intro", "1"); } catch (e) {}
      document.body.classList.add(c.classList.contains("simples") ? "simples-revelando" : "revelando");
      c.classList.add("abrindo");
      cenaAberta();
      setTimeout(function () { c.remove(); document.body.classList.remove("revelando", "simples-revelando"); }, rapida ? 1000 : 1700);
    }

    requestAnimationFrame(pintar);
    setTimeout(terminar, MAX);
    function contar() {
      /* imagens que já estão na tela (as "lazy" ficam pra depois) */
      var imgs = Array.prototype.filter.call(document.images, function (i) {
        return i.getAttribute("src") && i.loading !== "lazy" && !c.contains(i);
      });
      total = imgs.length + 1;
      imgs.forEach(function (i) {
        if (i.complete) um();
        else { i.addEventListener("load", um, { once: true }); i.addEventListener("error", um, { once: true }); }
      });
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(um, um);
    }
    /* conta depois que todos os scripts desenharam a página (DOMContentLoaded) */
    if (window.PAGINA_PRONTA) setTimeout(contar, 0);
    else document.addEventListener("DOMContentLoaded", contar);
  }

  /* ===== entrada ao rolar ===== */
  var observador = null;
  function observar(escopo) {
    var alvos = (escopo || document).querySelectorAll(".surge:not(.visto), .interludio:not(.visto)");
    if (!("IntersectionObserver" in window) || semMovimento()) {
      Array.prototype.forEach.call(alvos, function (el) { el.classList.add("visto"); });
      return;
    }
    if (!observador) {
      observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("visto"); observador.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    }
    Array.prototype.forEach.call(alvos, function (el, i) {
      /* pequenos atrasos em cascata pra elementos que entram juntos */
      if (el.classList.contains("surge")) el.style.transitionDelay = Math.min(i % 6, 5) * 70 + "ms";
      observador.observe(el);
    });
  }

  /* ===== rolagem: barras de cinema e navegação =====
     (sem parallax nem imagem se mexendo sozinha: imagem parada não "treme") */
  var agendado = false;
  function aoRolar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () {
      agendado = false;
      var y = window.scrollY || window.pageYOffset;
      var topo = document.querySelector("[data-topo]");
      var nav = document.getElementById("nav");
      if (!topo) { if (nav) nav.classList.add("solida"); return; }
      var p = Math.min(1, Math.max(0, y / (window.innerHeight * 0.45)));
      topo.style.setProperty("--barra", String(1 - p));
      if (nav) nav.classList.toggle("solida", y > topo.offsetHeight - 90);
    });
  }

  /* ===== lightbox ===== */
  var lb = { lista: [], i: 0, origem: null };
  function lbMostrar() {
    var item = lb.lista[lb.i];
    var img = document.getElementById("lb-img");
    img.src = item.src;
    img.alt = item.titulo || "";
    document.getElementById("lb-cap").textContent = item.titulo || "";
    var varios = lb.lista.length > 1;
    document.querySelector("#lb .ant").hidden = !varios;
    document.querySelector("#lb .prox").hidden = !varios;
  }
  function lbAbrir(lista, i, origem) {
    if (!document.getElementById("lb")) return;
    lb.lista = lista; lb.i = i || 0; lb.origem = origem || null;
    lbMostrar();
    document.getElementById("lb").classList.add("aberto");
    document.body.style.overflow = "hidden";
    document.querySelector("#lb .fechar").focus();
  }
  function lbFechar() {
    document.getElementById("lb").classList.remove("aberto");
    document.body.style.overflow = "";
    if (lb.origem) lb.origem.focus();
  }
  function lbPasso(d) { lb.i = (lb.i + d + lb.lista.length) % lb.lista.length; lbMostrar(); }
  function ligarLightbox() {
    var el = document.getElementById("lb");
    if (!el) return;
    el.querySelector(".fechar").addEventListener("click", lbFechar);
    el.querySelector(".ant").addEventListener("click", function () { lbPasso(-1); });
    el.querySelector(".prox").addEventListener("click", function () { lbPasso(1); });
    el.addEventListener("click", function (e) { if (e.target === el) lbFechar(); });
    document.addEventListener("keydown", function (e) {
      if (!el.classList.contains("aberto")) return;
      if (e.key === "Escape") lbFechar();
      if (e.key === "ArrowLeft") lbPasso(-1);
      if (e.key === "ArrowRight") lbPasso(1);
    });
    /* qualquer botão com data-lb-src abre sozinho (ex.: tabela de preços) */
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lb-src]");
      if (b) lbAbrir([{ src: b.dataset.lbSrc, titulo: b.dataset.lbTitulo }], 0, b);
    });
  }

  function iniciar() {
    ligarLightbox();
    ligarTema();
    cortina();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    aoRolar();
  }

  return { iniciar: iniciar, observar: observar, lbAbrir: lbAbrir, aoRolar: aoRolar, pintarBotaoTema: pintarBotaoTema };
})();
