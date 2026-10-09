import type { Metadata, Viewport } from "next";
import { Encomendas } from "@/components/paginas/Encomendas";
import { PADRAO } from "@/lib/conteudo/padrao";

export const metadata: Metadata = {
  title: "Encomendas",
  description: "Crie seu personagem: monte sua encomenda com " + PADRAO.perfil.nome + " (@" + PADRAO.perfil.handle + ") e veja o preço na hora.",
};
export const viewport: Viewport = { themeColor: PADRAO.aparencia.cores.noite };

export default function Page() {
  return <Encomendas />;
}
