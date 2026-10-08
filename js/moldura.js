"use strict";

/*
 * Moldura (site.html): mostra as páginas do site dentro de um quadro em tela
 * cheia e mantém o mini player de música (js/musica.js) aqui fora, tocando
 * enquanto a pessoa navega. O endereço da barra acompanha a página do
 * quadro (ex.: .../encomendas.html), então copiar o link e recarregar
 * funcionam normal.
 */
(function () {
  var PAGINAS = /^(index|portfolio|agenda|encomendas|projeto)\.html(\?[^#]*)?(#.*)?$/;
  var quadro = document.getElementById("moldura");
  var raiz = document.documentElement;
  /* o grão de filme já aparece dentro do quadro: aqui fora seria dobrado */
  raiz.dataset.grao = "off";

  var pedida = new URLSearchParams(location.search).get("p") || "index.html";
  if (!PAGINAS.test(pedida)) pedida = "index.html";

  function enderecoDe(w) {
    var nome = w.location.pathname.split("/").pop() || "index.html";
    return (nome === "index.html" ? "./" : nome) + w.location.search + w.location.hash;
  }
  /* barra de endereço e título acompanham a página do quadro */
  function sincronizar() {
    try {
      var w = quadro.contentWindow, d = quadro.contentDocument;
      history.replaceState(null, "", enderecoDe(w));
      document.title = d.title;
      marcar();
    } catch (e) { /* página de fora do site: deixa como está */ }
  }
  /* avisa a página do quadro que existe player (pra abrir espaço pro botão)
     e sobe o player quando a barra do total aparece nas Encomendas */
  var vigia;
  function marcar() {
    try {
      var d = quadro.contentDocument;
      d.body.classList.toggle("com-musica", !!document.querySelector(".musica"));
      if (vigia) vigia.disconnect();
      var barra = d.getElementById("barra-total");
      document.body.classList.remove("barra-ativa");
      if (barra) {
        vigia = new MutationObserver(function () { document.body.classList.toggle("barra-ativa", barra.classList.contains("ativa")); });
        vigia.observe(barra, { attributes: true, attributeFilter: ["class"] });
      }
    } catch (e) {}
  }
  /* links para fora do site (Instagram, WhatsApp...) ou para páginas que não
     são do quadro (painel, apresentação) abrem na janela inteira: muitos
     sites recusam abrir dentro de um quadro */
  function linksParaFora(e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || (a.target && a.target !== "_self") || e.defaultPrevented) return;
    var u;
    try { u = new URL(a.href, quadro.contentWindow.location.href); } catch (x) { return; }
    var nome = u.pathname.split("/").pop() || "index.html";
    if (u.origin === location.origin && PAGINAS.test(nome)) return;
    if (!/^https?:$/.test(u.protocol)) return;
    a.target = "_top";
  }
  quadro.addEventListener("load", function () {
    sincronizar();
    try {
      quadro.contentWindow.addEventListener("hashchange", sincronizar);
      quadro.contentDocument.addEventListener("click", linksParaFora, true);
    } catch (e) {}
  });
  quadro.src = pedida;

  /* o painel salvou em outra aba: só remonta o player se a trilha mudou
     (assim a música não para por causa de outra mudança qualquer) */
  function aplicarTema() {
    try { temaAplicar(SITE); } catch (x) {}
    raiz.dataset.grao = "off";
  }
  var trilhaAntes = JSON.stringify(SITE.perfil.trilha || {});
  window.addEventListener("storage", function (e) {
    /* a visitante trocou claro/escuro dentro do quadro: as cores daqui de fora acompanham */
    if (e.key === TEMA_CHAVE) { aplicarTema(); return; }
    if (e.key !== LOJA_CHAVE) return;
    SITE = lojaCarregar();
    aplicarTema();
    var agora = JSON.stringify(SITE.perfil.trilha || {});
    if (agora !== trilhaAntes && window.Musica) { trilhaAntes = agora; Musica.montar(); marcar(); }
  });
  window.Moldura = { marcar: marcar };
})();
