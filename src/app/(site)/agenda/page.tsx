import type { Metadata, Viewport } from "next";
import { AgendaPagina } from "@/components/paginas/AgendaPagina";
import { PADRAO } from "@/lib/conteudo/padrao";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Agenda de encomendas de " + PADRAO.perfil.nome + ": quando abre, quantas vagas e como anda a fila.",
};
export const viewport: Viewport = { themeColor: PADRAO.aparencia.cores.noite };

export default function Page() {
  return <AgendaPagina />;
}
