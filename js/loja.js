"use strict";

/*
 * Onde o conteúdo do site fica guardado.
 *
 * Hoje: o padrão vem de js/dados.js (PADRAO) e o que a Brunna edita no painel
 * fica salvo no navegador (localStorage). Este é o ÚNICO arquivo que precisa
 * mudar quando o conteúdo passar a morar num banco (ex.: Supabase, como no
 * site da Anne): carregar() e salvar() viram fetch, o resto do site não muda.
 */
var LOJA_CHAVE = "brupater:site:v1";

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

function lojaCarregar() {
  var salvo = null;
  try { salvo = JSON.parse(localStorage.getItem(LOJA_CHAVE) || "null"); } catch (e) { salvo = null; }
  return mesclar(copiaProfunda(PADRAO), salvo || {});
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
