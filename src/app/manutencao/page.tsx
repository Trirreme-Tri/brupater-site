import type { Metadata, Viewport } from "next";
import "@/styles/site.css";
import { AvisoPagina } from "@/components/paginas/AvisoPagina";
import { PADRAO } from "@/lib/conteudo/padrao";

/* "site fora do ar": pronta pra quando o site estiver em manutenção */
export const metadata: Metadata = { title: "Voltamos já", robots: { index: false } };
export const viewport: Viewport = { themeColor: PADRAO.aparencia.cores.noite };

export default function Page() {
  return <AvisoPagina tipo="manutencao" />;
}
