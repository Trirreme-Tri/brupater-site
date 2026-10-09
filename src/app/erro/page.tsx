import type { Metadata, Viewport } from "next";
import "@/styles/site.css";
import { AvisoPagina } from "@/components/paginas/AvisoPagina";
import { PADRAO } from "@/lib/conteudo/padrao";

/* modelo da página de erro (a mesma aparece sozinha quando algo quebra: app/error.tsx) */
export const metadata: Metadata = { title: "Algo deu errado", robots: { index: false } };
export const viewport: Viewport = { themeColor: PADRAO.aparencia.cores.noite };

export default function Page() {
  return <AvisoPagina tipo="erro" />;
}
