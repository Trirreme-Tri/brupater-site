"use strict";

/*
 * Moldura comum às páginas públicas: navegação, rodapé e lightbox.
 * Fica num lugar só pra não repetir o mesmo HTML em cada página.
 * Cada página diz quem é em <body data-pagina="...">.
 */
(function () {
  var pagina = document.body.dataset.pagina || "inicio";
  var itens = [
    { id: "inicio", nome: "Início", href: "index.html" },
    { id: "portfolio", nome: "Portfólio", href: "portfolio.html" },
    { id: "agenda", nome: "Agenda", href: "agenda.html" }
  ];

  var nav = document.createElement("header");
  nav.className = "nav";
  nav.id = "nav";
  nav.innerHTML =
    '<div class="nav-in">' +
      '<a class="marca" href="index.html" aria-label="Início"><img class="js-avatar" src="assets/avatar.webp" width="150" height="150" alt=""><span class="t-cinema js-nome-curto">brupater</span></a>' +
      '<nav class="nav-links" aria-label="Páginas">' + itens.map(function (i) {
        return '<a href="' + i.href + '"' + (i.id === pagina ? ' aria-current="page"' : "") + ">" + i.nome + "</a>";
      }).join("") + "</nav>" +
      '<div class="nav-acoes">' +
        '<a class="btn cheio nav-cta" href="encomendas.html"' + (pagina === "encomendas" ? ' aria-current="page"' : "") + ">Encomendar</a>" +
        '<button class="menu-btn" type="button" id="menu-btn" aria-expanded="false" aria-controls="menu-movel" aria-label="Abrir menu"><span></span><span></span></button>' +
      "</div>" +
    "</div>" +
    '<nav class="menu-movel" id="menu-movel" aria-label="Páginas" hidden>' + itens.concat([{ id: "encomendas", nome: "Encomendas", href: "encomendas.html" }]).map(function (i) {
      return '<a href="' + i.href + '"' + (i.id === pagina ? ' aria-current="page"' : "") + ">" + i.nome + "</a>";
    }).join("") + "</nav>";
  document.body.insertBefore(nav, document.body.firstChild);

  var menuBtn = nav.querySelector("#menu-btn"), menu = nav.querySelector("#menu-movel");
  menuBtn.addEventListener("click", function () {
    var abrir = menu.hidden;
    menu.hidden = !abrir;
    menuBtn.setAttribute("aria-expanded", String(abrir));
    nav.classList.toggle("menu-aberto", abrir);
  });

  var rodape = document.createElement("footer");
  rodape.className = "rodape";
  rodape.innerHTML =
    '<div class="wrap">' +
      '<p class="fim">Fim</p>' +
      '<p class="fim-sub" id="rod-assinatura"></p>' +
      '<nav class="rodape-nav" aria-label="Páginas">' + itens.concat([{ nome: "Encomendas", href: "encomendas.html" }]).map(function (i) {
        return '<a href="' + i.href + '">' + i.nome + "</a>";
      }).join("") + "</nav>" +
      '<div class="creditos"><span>arte e personagens <b id="rod-nome"></b></span><span><a href="#" id="rod-ig" target="_blank" rel="noopener"></a></span></div>' +
      '<p class="trirreme">Site desenvolvido pela <a href="https://trirreme.com" target="_blank" rel="noopener">TRIRREME</a></p>' +
    "</div>";
  document.body.appendChild(rodape);

  var lb = document.createElement("div");
  lb.className = "lb";
  lb.id = "lb";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Arte em tela cheia");
  lb.innerHTML =
    '<button class="fechar" type="button" aria-label="Fechar">&times;</button>' +
    '<button class="ant" type="button" aria-label="Arte anterior">&#8592;</button>' +
    '<figure><img id="lb-img" src="" alt=""><figcaption id="lb-cap"></figcaption></figure>' +
    '<button class="prox" type="button" aria-label="Próxima arte">&#8594;</button>';
  document.body.appendChild(lb);

  /* WhatsApp flutuante no cantinho (pedido da Bru). O número e o texto vêm
     do painel (Perfil → Contato); o js/site.js preenche e esconde se não tiver número. */
  var whats = document.createElement("a");
  whats.className = "whats-flut";
  whats.id = "whats-flut";
  whats.target = "_blank";
  whats.rel = "noopener";
  whats.hidden = true;
  whats.innerHTML = '<span class="wf-txt"></span><span class="wf-ico"></span>';
  document.body.appendChild(whats);

  var aviso = document.createElement("div");
  aviso.className = "aviso-site";
  aviso.id = "aviso-site";
  aviso.setAttribute("role", "status");
  aviso.setAttribute("aria-live", "polite");
  document.body.appendChild(aviso);
})();
