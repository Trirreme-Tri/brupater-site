"use strict";

/*
 * Projetos (coleções), pedido da Bru: na página inicial aparece só a capa de
 * cada projeto; ao clicar abre projeto.html?p=<id> com o projeto inteiro,
 * como no Behance/ArtStation. Os dados vêm de SITE.projetos (painel → Projetos).
 */
var Projetos = (function () {
  var $ = function (s) { return document.querySelector(s); };
  var filtro = "Todos";

  function img(u) { return urlSegura(u, true); }
  function visiveis() {
    return (SITE.projetos || []).filter(function (p) { return p.visivel !== false && p.id && img(p.capa); });
  }
  /* largura/altura e versão menor da imagem, se ela também estiver na galeria */
  function daGaleria(u) {
    return SITE.galeria.filter(function (o) { return o.img === u; })[0] || {};
  }
  function link(p) { return "projeto.html?p=" + encodeURIComponent(p.id); }
  function qtd(p) { var n = (p.imagens || []).filter(function (i) { return img(i.img); }).length; return n + (n === 1 ? " imagem" : " imagens"); }

  /* ===== página inicial: grade de capas ===== */
  function renderGrade() {
    var grade = $("#proj-grade");
    if (!grade) return;
    var sec = SITE.secaoProjetos || {};
    $("#projetos-t").textContent = sec.titulo || "Projetos";
    $("#projetos-sub").textContent = sec.sub || "";
    var lista = visiveis();
    $("#projetos").hidden = !lista.length;

    var cats = [];
    lista.forEach(function (p) { if (p.categoria && cats.indexOf(p.categoria) < 0) cats.push(p.categoria); });
    if (cats.indexOf(filtro) < 0) filtro = "Todos";
    /* com uma categoria só, o filtro não faz sentido */
    $("#proj-filtros").innerHTML = cats.length < 2 ? "" : ["Todos"].concat(cats).map(function (c) {
      return '<button type="button" class="proj-filtro" data-cat="' + esc(c) + '" aria-pressed="' + (c === filtro) + '">' + esc(c) + "</button>";
    }).join("");

    grade.innerHTML = lista.map(function (p) {
      var g = daGaleria(p.capa);
      var capa = img(g.mini) || img(p.capa);
      return '<a class="proj surge" href="' + link(p) + '" data-cat="' + esc(p.categoria) + '"' + (filtro !== "Todos" && p.categoria !== filtro ? " hidden" : "") + ">" +
        '<img src="' + esc(capa) + '" alt="" loading="lazy" decoding="async" style="--foco:' + esc(p.foco || "50% 40%") + '">' +
        '<span class="proj-txt"><span class="proj-cat">' + esc(p.categoria) + '</span><span class="proj-nome">' + esc(p.titulo) + "</span>" +
        '<span class="proj-qtd">' + esc(p.resumo || qtd(p)) + "</span></span></a>";
    }).join("");
  }

  /* ===== página do projeto ===== */
  function renderProjeto() {
    var raiz = $("#pj");
    if (!raiz) return;
    var id = new URLSearchParams(location.search).get("p");
    var lista = visiveis();
    var p = lista.filter(function (x) { return x.id === id; })[0];
    if (!p) {
      raiz.innerHTML = '<section class="pj-vazio"><div><p class="rotulo">projeto não encontrado</p>' +
        '<h1 class="t-cinema pj-titulo">Ops!</h1><p>Esse projeto não existe mais ou mudou de endereço.</p>' +
        '<p style="margin-top:22px"><a class="btn cheio" href="index.html#projetos">Ver todos os projetos</a></p></div></section>';
      document.title = "Projeto · " + (SITE.perfil.nome || "");
      return;
    }
    document.title = p.titulo + " · " + (SITE.perfil.nome || "");
    var imagens = (p.imagens || []).filter(function (i) { return img(i.img); });
    var paragrafos = String(p.texto || "").split(/\n+/).filter(Boolean);
    var pos = lista.indexOf(p), prox = lista[(pos + 1) % lista.length];

    raiz.innerHTML =
      '<section class="pj-capa" data-topo><div class="pj-capa-img" style="background-image:url(\'' + esc(img(p.capa)) + '\');--foco:' + esc(p.foco || "50% 40%") + '"></div></section>' +
      '<header class="pj-cab">' +
        '<p class="rotulo pj-cat">' + esc(p.categoria) + "</p>" +
        '<h1 class="t-cinema pj-titulo">' + esc(p.titulo) + "</h1>" +
        '<div class="pj-texto">' + paragrafos.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + "</div>" +
        '<p class="rotulo pj-meta">' + esc(qtd(p)) + "</p>" +
      "</header>" +
      '<div class="pj-imagens">' + imagens.map(function (i, n) {
        var g = daGaleria(i.img);
        return '<figure class="surge" style="margin:0"><button type="button" class="pj-img" data-n="' + n + '" aria-label="Ver ' + esc(i.legenda || g.titulo || "imagem " + (n + 1)) + ' em tela cheia">' +
          '<img src="' + esc(img(i.img)) + '" alt="' + esc(i.legenda || g.titulo || p.titulo) + '"' + (g.w && g.h ? ' width="' + g.w + '" height="' + g.h + '"' : "") +
          (n > 1 ? ' loading="lazy"' : "") + ' decoding="async"></button>' +
          (i.legenda ? "<figcaption>" + esc(i.legenda) + "</figcaption>" : "") + "</figure>";
      }).join("") + "</div>" +
      '<nav class="pj-fim" aria-label="Outros projetos">' +
        (prox && prox !== p
          ? '<a class="proj" href="' + link(prox) + '"><img src="' + esc(img(daGaleria(prox.capa).mini) || img(prox.capa)) + '" alt="" loading="lazy" style="--foco:' + esc(prox.foco || "50% 40%") + '">' +
            '<span class="proj-txt"><span class="proj-cat">próximo projeto &#8594;</span><span class="proj-nome">' + esc(prox.titulo) + "</span></span></a>"
          : "") +
        '<a class="pj-voltar" href="index.html#projetos">&#8592; todos os projetos</a>' +
      "</nav>";

    raiz.onclick = function (e) {
      var b = e.target.closest(".pj-img");
      if (!b) return;
      Cinema.lbAbrir(imagens.map(function (i) { return { src: img(i.img), titulo: i.legenda || daGaleria(i.img).titulo || p.titulo }; }), Number(b.dataset.n), b);
    };
  }

  function render() {
    renderGrade();
    renderProjeto();
    if (window.Cinema) { Cinema.observar(); Cinema.aoRolar(); }
  }

  document.addEventListener("click", function (e) {
    var f = e.target.closest(".proj-filtro");
    if (!f) return;
    filtro = f.dataset.cat;
    Array.prototype.forEach.call(document.querySelectorAll(".proj-filtro"), function (b) { b.setAttribute("aria-pressed", String(b === f)); });
    Array.prototype.forEach.call(document.querySelectorAll("#proj-grade .proj"), function (a) { a.hidden = filtro !== "Todos" && a.dataset.cat !== filtro; });
  });

  render();
  return { render: render };
})();
