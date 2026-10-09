"use client";

/*
 * Páginas de aviso: 404 (página não existe), erro (algo deu errado) e
 * manutenção (site fora do ar). Textos e imagem vêm do painel
 * (Textos e imagens → Páginas de aviso).
 */
import type { TipoAviso } from "@/lib/conteudo/tipos";
import { useSite } from "@/lib/useSite";
import { img, rota } from "@/lib/util";
import { contatoTemWhats, instagramUrl } from "@/lib/contato";
import { Icone } from "@/components/site/Icone";

export function AvisoPagina({ tipo, tentarDeNovo }: { tipo: TipoAviso; tentarDeNovo?: () => void }) {
  const site = useSite();
  const a = (site.paginasAviso || ({} as typeof site.paginasAviso))[tipo] || { rotulo: "", titulo: "", texto: "", botao: "", img: "" };
  const p = site.perfil;
  const foto = img(a.img);
  const num = String(p.whatsapp || "").replace(/\D/g, "");
  const whats = contatoTemWhats(site) ? "https://wa.me/" + num + "?text=" + encodeURIComponent(p.whatsappMensagem || "") : "";
  const insta = p.instagram ? instagramUrl(site) : "";

  /* botão principal: no erro, tenta de novo; na manutenção, Instagram; no 404, início */
  let principal;
  if (tipo === "erro") {
    principal = (
      <a className="btn cheio" href="#" onClick={(e) => { e.preventDefault(); if (tentarDeNovo) tentarDeNovo(); else window.location.reload(); }}>
        {a.botao || "Tentar de novo"}
      </a>
    );
  } else if (tipo === "manutencao") {
    principal = <a className="btn cheio" href={insta || whats || "#"} target="_blank" rel="noopener">{a.botao || "Ir pro Instagram"}</a>;
  } else {
    /* link comum (recarrega): a página de aviso fica fora do layout do site,
       e assim a tela de carregamento e o player voltam do jeito certo */
    principal = <a className="btn cheio" href={rota("/")}>{a.botao || "Voltar ao início"}</a>;
  }

  return (
    <main className="aviso-pg" id="aviso" data-pagina="aviso">
      {foto ? (
        <>
          <div className="aviso-fundo" style={{ backgroundImage: "url('" + foto + "')" }}></div>
          <img className="aviso-arte" src={foto} alt="" />
        </>
      ) : null}
      <div className="aviso-veu"></div>
      <div className="wrap aviso-txt">
        <p className="rotulo aviso-rotulo">{a.rotulo || ""}</p>
        <h1 className="t-cinema aviso-titulo">{a.titulo || ""}</h1>
        <p className="aviso-texto">{a.texto || ""}</p>
        <div className="aviso-ctas">
          {principal}
          {whats ? <a className="btn" href={whats} target="_blank" rel="noopener"><Icone id="whatsapp" /> WhatsApp</a> : null}
          {insta && tipo !== "manutencao" ? <a className="btn" href={insta} target="_blank" rel="noopener"><Icone id="instagram" /> Instagram</a> : null}
        </div>
        <p className="aviso-assina">
          <img src={img(p.avatar) || img("assets/avatar.webp")} alt="" width={34} height={34} /> {p.nome || ""}
        </p>
        <p className="aviso-trirreme">Site desenvolvido pela <a href="https://trirreme.com" target="_blank" rel="noopener">TRIRREME</a></p>
      </div>
    </main>
  );
}
