import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { ProjetoPagina } from "@/components/paginas/ProjetoPagina";
import { PADRAO } from "@/lib/conteudo/padrao";

/* o projeto vem do endereço: /projeto?p=<id> (lido no navegador) */
/* o título da aba ganha o nome do projeto quando a página monta */
export const metadata: Metadata = {
  title: "Projeto",
  description: "Projeto de ilustração ou identidade visual de " + PADRAO.perfil.nome + " (@" + PADRAO.perfil.handle + ").",
};
export const viewport: Viewport = { themeColor: PADRAO.aparencia.cores.papel };

export default function Page() {
  return (
    <Suspense fallback={<main id="pj" data-pagina="projeto" />}>
      <ProjetoPagina />
    </Suspense>
  );
}
