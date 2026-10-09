"use client";

/* Projetos (coleções) na página inicial: grade de capas com filtro por categoria */
import { useState } from "react";
import { useSite } from "@/lib/useSite";
import { daGaleria, linkProjeto, projetosVisiveis, qtdImagens } from "@/lib/projetos";
import { estilo, img } from "@/lib/util";
import { LinkSite } from "@/components/site/LinkSite";

export function ProjetosGrade() {
  const site = useSite();
  const [filtroEscolhido, setFiltro] = useState("Todos");
  const sec = site.secaoProjetos || { titulo: "", sub: "" };
  const lista = projetosVisiveis(site);
  const cats: string[] = [];
  lista.forEach((p) => { if (p.categoria && cats.indexOf(p.categoria) < 0) cats.push(p.categoria); });
  const filtro = cats.indexOf(filtroEscolhido) < 0 ? "Todos" : filtroEscolhido;

  return (
    <section className="projetos" id="projetos" aria-labelledby="projetos-t" hidden={!lista.length}>
      <div className="wrap">
        <header className="projetos-cab">
          <div>
            <h2 className="projetos-t t-cinema surge" id="projetos-t">{sec.titulo || "Projetos"}</h2>
            <p className="projetos-sub surge" id="projetos-sub">{sec.sub || ""}</p>
          </div>
          {/* com uma categoria só, o filtro não faz sentido */}
          <div className="proj-filtros" id="proj-filtros" role="group" aria-label="Filtrar projetos">
            {cats.length < 2 ? null : ["Todos"].concat(cats).map((c) => (
              <button key={c} type="button" className="proj-filtro" data-cat={c} aria-pressed={c === filtro} onClick={() => setFiltro(c)}>
                {c}
              </button>
            ))}
          </div>
        </header>
        <div className="proj-grade" id="proj-grade">
          {lista.map((p) => {
            const g = daGaleria(site, p.capa);
            const capa = img(g.mini) || img(p.capa);
            return (
              <LinkSite key={p.id} className="proj surge" href={linkProjeto(p)} data-cat={p.categoria} hidden={filtro !== "Todos" && p.categoria !== filtro}>
                <img src={capa} alt="" loading="lazy" decoding="async" style={estilo({ "--foco": p.foco || "50% 40%" })} />
                <span className="proj-txt">
                  <span className="proj-cat">{p.categoria}</span>
                  <span className="proj-nome">{p.titulo}</span>
                  <span className="proj-qtd">{p.resumo || qtdImagens(p)}</span>
                </span>
              </LinkSite>
            );
          })}
        </div>
      </div>
    </section>
  );
}
