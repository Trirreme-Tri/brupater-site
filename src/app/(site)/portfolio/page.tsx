import type { Metadata, Viewport } from "next";
import { Portfolio } from "@/components/paginas/Portfolio";
import { PADRAO } from "@/lib/conteudo/padrao";

export const metadata: Metadata = {
  title: "Portfólio",
  description: "Portfólio de " + PADRAO.perfil.nome + " (@" + PADRAO.perfil.handle + "): personagens, pôsteres, ilustrações e estudos.",
};
export const viewport: Viewport = { themeColor: PADRAO.aparencia.cores.noite };

export default function Page() {
  return <Portfolio />;
}
