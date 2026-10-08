"use strict";

/*
 * Aplica a aparência escolhida no painel (cores, fontes, grão, barras de
 * cinema, movimento, tema claro/escuro). Roda no <head>, antes da página
 * aparecer, pra não piscar a cor padrão antes da escolhida.
 */
var TEMA_CHAVE = "brupater:modo";

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

  /* Tema inicial vem do painel ("claro", "escuro" ou "auto" = segue o aparelho).
     Quem visita pode trocar no botão sol/lua do topo; essa escolha vale só
     pra ela (fica no navegador dela). Sem o botão, vale sempre o do painel. */
  try { localStorage.removeItem("brupater:tema"); } catch (e) {}
  var escolha = null;
  if (ap.botaoTema !== false) { try { escolha = localStorage.getItem(TEMA_CHAVE); } catch (e) {} }
  var tema = escolha === "light" || escolha === "dark" ? escolha : (ap.tema === "auto" ? "" : (ap.tema === "escuro" ? "dark" : "light"));
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
