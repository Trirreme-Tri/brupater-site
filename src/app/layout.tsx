import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { PADRAO } from "@/lib/conteudo/padrao";
import { LOJA_CHAVE, PREVIA_CHAVE } from "@/lib/loja";
import { TEMA_CHAVE, aplicarTema } from "@/lib/tema";
import { InlineScript } from "@/components/InlineScript";
import "@/styles/tokens.css";
import "@/styles/base.css";

const p = PADRAO.perfil;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: { default: p.nome + " · " + p.titulo, template: "%s · " + p.nome },
  description: p.nome + " (@" + p.handle + "): ilustração e design gráfico. Projetos, portfólio, agenda e encomendas.",
  icons: { icon: "/assets/avatar.webp" },
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
  JSON.stringify({ padrao: PADRAO.aparencia, lojaChave: LOJA_CHAVE, previaChave: PREVIA_CHAVE, temaChave: TEMA_CHAVE }) + ");";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <InlineScript html={scriptTema} />
      </head>
      <body>{children}</body>
    </html>
  );
}
