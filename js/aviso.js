"use strict";

/*
 * Páginas de aviso: 404 (página não existe), erro (algo deu errado) e
 * manutenção (site fora do ar). Cada página diz qual é em
 * <body data-aviso="...">; textos e imagem vêm de SITE.paginasAviso.
 */
(function () {
  var chave = document.body.dataset.aviso;
  var a = (SITE.paginasAviso || {})[chave] || {};
  var p = SITE.perfil || {};
  var img = urlSegura(a.img, true);
  var num = String(p.whatsapp || "").replace(/\D/g, "");
  var whats = num ? "https://wa.me/" + num + "?text=" + encodeURIComponent(p.whatsappMensagem || "") : "";
  var insta = p.instagram ? "https://www.instagram.com/" + encodeURIComponent(p.instagram) + "/" : "";
  /* botão principal: no erro, tenta de novo; na manutenção, Instagram; no 404, início */
  var principal = chave === "erro" ? { href: "javascript:location.reload()", txt: a.botao || "Tentar de novo" }
    : chave === "manutencao" ? { href: insta || whats || "#", txt: a.botao || "Ir pro Instagram", fora: true }
    : { href: "index.html", txt: a.botao || "Voltar ao início" };

  document.getElementById("aviso").innerHTML =
    (img ? '<div class="aviso-fundo" style="background-image:url(\'' + esc(img) + '\')"></div>' +
      '<img class="aviso-arte" src="' + esc(img) + '" alt="">' : "") +
    '<div class="aviso-veu"></div>' +
    '<div class="wrap aviso-txt">' +
      '<p class="rotulo aviso-rotulo">' + esc(a.rotulo || "") + "</p>" +
      '<h1 class="t-cinema aviso-titulo">' + esc(a.titulo || "") + "</h1>" +
      '<p class="aviso-texto">' + esc(a.texto || "") + "</p>" +
      '<div class="aviso-ctas">' +
        '<a class="btn cheio" href="' + esc(principal.href) + '"' + (principal.fora ? ' target="_blank" rel="noopener"' : "") + ">" + esc(principal.txt) + "</a>" +
        (whats ? '<a class="btn" href="' + esc(whats) + '" target="_blank" rel="noopener">' + iconeSvg("whatsapp") + " WhatsApp</a>" : "") +
        (insta && chave !== "manutencao" ? '<a class="btn" href="' + esc(insta) + '" target="_blank" rel="noopener">' + iconeSvg("instagram") + " Instagram</a>" : "") +
      "</div>" +
      '<p class="aviso-assina"><img src="' + esc(urlSegura(p.avatar, true) || "assets/avatar.webp") + '" alt="" width="34" height="34"> ' + esc(p.nome || "") + "</p>" +
      '<p class="aviso-trirreme">Site desenvolvido pela <a href="https://trirreme.com" target="_blank" rel="noopener">TRIRREME</a></p>' +
    "</div>";
})();
