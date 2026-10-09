/* Regras da agenda (datas e estado das sessões), usadas pelo site e pelo painel. */
import type { Agenda, EstadoAgendaNome, Sessao } from "./conteudo/tipos";

/** datas "AAAA-MM-DD" viram data local (sem o fuso empurrar pro dia anterior) */
export function dataLocal(txt: string): Date | null {
  const p = String(txt || "").split("-").map(Number);
  if (p.length !== 3 || !p[0]) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}
export function hojeZero(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export function dataExtenso(d: Date): string {
  return d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear();
}
export function diasAte(d: Date): number {
  return Math.round((d.getTime() - hojeZero().getTime()) / 86400000);
}

export type EstadoSessaoNome = "aberta" | "esgotado" | "embreve" | "encerrada";
export interface EstadoSessao {
  sessao: Sessao;
  abre: Date | null;
  vagas: number;
  ocupadas: number;
  livres: number;
  estado: EstadoSessaoNome;
}
export interface EstadoSessaoComData extends EstadoSessao {
  abre: Date;
}

export function estadoSessao(s: Sessao): EstadoSessao {
  const abre = dataLocal(s.abre);
  const vagas = Math.max(0, Number(s.vagas) || 0);
  const ocupadas = Math.min(vagas, Math.max(0, Number(s.ocupadas) || 0));
  let estado: EstadoSessaoNome;
  if (s.encerrada) estado = "encerrada";
  else if (!abre || abre > hojeZero()) estado = "embreve";
  else if (ocupadas >= vagas) estado = "esgotado";
  else estado = "aberta";
  return { sessao: s, abre, vagas, ocupadas, livres: vagas - ocupadas, estado };
}

export function sessoesOrdenadas(agenda: Agenda): EstadoSessaoComData[] {
  return (agenda.sessoes || [])
    .map(estadoSessao)
    .filter((x): x is EstadoSessaoComData => !!x.abre)
    .sort((a, b) => a.abre.getTime() - b.abre.getTime());
}

/*
 * Estado da agenda, calculado a partir das sessões:
 *   aberta   → a sessão atual já abriu e ainda tem vaga
 *   esgotado → a sessão atual já abriu e todas as vagas foram preenchidas
 *   fechada  → nenhuma sessão aberta agora (ou a Bru ligou a pausa)
 * "atual" = a sessão mais recente que já abriu e não foi encerrada.
 */
export interface EstadoAgenda {
  estado: EstadoAgendaNome;
  atual: EstadoSessaoComData | null;
  proxima: EstadoSessaoComData | null;
  lista: EstadoSessaoComData[];
}
export function estadoAgenda(agenda: Agenda): EstadoAgenda {
  const lista = sessoesOrdenadas(agenda);
  const hoje = hojeZero();
  const jaAbertas = lista.filter((x) => x.abre <= hoje && x.estado !== "encerrada");
  const atual = jaAbertas[jaAbertas.length - 1] || null;
  const proxima = lista.filter((x) => x.abre > hoje && x.estado !== "encerrada")[0] || null;
  let estado: EstadoAgendaNome = "fechada";
  if (!agenda.pausa && atual) estado = atual.estado === "aberta" ? "aberta" : "esgotado";
  return { estado, atual, proxima, lista };
}

export const TITULOS_ESTADO: Record<EstadoAgendaNome, string> = {
  aberta: "Encomendas abertas",
  esgotado: "Vagas esgotadas",
  fechada: "Encomendas fechadas",
};
