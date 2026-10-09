"use client";

/* Portfólio: galeria com filtros; tocando numa arte, abre em tela cheia */
import { useState } from "react";
import { useSite } from "@/lib/useSite";
import { img } from "@/lib/util";
import { instagramUrl } from "@/lib/contato";
import { Cabecalho } from "@/components/site/Cabecalho";
import { useCinema } from "@/components/site/Cinema";

export function Portfolio() {
  const site = useSite();
  const { lbAbrir } = useCinema();
  const [escolhido, setFiltro] = useState("Todos");
  const obras = site.galeria.filter((o) => o.visivel !== false && img(o.img));
  const tags = ["Todos"];
  obras.forEach((o) => { if (o.tag && tags.indexOf(o.tag) < 0) tags.push(o.tag); });
  const filtro = tags.indexOf(escolhido) < 0 ? "Todos" : escolhido;
  const visiveis = obras.filter((o) => filtro === "Todos" || o.tag === filtro);

  return (
    <>
      <Cabecalho pagina="portfolio" />
      <main className="portfolio" id="portfolio">
        <div className="wrap">
          <p className="cena-sub surge">Toque numa arte para ver em tela cheia.</p>
          <div className="filtros" id="filtros" role="group" aria-label="Filtrar portfólio">
            {tags.map((t) => (
              <button key={t} type="button" className="filtro" data-tag={t} aria-pressed={t === filtro} onClick={() => setFiltro(t)}>{t}</button>
            ))}
          </div>
          <div className="galeria" id="galeria">
            {obras.map((o, i) => {
              const sai = filtro !== "Todos" && o.tag !== filtro;
              return (
                <button
                  key={o.img + i}
                  type="button"
                  className={"obra surge" + (sai ? " sai" : "")}
                  data-i={i}
                  aria-label={"Ver " + (o.titulo || "arte") + " em tela cheia"}
                  onClick={(e) => lbAbrir(visiveis.map((v) => ({ src: img(v.img), titulo: v.titulo })), visiveis.indexOf(o), e.currentTarget)}
                >
                  <figure style={{ margin: 0 }}>
                    <img src={img(o.mini) || img(o.img)} alt={o.titulo || "Arte da Brunna"} width={o.w || undefined} height={o.h || undefined} loading="lazy" decoding="async" />
                    <figcaption><small>{o.tag}</small><b>{o.titulo}</b></figcaption>
                  </figure>
                </button>
              );
            })}
          </div>
          <p className="galeria-mais">
            <a href={instagramUrl(site)} id="galeria-ig" target="_blank" rel="noopener">tem muito mais no Instagram &#8599;</a>
          </p>
        </div>
      </main>
    </>
  );
}
