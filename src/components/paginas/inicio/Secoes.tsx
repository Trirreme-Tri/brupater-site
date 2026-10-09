"use client";

/* Seções da página inicial: links, ficha da personagem, interlúdios e chamadas */
import { Fragment } from "react";
import type { Faixa, ItemFicha, Site } from "@/lib/conteudo/tipos";
import { useMontado, useSite } from "@/lib/useSite";
import { dataExtenso, estadoAgenda, TITULOS_ESTADO } from "@/lib/agenda";
import { brl, estilo, img, rotaInterna, urlSegura } from "@/lib/util";
import { Icone } from "@/components/site/Icone";
import { Etiqueta } from "@/components/site/Etiqueta";
import { LinkSite } from "@/components/site/LinkSite";

/* ===== links ("onde me achar") ===== */
export function Links() {
  const site = useSite();
  return (
    <section className="creditos-ini" id="creditos" aria-labelledby="creditos-t">
      <div className="wrap">
        <h2 className="rotulo creditos-t surge" id="creditos-t">onde me achar</h2>
        <div className="links" id="links">
          {site.links.filter((l) => l.visivel !== false).map((l, i) => {
            const url = rotaInterna(urlSegura(l.url) || "#");
            const externo = /^https?:/i.test(url);
            const miolo = (
              <>
                <span className="ico"><Icone id={l.icone} /></span>
                <span>
                  <span className="nome">{l.nome}</span>
                  <span className="desc">{l.desc}</span>
                </span>
                <span className="seta" aria-hidden="true">{externo ? "↗" : "→"}</span>
              </>
            );
            if (externo) return <a key={i} className="link surge" href={url} target="_blank" rel="noopener">{miolo}</a>;
            if (url.startsWith("/")) return <LinkSite key={i} className="link surge" href={url}>{miolo}</LinkSite>;
            return <a key={i} className="link surge" href={url}>{miolo}</a>;
          })}
        </div>
      </div>
    </section>
  );
}

/* ===== ficha da personagem (pôster) ===== */
/* espaço dos dois lados do separador: sem ele a linha inteira vira uma
   "palavra" só e não quebra no celular */
function Sep() {
  return <>{" "}<span className="sep" aria-hidden="true">&#10022;</span>{" "}</>;
}
function LinhaFicha({ itens }: { itens: ItemFicha[] }) {
  return (
    <>
      {itens.map((f, i) => {
        const valores = String(f.valor || "").split("·").map((v) => v.trim()).filter(Boolean);
        return (
          <Fragment key={i}>
            {i > 0 ? <Sep /> : null}
            <span className="r">{f.rotulo}</span>
            {valores.map((v, j) => (
              <Fragment key={j}><Sep />{v}</Fragment>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

export function Ficha() {
  const site = useSite();
  const montado = useMontado();
  const s = site.sobre;
  /* o lema do pôster: a última frase ganha a cor de destaque, como no Oásis */
  const frases = String(s.lema || "").replace(/([.!?])\s+/g, "$1\n").split("\n");
  const ultima = frases.length > 1 ? frases.pop() : "";
  const temExtra = !!(s.extra && s.extra.valor);
  return (
    <section className="ficha papel" id="ficha" aria-labelledby="ficha-nome">
      <div className="wrap ficha-in">
        <div className="ficha-topo surge">
          <img className="ficha-retrato" id="ficha-retrato" src={img(s.retrato) || img(site.perfil.avatar) || img("assets/avatar.webp")} width={150} height={150} alt="Autorretrato da Brunna em ilustração" />
          <div>
            <p className="rotulo ficha-cena">ficha da personagem</p>
            <h2 className="ficha-nome t-poster" id="ficha-nome">{site.perfil.nome}</h2>
            <p className="ficha-lista" id="ficha-lista"><LinhaFicha itens={s.ficha || []} /></p>
          </div>
        </div>
        <p className="ficha-extra surge" id="ficha-extra" hidden={!temExtra}>
          {temExtra ? <LinhaFicha itens={[s.extra]} /> : null}
        </p>

        <div className="ficha-palco">
          <p className="ficha-palavra t-poster" id="ficha-palavra" aria-hidden="true">{s.palavra || ""}</p>
          <img className="ficha-arte" id="ficha-arte" src={img(s.imagem) || img("assets/obras/hey.webp")} width={1080} height={1080} alt="Ilustração da Brunna: a tiefling de cabelo rosa acenando" loading="lazy" />
        </div>

        <div className="ficha-base">
          <p className="ficha-texto surge" id="ficha-texto">{s.texto}</p>
          <div className="ficha-lema surge">
            <p className="t-poster" id="ficha-lema">
              {frases.join(" ")}
              {ultima ? <><br /><em>{ultima}</em></> : null}
            </p>
            <p className="rotulo">copyright <span id="ano">{montado ? new Date().getFullYear() : ""}</span>&copy;</p>
            <div className="barcode" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== interlúdio: faixa em tela cheia com uma frase ===== */
export function Interludio({ id, cena }: { id: string; cena: Faixa }) {
  return (
    <section className="interludio" id={id} aria-label={cena.frase || "Interlúdio"}>
      <div className="interludio-img" style={estilo({ backgroundImage: "url('" + img(cena.img) + "')", "--foco": cena.foco || "50% 40%" })}></div>
      <div className="barra-cine topo" aria-hidden="true"></div>
      <div className="barra-cine base" aria-hidden="true"></div>
      <blockquote className="interludio-frase wrap surge">
        <p className="t-cinema">{cena.frase}</p>
        <cite className="rotulo">{cena.credito}</cite>
      </blockquote>
    </section>
  );
}

/* ===== cartões das outras páginas ===== */
function obrasVisiveis(site: Site) {
  return site.galeria.filter((o) => o.visivel !== false && img(o.img));
}
export function Chamadas() {
  const site = useSite();
  const montado = useMontado();
  const pg = site.cenas.paginas;
  const ag = montado ? estadoAgenda(site.agenda) : null;
  let txtAgenda = "";
  if (ag) {
    txtAgenda = ag.estado === "aberta" && ag.atual
      ? ag.atual.livres + (ag.atual.livres === 1 ? " vaga livre" : " vagas livres") + " · " + ag.atual.sessao.nome
      : ag.proxima ? "Próxima: " + ag.proxima.sessao.nome + " · abre " + dataExtenso(ag.proxima.abre) : TITULOS_ESTADO[ag.estado];
  }
  const minimo = Math.min(...site.precos.enquadramentos.map((e) => Number(e.preco) || 0).concat([Infinity]));
  const cartoes = [
    { href: "/portfolio", c: pg.portfolio, extra: obrasVisiveis(site).length + " artes", etiqueta: null },
    { href: "/agenda", c: pg.agenda, extra: txtAgenda, etiqueta: ag ? <Etiqueta site={site} estado={ag.estado} /> : null },
    { href: "/encomendas", c: pg.encomendas, extra: "a partir de " + brl(minimo), etiqueta: null },
  ];
  return (
    <section className="proximas" aria-labelledby="proximas-t">
      <div className="wrap">
        <h2 className="rotulo proximas-t surge" id="proximas-t">conheça mais</h2>
        <div className="chamadas" id="chamadas">
          {cartoes.map((k) => {
            const c = k.c || { img: "", foco: "", titulo: "", sub: "" };
            return (
              <LinkSite key={k.href} className="chamada surge" href={k.href}>
                <span className="chamada-img" style={estilo({ backgroundImage: "url('" + img(c.img) + "')", "--foco": c.foco || "50% 40%" })}></span>
                <span className="chamada-txt">
                  {k.etiqueta}
                  <span className="chamada-t t-cinema">{c.titulo}</span>
                  <span className="chamada-sub">{c.sub}</span>
                  <span className="chamada-extra">{k.extra} <b aria-hidden="true">&#8594;</b></span>
                </span>
              </LinkSite>
            );
          })}
        </div>
      </div>
    </section>
  );
}
