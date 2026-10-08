"use strict";

/*
 * Vitrine: o carrossel do topo da página inicial (pedido da Bru, inspirado
 * nos destaques da Steam). As artes vêm da galeria com "destaque: true".
 *
 * Como funciona:
 * - As artes ocupam a tela inteira, sem moldura (painel → Cenas → Topo:
 *   "fundo" cobre a tela, "inteira" mostra a arte inteira). O botão
 *   "ver arte inteira" abre a arte em tela cheia, sem corte.
 * - As artes passam pro lado sozinhas, num loop infinito (depois da última
 *   vem a primeira, sempre no mesmo sentido).
 * - O movimento acontece SÓ na troca: a nova entra deslizando com um leve
 *   zoom que assenta; depois fica parada (imagem se mexendo sem parar parece
 *   tremer).
 * - Não pausa com toque nem com o mouse em cima: no celular o toque deixava
 *   o carrossel parado. Só pausa pelo botão de pausa (acessibilidade) e
 *   quando a aba do navegador fica escondida.
 * - Quem pediu "reduzir movimento" no aparelho (ou "Movimento: desligado" no
 *   painel) vê a troca em fade, sem deslizar. As artes continuam passando.
 */
var Vitrine = (function () {
  var INTERVALO = 6000;   // tempo de cada arte na tela
  var DURACAO = 1300;     // tempo da passagem (igual ao CSS)
  var $ = function (s) { return document.querySelector(s); };
  var raiz = document.documentElement;
  var mqReduzido = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  var lista = [], atual = 0, timer = null, limpeza = null;
  var pausaUsuario = false;
  var inicio = 0, restante = INTERVALO;

  function modoFade() { return (mqReduzido && mqReduzido.matches) || raiz.dataset.movimento === "desligado"; }

  function destaques() {
    var visiveis = SITE.galeria.filter(function (o) { return o.visivel !== false && urlSegura(o.img, true); });
    var marcadas = visiveis.filter(function (o) { return o.destaque; });
    return (marcadas.length ? marcadas : visiveis.slice(0, 6)).slice(0, 12);
  }
  function mini(o) { return urlSegura(o.mini, true) || urlSegura(o.img, true); }
  function grande(o) { return urlSegura(o.img, true); }
  function celular(o) { return urlSegura(o.imgCelular, true); }
  function slide(i) { return document.querySelector('.vit-slide[data-i="' + i + '"]'); }

  /* só baixa a imagem grande quando ela é a atual ou a próxima */
  function carregar(i) {
    var fig = slide(i);
    if (!fig) return;
    var im = fig.querySelector("img"), fonte = fig.querySelector("source[data-srcset]");
    if (fonte && !fonte.getAttribute("srcset")) fonte.setAttribute("srcset", fonte.dataset.srcset);
    if (!im.getAttribute("src")) im.setAttribute("src", im.dataset.src);
  }

  function montar() {
    var palco = $("#vit-palco");
    if (!palco) return;
    lista = destaques();
    if (atual >= lista.length) atual = 0;
    palco.classList.toggle("vit-fade", modoFade());
    /* "fundo" = a arte cobre a tela toda; "inteira" = aparece inteira sobre ela mesma desfocada */
    var modo = (SITE.cenas.abertura || {}).modo === "inteira" ? "inteira" : "fundo";
    palco.classList.toggle("modo-inteira", modo === "inteira");
    palco.classList.toggle("modo-fundo", modo === "fundo");
    palco.innerHTML = lista.map(function (o, i) {
      return '<figure class="vit-slide" data-i="' + i + '" aria-roledescription="slide" aria-label="' + (i + 1) + " de " + lista.length + '">' +
        '<div class="vit-fundo" style="background-image:url(\'' + esc(mini(o)) + '\')"></div>' +
        /* versão de celular (vertical) opcional: entra sozinha em telas estreitas */
        (celular(o) ? '<picture><source media="(max-width: 899px)" data-srcset="' + esc(celular(o)) + '">' : "") +
        '<img data-src="' + esc(grande(o)) + '" alt="' + esc(o.titulo || "Arte da Brunna") + '" style="--foco:' + esc(o.foco || "50% 35%") + '"' +
        (o.w && o.h ? ' width="' + o.w + '" height="' + o.h + '"' : "") + ' decoding="async">' + (celular(o) ? "</picture>" : "") + "</figure>";
    }).join("");
    $("#vit-miniaturas").innerHTML = lista.map(function (o, i) {
      return '<button type="button" class="vit-mini" role="tab" data-i="' + i + '" aria-label="Arte ' + (i + 1) + '" aria-selected="false" tabindex="-1">' +
        '<img src="' + esc(mini(o)) + '" alt="" loading="lazy"><i class="vit-prog" aria-hidden="true"></i></button>';
    }).join("") + (lista.length > 1
      ? '<button type="button" class="vit-pausa" id="vit-pausa" aria-pressed="false" aria-label="Pausar o carrossel"><span aria-hidden="true"></span></button>'
      : "");
    mostrar(atual, 0);
  }

  /* posiciona um slide (em % da largura) com ou sem animação */
  function posicionar(el, x, animar) {
    el.style.transition = animar ? "" : "none";
    el.style.transform = "translate3d(" + x + "%,0,0)";
  }

  /* dir: 1 = vem da direita (padrão), -1 = vem da esquerda, 0 = sem animação */
  function mostrar(i, dir) {
    if (!lista.length) return;
    var anterior = atual;
    atual = (i + lista.length) % lista.length;
    if (atual === anterior && dir !== 0) return;
    carregar(atual);
    carregar((atual + 1) % lista.length);
    clearTimeout(limpeza);

    var fade = modoFade();
    var entra = slide(atual), sai = dir !== 0 && anterior !== atual ? slide(anterior) : null;

    Array.prototype.forEach.call(document.querySelectorAll(".vit-slide"), function (f) {
      if (f !== entra && f !== sai) { f.classList.remove("ativa", "saindo", "pre"); posicionar(f, 100, false); }
      f.setAttribute("aria-hidden", String(f !== entra));
    });

    if (fade || dir === 0) {
      posicionar(entra, 0, false);
      entra.classList.remove("saindo", "pre");
      entra.classList.add("ativa");
      if (sai) { sai.classList.remove("ativa"); sai.classList.add("saindo"); }
    } else {
      /* 1) coloca a que entra fora da tela, do lado certo, já com o zoom */
      posicionar(entra, 100 * dir, false);
      entra.classList.remove("saindo");
      entra.classList.add("ativa", "pre");
      void entra.offsetWidth;
      /* 2) anima as duas ao mesmo tempo */
      entra.classList.remove("pre");
      posicionar(entra, 0, true);
      if (sai) {
        sai.classList.remove("ativa");
        sai.classList.add("saindo");
        posicionar(sai, -100 * dir, true);
      }
    }
    /* depois da passagem, a que saiu some de vez */
    if (sai) limpeza = setTimeout(function () { sai.classList.remove("saindo"); posicionar(sai, 100, false); }, DURACAO + 100);

    Array.prototype.forEach.call(document.querySelectorAll(".vit-mini"), function (b) {
      var ativo = Number(b.dataset.i) === atual;
      b.setAttribute("aria-selected", String(ativo));
      b.tabIndex = ativo ? 0 : -1;
      /* reinicia a barrinha de progresso da miniatura */
      var p = b.querySelector(".vit-prog");
      p.style.animation = "none"; void p.offsetWidth; p.style.animation = "";
    });

    /* no celular as miniaturas não cabem: a fileira acompanha a arte atual
       (rola só a fileira, nunca a página) */
    var fila = $("#vit-miniaturas"), mAtual = document.querySelector('.vit-mini[data-i="' + atual + '"]');
    if (fila && mAtual && fila.scrollWidth > fila.clientWidth + 2) {
      var rf = fila.getBoundingClientRect(), rm = mAtual.getBoundingClientRect();
      var alvo = fila.scrollLeft + (rm.left - rf.left) - (fila.clientWidth - rm.width) / 2;
      if (fila.scrollTo) fila.scrollTo({ left: alvo, behavior: dir === 0 ? "auto" : "smooth" }); else fila.scrollLeft = alvo;
    }

    restante = INTERVALO;
    agendar();
  }

  function proxima() { mostrar(atual + 1, 1); }

  function agendar() {
    clearTimeout(timer);
    timer = null;
    var parado = pausaUsuario || document.hidden || lista.length < 2;
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
    timer = setTimeout(proxima, restante);
  }
  function congelar() {
    if (timer) { clearTimeout(timer); timer = null; restante = Math.max(400, restante - (Date.now() - inicio)); }
  }

  function ligar() {
    var vit = $(".vitrine");
    if (!vit) return;
    document.addEventListener("visibilitychange", function () { if (document.hidden) congelar(); agendar(); });
    if (mqReduzido && mqReduzido.addEventListener) mqReduzido.addEventListener("change", function () { $("#vit-palco").classList.toggle("vit-fade", modoFade()); });

    vit.addEventListener("click", function (e) {
      var m = e.target.closest(".vit-mini");
      if (m) { var n = Number(m.dataset.i); if (n !== atual) mostrar(n, n > atual ? 1 : -1); return; }
      if (e.target.closest("#vit-pausa")) { pausaUsuario = !pausaUsuario; if (pausaUsuario) congelar(); agendar(); return; }
      if (e.target.closest("#vit-ampliar") || e.target.closest(".vit-slide.ativa")) {
        Cinema.lbAbrir(lista.map(function (o) { return { src: grande(o), titulo: o.titulo }; }), atual, $("#vit-ampliar"));
      }
    });
    $("#vit-miniaturas").addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var d = e.key === "ArrowRight" ? 1 : -1;
      mostrar(atual + d, d);
      var b = document.querySelector('.vit-mini[data-i="' + atual + '"]');
      if (b) b.focus();
    });
    /* arrastar o dedo para o lado no celular */
    var x0 = null;
    $("#vit-palco").addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    $("#vit-palco").addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) { var d = dx < 0 ? 1 : -1; mostrar(atual + d, d); }
    });
  }

  ligar();
  montar();
  return { montar: montar };
})();
