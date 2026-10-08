"use strict";

/*
 * Onde o conteúdo do site fica guardado.
 *
 * Hoje: o padrão vem de js/dados.js (PADRAO) e o que a Brunna edita no painel
 * fica salvo no navegador (localStorage). Este é o ÚNICO arquivo que precisa
 * mudar quando o conteúdo passar a morar num banco (ex.: Supabase, como no
 * site da Anne): carregar() e salvar() viram fetch, o resto do site não muda.
 */
/* v2: as imagens do portfólio foram trocadas (out/2026). Mudar a chave
   descarta edições antigas salvas no navegador que apontavam para imagens
   que não existem mais — sem isso, apareceriam imagens quebradas. */
var LOJA_CHAVE = "brupater:site:v2";

/* Prévia ao vivo do painel: o painel grava o rascunho (ainda não salvo) em
   PREVIA_CHAVE e mostra o site num quadro com ?previa=1. Nesse modo o site lê
   o rascunho em vez do conteúdo salvo, e redesenha a cada mudança. */
var PREVIA = /[?&]previa=1(&|$)/.test(location.search);
var PREVIA_CHAVE = "brupater:previa";
function lojaChaveAtual() { return PREVIA ? PREVIA_CHAVE : LOJA_CHAVE; }
function lojaPrevia(site) {
  try { localStorage.setItem(PREVIA_CHAVE, JSON.stringify(site)); return true; } catch (e) { return false; }
}

/* junta o que foi salvo por cima do padrão. Objetos são mesclados campo a
   campo (assim um campo novo no PADRAO aparece mesmo pra quem já salvou
   antes); listas e valores simples salvos substituem os do padrão. */
function mesclar(base, salvo) {
  if (Array.isArray(base) || Array.isArray(salvo)) return salvo !== undefined ? salvo : base;
  if (base && typeof base === "object" && salvo && typeof salvo === "object") {
    var saida = {};
    Object.keys(base).forEach(function (k) { saida[k] = mesclar(base[k], salvo[k]); });
    Object.keys(salvo).forEach(function (k) { if (!(k in saida)) saida[k] = salvo[k]; });
    return saida;
  }
  return salvo !== undefined ? salvo : base;
}

function copiaProfunda(obj) { return JSON.parse(JSON.stringify(obj)); }

/* Ajustes que rodam UMA vez em dados já salvos no navegador. Sem isso, um
   campo que já tinha sido salvo (ex.: WhatsApp vazio, título antigo) não
   recebe o valor novo do PADRAO. Cada ajuste fica anotado em site.migracoes. */
var MIGRACOES = [
  { id: "2026-10-pdf-bru", rodar: function (s) {
    if (!String(s.perfil.whatsapp || "").replace(/\D/g, "")) s.perfil.whatsapp = PADRAO.perfil.whatsapp;
    if (s.perfil.titulo === "RPG Character Creation") s.perfil.titulo = PADRAO.perfil.titulo;
    if (s.cenas.abertura.kicker === "RPG Character Creation") s.cenas.abertura.kicker = PADRAO.cenas.abertura.kicker;
  } },
  /* out/2026: o topo passou a mostrar a arte inteira por padrão (estava cortando) */
  { id: "2026-10-topo-inteira", rodar: function (s) { s.cenas.abertura.modo = "inteira"; } }
];

function lojaCarregar() {
  var salvo = null;
  try { salvo = JSON.parse((PREVIA && localStorage.getItem(PREVIA_CHAVE)) || localStorage.getItem(LOJA_CHAVE) || "null"); } catch (e) { salvo = null; }
  var site = mesclar(copiaProfunda(PADRAO), salvo || {});
  var feitas = (salvo && salvo.migracoes) || [];
  var rodou = false;
  MIGRACOES.forEach(function (m) {
    if (feitas.indexOf(m.id) >= 0) return;
    if (salvo) { try { m.rodar(site); rodou = true; } catch (e) { /* dado estranho: deixa como está */ } }
    feitas.push(m.id);
  });
  site.migracoes = feitas;
  if (rodou && !PREVIA) { try { localStorage.setItem(LOJA_CHAVE, JSON.stringify(site)); } catch (e) { /* sem espaço: roda de novo na próxima */ } }
  return site;
}

/* devolve true se salvou; lança erro com mensagem amigável se não coube */
function lojaSalvar(site) {
  try {
    localStorage.setItem(LOJA_CHAVE, JSON.stringify(site));
    return true;
  } catch (e) {
    throw new Error("Não coube no armazenamento do navegador. Use imagens menores ou menos imagens enviadas do computador.");
  }
}

function lojaRestaurarPadrao() {
  try { localStorage.removeItem(LOJA_CHAVE); } catch (e) { /* sem armazenamento: já está no padrão */ }
}

/* ===== utilidades compartilhadas pelas três páginas ===== */

/* escapa texto antes de ir pro innerHTML — todo conteúdo editável passa aqui */
function esc(txt) {
  return String(txt == null ? "" : txt)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* só deixa passar links seguros: http(s), âncora, caminho relativo e imagem em data: */
function urlSegura(url, permitirDataImg) {
  var u = String(url || "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u) || u.charAt(0) === "#" || /^[\w.\-\/]+(\.\w+)?([?#].*)?$/.test(u)) return u;
  if (permitirDataImg && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(u)) return u;
  return "";
}

function brl(n) {
  return "R$ " + Number(n || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
