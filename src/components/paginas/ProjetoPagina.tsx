"use client";

/* Página de um projeto (coleção), como no Behance: capa, texto e todas as imagens */
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSite } from "@/lib/useSite";
import { daGaleria, linkProjeto, projetosVisiveis, qtdImagens } from "@/lib/projetos";
import { estilo, img } from "@/lib/util";
import { LinkSite } from "@/components/site/LinkSite";
import { useCinema } from "@/components/site/Cinema";

export function ProjetoPagina() {
  const site = useSite();
  const { lbAbrir } = useCinema();
  const id = useSearchParams().get("p");
  const lista = projetosVisiveis(site);
  const p = lista.filter((x) => x.id === id)[0];

  /* o título da aba vem do projeto. O Next.js escreve o título padrão da rota
     ("Projeto") depois de montar; por isso o nome do projeto é reaplicado
     sempre que o título da página mudar. */
  const titulo = (p ? p.titulo : "Projeto") + " · " + (site.perfil.nome || "");
  useEffect(() => {
    const aplicar = () => {
      if (!/\/projeto\/?$/.test(window.location.pathname)) return;
      if (document.title !== titulo) document.title = titulo;
    };
    aplicar();
    const mo = new MutationObserver(aplicar);
    mo.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => mo.disconnect();
  }, [titulo]);

  if (!p) {
    return (
      <main id="pj" data-pagina="projeto">
        <section className="pj-vazio">
          <div>
            <p className="rotulo">projeto não encontrado</p>
            <h1 className="t-cinema pj-titulo">Ops!</h1>
            <p>Esse projeto não existe mais ou mudou de endereço.</p>
            <p style={{ marginTop: 22 }}><LinkSite className="btn cheio" href="/#projetos">Ver todos os projetos</LinkSite></p>
          </div>
        </section>
      </main>
    );
  }

  const imagens = (p.imagens || []).filter((i) => img(i.img));
  const paragrafos = String(p.texto || "").split(/\n+/).filter(Boolean);
  const pos = lista.indexOf(p);
  const prox = lista[(pos + 1) % lista.length];
  const abrir = (n: number, el: HTMLElement) =>
    lbAbrir(imagens.map((i) => ({ src: img(i.img), titulo: i.legenda || daGaleria(site, i.img).titulo || p.titulo })), n, el);

  return (
    <main id="pj" data-pagina="projeto">
      <section className="pj-capa" data-topo>
        <div className="pj-capa-img" style={estilo({ backgroundImage: "url('" + img(p.capa) + "')", "--foco": p.foco || "50% 40%" })}></div>
      </section>
      <header className="pj-cab">
        <p className="rotulo pj-cat">{p.categoria}</p>
        <h1 className="t-cinema pj-titulo">{p.titulo}</h1>
        <div className="pj-texto">{paragrafos.map((t, i) => <p key={i}>{t}</p>)}</div>
        <p className="rotulo pj-meta">{qtdImagens(p)}</p>
      </header>
      <div className="pj-imagens">
        {imagens.map((i, n) => {
          const g = daGaleria(site, i.img);
          return (
            <figure key={n} className="surge" style={{ margin: 0 }}>
              <button type="button" className="pj-img" data-n={n} aria-label={"Ver " + (i.legenda || g.titulo || "imagem " + (n + 1)) + " em tela cheia"} onClick={(e) => abrir(n, e.currentTarget)}>
                <img src={img(i.img)} alt={i.legenda || g.titulo || p.titulo} width={g.w || undefined} height={g.h || undefined} loading={n > 1 ? "lazy" : undefined} decoding="async" />
              </button>
              {i.legenda ? <figcaption>{i.legenda}</figcaption> : null}
            </figure>
          );
        })}
      </div>
      <nav className="pj-fim" aria-label="Outros projetos">
        {prox && prox !== p ? (
          <LinkSite className="proj" href={linkProjeto(prox)}>
            <img src={img(daGaleria(site, prox.capa).mini) || img(prox.capa)} alt="" loading="lazy" style={estilo({ "--foco": prox.foco || "50% 40%" })} />
            <span className="proj-txt"><span className="proj-cat">próximo projeto &#8594;</span><span className="proj-nome">{prox.titulo}</span></span>
          </LinkSite>
        ) : null}
        <LinkSite className="pj-voltar" href="/#projetos">&#8592; todos os projetos</LinkSite>
      </nav>
    </main>
  );
}
