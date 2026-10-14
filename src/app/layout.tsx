import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { PADRAO } from "@/lib/conteudo/padrao";
import { PREVIA_CHAVE } from "@/lib/loja";
import { CHAVE_CACHE } from "@/lib/firebase/constantes";
import { CSS_ANTI_PISCADA, SCRIPT_ANTI_PISCADA } from "@/lib/firebase/antiPiscada";
import { TEMA_CHAVE, aplicarTema } from "@/lib/tema";
import { InlineScript } from "@/components/InlineScript";
import { rota } from "@/lib/util";
import "@/styles/tokens.css";
import "@/styles/base.css";

const p = PADRAO.perfil;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: { default: p.nome + " · " + p.titulo, template: "%s · " + p.nome },
  description: p.nome + " (@" + p.handle + "): ilustração e design gráfico. Projetos, portfólio, agenda e encomendas.",
  icons: { icon: rota("/assets/avatar.webp") },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: PADRAO.aparencia.cores.papel,
};

/* aplica cores, fontes e tema escolhidos no painel ANTES da página aparecer */
const scriptTema =
  "(" + aplicarTema.toString() + ")(" +
  JSON.stringify({ padrao: PADRAO.aparencia, lojaChave: CHAVE_CACHE, previaChave: PREVIA_CHAVE, temaChave: TEMA_CHAVE }) + ");";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* visita repetida: esconde a página até o conteúdo salvo chegar (evita ver o padrão por um instante) */}
        <InlineScript html={SCRIPT_ANTI_PISCADA} />
        <style dangerouslySetInnerHTML={{ __html: CSS_ANTI_PISCADA }} />
        <InlineScript html={scriptTema} />
      </head>
      <body>{children}</body>
    </html>
  );
}
