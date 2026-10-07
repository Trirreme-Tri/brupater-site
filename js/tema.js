"use strict";

/*
 * Aplica a aparência escolhida no painel (cores, fontes, grão, barras de
 * cinema, movimento, tema claro/escuro). Roda no <head>, antes da página
 * aparecer, pra não piscar a cor padrão antes da escolhida.
 */
function temaAplicar(site) {
  var ap = site.aparencia;
  var raiz = document.documentElement;
  var c = ap.cores;

  var mapa = {
    "--rosa": c.rosa, "--poster": c.poster, "--vinho": c.vinho,
    "--violeta": c.violeta, "--teal": c.teal, "--papel": c.papel, "--noite": c.noite
  };
  Object.keys(mapa).forEach(function (k) { if (mapa[k]) raiz.style.setProperty(k, mapa[k]); });

  raiz.style.setProperty("--f-cinema", '"' + ap.fontes.cinema + '", "Playfair Display", Georgia, serif');
  raiz.style.setProperty("--f-poster", '"' + ap.fontes.poster + '", "Montserrat", system-ui, sans-serif');
  raiz.style.setProperty("--f-mao", '"' + ap.fontes.mao + '", "Comic Sans MS", cursive');

  raiz.dataset.grao = ap.grao ? "on" : "off";
  raiz.dataset.barras = ap.barras ? "on" : "off";
  raiz.dataset.movimento = ap.movimento;

  /* "auto" segue o sistema; a pessoa ainda pode trocar no botão do site,
     e essa troca vale só pra ela (fica no navegador dela) */
  var escolhaVisitante = null;
  try { escolhaVisitante = localStorage.getItem("brupater:tema"); } catch (e) {}
  var tema = escolhaVisitante || (ap.tema === "auto" ? "" : (ap.tema === "claro" ? "light" : "dark"));
  if (tema) raiz.setAttribute("data-theme", tema); else raiz.removeAttribute("data-theme");

  temaCarregarFontes(ap.fontes);
}

function temaCarregarFontes(fontes) {
  var familias = [fontes.cinema, fontes.poster, fontes.mao];
  /* Montserrat também é a fonte do corpo do texto: sempre carrega, com os pesos que o site usa */
  var partes = familias.filter(function (f, i) { return familias.indexOf(f) === i && f !== "Montserrat"; })
    .map(function (f) { return "family=" + encodeURIComponent(f).replace(/%20/g, "+"); });
  partes.push("family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500");
  var href = "https://fonts.googleapis.com/css2?" + partes.join("&") + "&display=swap";

  var link = document.getElementById("fontes-tema");
  if (!link) {
    link = document.createElement("link");
    link.id = "fontes-tema";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) link.setAttribute("href", href);
}

/* página pública e apresentação chamam isso logo ao carregar */
var SITE = lojaCarregar();
temaAplicar(SITE);
