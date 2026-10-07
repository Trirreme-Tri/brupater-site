"use strict";

/* Regras da agenda (datas e estado das sessões), usadas pelo site e pelo painel. */

/* datas "AAAA-MM-DD" viram data local (sem o fuso empurrar pro dia anterior) */
function dataLocal(txt) {
  var p = String(txt || "").split("-").map(Number);
  if (p.length !== 3 || !p[0]) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}
function hojeZero() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
function dataExtenso(d) { return d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear(); }
function diasAte(d) { return Math.round((d - hojeZero()) / 86400000); }

/*
 * Estado da agenda, calculado a partir das sessões:
 *   aberta   → a sessão atual já abriu e ainda tem vaga
 *   esgotado → a sessão atual já abriu e todas as vagas foram preenchidas
 *   fechada  → nenhuma sessão aberta agora (ou a Bru ligou a pausa)
 * "atual" = a sessão mais recente que já abriu e não foi encerrada.
 */
function estadoSessao(s) {
  var abre = dataLocal(s.abre), vagas = Math.max(0, Number(s.vagas) || 0);
  var ocupadas = Math.min(vagas, Math.max(0, Number(s.ocupadas) || 0));
  var estado;
  if (s.encerrada) estado = "encerrada";
  else if (!abre || abre > hojeZero()) estado = "embreve";
  else if (ocupadas >= vagas) estado = "esgotado";
  else estado = "aberta";
  return { sessao: s, abre: abre, vagas: vagas, ocupadas: ocupadas, livres: vagas - ocupadas, estado: estado };
}
function sessoesOrdenadas(agenda) {
  return ((agenda || SITE.agenda).sessoes || []).map(estadoSessao)
    .filter(function (x) { return x.abre; })
    .sort(function (a, b) { return a.abre - b.abre; });
}
function estadoAgenda(agenda) {
  agenda = agenda || SITE.agenda;
  var lista = sessoesOrdenadas(agenda);
  var hoje = hojeZero();
  var jaAbertas = lista.filter(function (x) { return x.abre <= hoje && x.estado !== "encerrada"; });
  var atual = jaAbertas[jaAbertas.length - 1] || null;
  var proxima = lista.filter(function (x) { return x.abre > hoje && x.estado !== "encerrada"; })[0] || null;
  var estado = "fechada";
  if (!agenda.pausa && atual) estado = atual.estado === "aberta" ? "aberta" : "esgotado";
  return { estado: estado, atual: atual, proxima: proxima, lista: lista };
}
