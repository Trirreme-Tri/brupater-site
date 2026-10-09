"use client";

import { useSite } from "@/lib/useSite";
import { Vitrine } from "./Vitrine";
import { ProjetosGrade } from "./ProjetosGrade";
import { Chamadas, Ficha, Interludio, Links } from "./Secoes";

/* Página inicial: carrossel, projetos, links, ficha, interlúdios e chamadas */
export function Inicio() {
  const site = useSite();
  return (
    <main id="topo">
      <Vitrine />
      <ProjetosGrade />
      <Links />
      <Ficha />
      <Interludio id="interludio1" cena={site.cenas.interludio1} />
      <Chamadas />
      <Interludio id="interludio2" cena={site.cenas.interludio2} />
    </main>
  );
}
