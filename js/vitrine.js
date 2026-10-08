"use strict";

/*
 * Vitrine: o carrossel do topo da página inicial (pedido da Bru, inspirado
 * nos destaques da Steam). As artes vêm da galeria com "destaque: true".
 *
 * Transição cinematográfica e SÓ na troca: a arte nova entra num fade longo,
 * saindo levemente desfocada e assentando; depois fica parada. Nada se mexe
 * continuamente (regra aprendida: imagem se mexendo sem parar parece tremer).
 * Pausa sozinha com o mouse em cima, com o foco do teclado, com a aba
 * escondida e para quem pediu "reduzir movimento" no aparelho.
 */
var Vitrine = (function () {
  var INTERVALO = 7000;
  var $ = function (s) { return document.querySelector(s); };
  var raiz = document.documentElement;
  var reduzido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var lista = [], atual = 0, timer = null;
  var pausaUsuario = false, pausaHover = false;
  var inicio = 0, restante = INTERVALO;

  function semAutoplay() { return reduzido || raiz.dataset.movimento === "desligado"; }

  function destaques() {
    var visiveis = SITE.galeria.filter(function (o) { return o.visivel !== false && urlSegura(o.img, true); });
    var marcadas = visiveis.filter(function (o) { return o.destaque; });
    return (marcadas.length ? marcadas : visiveis.slice(0, 6)).slice(0, 12);
  }
  function mini(o) { return urlSegura(o.mini, true) || urlSegura(o.img, true); }
  function grande(o) { return urlSegura(o.img, true); }

  /* só baixa a imagem grande quando ela é a atual ou a próxima */
  function carregar(i) {
    var fig = document.querySelector('.vit-slide[data-i="' + i + '"]');
    if (!fig) return;
    var im = fig.querySelector("img");
    if (!im.getAttribute("src")) im.setAttribute("src", im.dataset.src);
  }

  function montar() {
    var palco = $("#vit-palco");
    if (!palco) return;
    lista = destaques();
    if (atual >= lista.length) atual = 0;
    palco.innerHTML = lista.map(function (o, i) {
      return '<figure class="vit-slide" data-i="' + i + '" aria-roledescription="slide" aria-label="' + (i + 1) + " de " + lista.length + ": " + esc(o.titulo) + '">' +
        '<div class="vit-fundo" style="background-image:url(\'' + esc(mini(o)) + '\')"></div>' +
        '<img data-src="' + esc(grande(o)) + '" alt="' + esc(o.titulo || "Arte da Brunna") + '"' +
        (o.w && o.h ? ' width="' + o.w + '" height="' + o.h + '"' : "") + ' decoding="async"></figure>';
    }).join("");
    $("#vit-miniaturas").innerHTML = lista.map(function (o, i) {
      return '<button type="button" class="vit-mini" role="tab" data-i="' + i + '" aria-label="' + esc(o.titulo) + '" aria-selected="false" tabindex="-1">' +
        '<img src="' + esc(mini(o)) + '" alt="" loading="lazy"><i class="vit-prog" aria-hidden="true"></i></button>';
    }).join("") + (lista.length > 1
      ? '<button type="button" class="vit-pausa" id="vit-pausa" aria-pressed="false" aria-label="Pausar o carrossel"><span aria-hidden="true"></span></button>'
      : "");
    if (semAutoplay()) pausaUsuario = true;
    mostrar(atual, true);
  }

  function mostrar(i, primeira) {
    if (!lista.length) return;
    var anterior = atual;
    atual = (i + lista.length) % lista.length;
    carregar(atual);
    carregar((atual + 1) % lista.length);

    Array.prototype.forEach.call(document.querySelectorAll(".vit-slide"), function (f) {
      var n = Number(f.dataset.i);
      f.classList.toggle("ativa", n === atual);
      f.classList.toggle("saindo", !primeira && n === anterior && n !== atual);
      f.setAttribute("aria-hidden", String(n !== atual));
    });
    Array.prototype.forEach.call(document.querySelectorAll(".vit-mini"), function (b) {
      var ativo = Number(b.dataset.i) === atual;
      b.setAttribute("aria-selected", String(ativo));
      b.tabIndex = ativo ? 0 : -1;
      /* reinicia a barrinha de progresso da miniatura */
      var p = b.querySelector(".vit-prog");
      p.style.animation = "none"; void p.offsetWidth; p.style.animation = "";
    });

    var o = lista[atual];
    $("#vit-contador").textContent = String(atual + 1).padStart(2, "0") + " / " + String(lista.length).padStart(2, "0");
    $("#vit-tag").textContent = o.tag || "";
    $("#vit-titulo").textContent = o.titulo || "";
    var info = document.querySelector(".vit-info");
    info.classList.remove("troca"); void info.offsetWidth; info.classList.add("troca");

    restante = INTERVALO;
    agendar();
  }

  function agendar() {
    clearTimeout(timer);
    var parado = pausaUsuario || pausaHover || document.hidden || lista.length < 2;
    var vit = $(".vitrine");
    if (vit) {
      vit.classList.toggle("parada", parado);
      vit.style.setProperty("--vit-tempo", INTERVALO + "ms");
    }
    var pausa = $("#vit-pausa");
    if (pausa) {
      pausa.setAttribute("aria-pressed", String(pausaUsuario));
      pausa.setAttribute("aria-label", pausaUsuario ? "Continuar o carrossel" : "Pausar o carrossel");
    }
    if (parado) return;
    inicio = Date.now();
    timer = setTimeout(function () { mostrar(atual + 1); }, restante);
  }
  function congelar() {
    if (timer) { clearTimeout(timer); timer = null; restante = Math.max(400, restante - (Date.now() - inicio)); }
  }

  function ligar() {
    var vit = $(".vitrine");
    if (!vit) return;
    var grade = vit.querySelector(".vit-grade");
    grade.addEventListener("mouseenter", function () { pausaHover = true; congelar(); agendar(); });
    grade.addEventListener("mouseleave", function () { pausaHover = false; agendar(); });
    vit.addEventListener("focusin", function () { pausaHover = true; congelar(); agendar(); });
    vit.addEventListener("focusout", function (e) { if (!vit.contains(e.relatedTarget)) { pausaHover = false; agendar(); } });
    document.addEventListener("visibilitychange", function () { if (document.hidden) congelar(); agendar(); });

    vit.addEventListener("click", function (e) {
      var m = e.target.closest(".vit-mini");
      if (m) { mostrar(Number(m.dataset.i)); return; }
      if (e.target.closest("#vit-pausa")) { pausaUsuario = !pausaUsuario; if (pausaUsuario) congelar(); agendar(); return; }
      if (e.target.closest("#vit-ampliar") || e.target.closest(".vit-slide.ativa")) {
        Cinema.lbAbrir(lista.map(function (o) { return { src: grande(o), titulo: o.titulo }; }), atual, $("#vit-ampliar"));
      }
    });
    $("#vit-miniaturas").addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      mostrar(atual + (e.key === "ArrowRight" ? 1 : -1));
      var b = document.querySelector('.vit-mini[data-i="' + atual + '"]');
      if (b) b.focus();
    });
    /* arrastar o dedo para o lado no celular */
    var x0 = null;
    $("#vit-palco").addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    $("#vit-palco").addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) mostrar(atual + (dx < 0 ? 1 : -1));
    });
  }

  ligar();
  montar();
  return { montar: montar };
})();
