"use client";

/*
 * Topo de cinema das páginas internas (portfólio, agenda, encomendas).
 * A arte fica encostada à direita na altura toda. Pra borda esquerda dela
 * se dissolver no degradê (sem corte reto), o CSS precisa saber onde a arte
 * começa: calculamos isso pelo tamanho real da imagem (--arte-ini).
 */
import { useEffect, useRef } from "react";
import type { PaginaInterna } from "@/lib/conteudo/tipos";
import { useSite } from "@/lib/useSite";
import { estilo, img } from "@/lib/util";

export function Cabecalho({ pagina }: { pagina: PaginaInterna }) {
  const site = useSite();
  const c = (site.cenas.paginas || ({} as typeof site.cenas.paginas))[pagina] || { img: "", titulo: "", sub: "" };
  const url = img(c.img);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url) return;
    let timer: number | undefined;
    let vivo = true;
    const im = new Image();
    const medir = () => {
      const box = caixa.current;
      if (!vivo || !box || !im.naturalHeight) return;
      const larg = (box.clientHeight * im.naturalWidth) / im.naturalHeight;
      const ini = Math.max(0, ((box.clientWidth - larg) / box.clientWidth) * 100);
      box.style.setProperty("--arte-ini", ini.toFixed(1) + "%");
    };
    const aoRedimensionar = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(medir, 150);
    };
    im.onload = () => {
      if (!vivo) return;
      medir();
      window.addEventListener("resize", aoRedimensionar);
    };
    im.src = url;
    return () => {
      vivo = false;
      window.clearTimeout(timer);
      window.removeEventListener("resize", aoRedimensionar);
    };
  }, [url]);

  return (
    <section className="cabecalho" id="cabecalho" data-topo aria-labelledby="cab-t">
      <div
        className="cab-img"
        ref={caixa}
        style={estilo({ backgroundImage: "url('" + url + "')", "--foco": c.foco || "50% 40%" })}
      ></div>
      <div className="barra-cine topo" aria-hidden="true"></div>
      <div className="barra-cine base" aria-hidden="true"></div>
      <div className="wrap cab-txt">
        <h1 className="cab-titulo t-cinema" id="cab-t">{c.titulo || ""}</h1>
        <p className="cab-sub">{c.sub || ""}</p>
      </div>
    </section>
  );
}
