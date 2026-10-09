import type { Metadata } from "next";
import "@/styles/site.css";
import { AvisoPagina } from "@/components/paginas/AvisoPagina";

/* aparece sozinha em qualquer endereço que não existe (404) */
export const metadata: Metadata = { title: "Página não encontrada", robots: { index: false } };

export default function NaoEncontrada() {
  return <AvisoPagina tipo="naoEncontrada" />;
}
