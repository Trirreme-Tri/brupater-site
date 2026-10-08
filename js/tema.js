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
  /* na prévia do painel, o modo vem do endereço (?tema=dark|light) */
  var naPrevia = window.PREVIA && /[?&]tema=(dark|light)/.exec(location.search);
  if (naPrevia) escolha = naPrevia[1];
  var tema = escolha === "light" || escolha === "dark" ? escolha : (ap.tema === "auto" ? "" : (ap.tema === "escuro" ? "dark" : "light"));
  if (tema) raiz.setAttribute("data-theme", tema); else raiz.removeAttribute("data-theme");

  temaCoresModos(ap.modos);
  temaCarregarFontes(ap.fontes);
}

/* Cores separadas por modo (claro/escuro): vira uma folha de estilo com as
   variáveis de cada modo. Só aceita cor no formato #RRGGBB. */
function temaCoresModos(modos) {
  if (!modos) return;
  var hex = function (v) { return /^#[0-9a-f]{6}$/i.test(String(v || "")) ? v : null; };
  function vars(m) {
    if (!m) return "";
    var mapa = {
      "--casa-bg": m.fundo, "--bg": m.fundo, "--casa-bg2": m.secao, "--bg-2": m.secao,
      "--casa-ink": m.texto, "--ink": m.texto, "--casa-soft": m.textoSuave, "--ink-soft": m.textoSuave,
      "--nav-bg": m.barra, "--nav-ink": m.barraTexto, "--rodape-bg": m.rodape, "--rodape-ink": m.rodapeTexto
    };
    var css = Object.keys(mapa).filter(function (k) { return hex(mapa[k]); }).map(function (k) { return k + ":" + mapa[k]; }).join(";");
    if (hex(m.texto)) css += ";--casa-line:color-mix(in srgb," + m.texto + " 18%,transparent);--line:color-mix(in srgb," + m.texto + " 18%,transparent)";
    return css;
  }
  var claro = vars(modos.claro), escuro = vars(modos.escuro);
  var css = ":root{" + claro + "}:root[data-theme=\"light\"]{" + claro + "}:root[data-theme=\"dark\"]{" + escuro + "}" +
    "@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){" + escuro + "}}";
  var el = document.getElementById("tema-modos");
  if (!el) { el = document.createElement("style"); el.id = "tema-modos"; document.head.appendChild(el); }
  el.textContent = css;
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

/* Prepara a tela de carregamento (roda logo depois dela no HTML, antes do
   resto da página aparecer): nome, título, avatar e qual versão mostrar. */
function cortinaPreparar() {
  var c = document.getElementById("cortina");
  if (!c || !window.SITE) return;
  var p = SITE.perfil || {}, ap = SITE.aparencia || {};
  if (ap.carregamento === false || window.PREVIA) { c.className += " pular"; return; }
  var jaViu = false;
  try { jaViu = sessionStorage.getItem("brupater:intro") === "1"; } catch (e) {}
  if (jaViu) c.className += " rapida";
  var nome = document.getElementById("cort-nome"), sub = document.getElementById("cort-sub"), av = document.getElementById("cort-avatar");
  if (nome) nome.textContent = p.nome || "";
  if (sub) sub.textContent = p.titulo || "";
  if (av && p.avatar && urlSegura(p.avatar, true)) av.src = urlSegura(p.avatar, true);
}

/* marca quando a página terminou de montar (usado pela tela de carregamento) */
document.addEventListener("DOMContentLoaded", function () { window.PAGINA_PRONTA = true; });
