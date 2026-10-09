import type { ReactNode } from "react";
import "@/styles/site.css";
import { InlineScript } from "@/components/InlineScript";
import { Cortina } from "@/components/site/Cortina";
import { scriptCortina } from "@/lib/cortina";
import { CinemaProvider } from "@/components/site/Cinema";
import { Nav } from "@/components/site/Nav";
import { Rodape } from "@/components/site/Rodape";
import { WhatsFlutuante } from "@/components/site/WhatsFlutuante";
import { Musica } from "@/components/site/Musica";

/*
 * Moldura das páginas públicas. Tudo aqui fica montado enquanto a pessoa
 * navega entre as páginas (a troca não recarrega o site): por isso o mini
 * player de música continua tocando.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Cortina />
      <InlineScript html={scriptCortina} />
      <CinemaProvider>
        <Nav />
        {children}
        <Rodape />
        <WhatsFlutuante />
        <Musica />
      </CinemaProvider>
    </>
  );
}
