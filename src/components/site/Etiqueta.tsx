import type { EstadoAgendaNome, Site } from "@/lib/conteudo/tipos";
import { TITULOS_ESTADO } from "@/lib/agenda";

const CLASSE: Record<EstadoAgendaNome, string> = { aberta: "", esgotado: "esgotado", fechada: "fechada" };

/* etiqueta rosa inclinada, como o "OPEN" dos pôsteres dela */
export function Etiqueta({ site, estado }: { site: Site; estado: EstadoAgendaNome }) {
  const txt = (site.agenda.etiquetas || {})[estado] || TITULOS_ESTADO[estado];
  return <span className={("etiqueta " + CLASSE[estado]).trim()}>{txt}</span>;
}
