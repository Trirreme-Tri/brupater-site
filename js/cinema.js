"use strict";

/*
 * Efeitos de cinema da página pública:
 *  - barras pretas (letterbox) da abertura que recolhem ao rolar
 *  - navegação que fica sólida depois da abertura
 *  - entrada dos elementos ao rolar (.surge → .visto)
 *  - botão de tema claro/escuro
 *  - lightbox (arte em tela cheia)
 * Tudo respeita "movimento" do painel e o "reduzir movimento" do sistema.
 */
var Cinema = (function () {
  var raiz = document.documentElement;
  var reduzido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function semMovimento() { return reduzido || raiz.dataset.movimento === "desligado"; }

  /* ===== tema ===== */
  var SOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var LUA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>';
  function temaAtual() {
    var t = raiz.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function pintarBotaoTema(btn) {
    var escuro = temaAtual() === "dark";
    btn.innerHTML = escuro ? SOL : LUA;
    btn.setAttribute("aria-label", escuro ? "Mudar para tema claro" : "Mudar para tema escuro");
  }
  function ligarTema(btn) {
    if (!btn) return;
    pintarBotaoTema(btn);
    btn.addEventListener("click", function () {
      var novo = temaAtual() === "dark" ? "light" : "dark";
      raiz.setAttribute("data-theme", novo);
      try { localStorage.setItem("brupater:tema", novo); } catch (e) {}
      pintarBotaoTema(btn);
    });
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
    ligarTema(document.getElementById("tema-btn"));
    ligarLightbox();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    aoRolar();
  }

  return { iniciar: iniciar, observar: observar, lbAbrir: lbAbrir, aoRolar: aoRolar };
})();
