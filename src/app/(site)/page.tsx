import type { Viewport } from "next";
import { Inicio } from "@/components/paginas/inicio/Inicio";
import { PADRAO } from "@/lib/conteudo/padrao";

export const viewport: Viewport = { themeColor: PADRAO.aparencia.cores.papel };

export default function Page() {
  return <Inicio />;
}
