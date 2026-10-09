"use client";

import { LinkSite } from "./LinkSite";
import { useSite } from "@/lib/useSite";
import { instagramUrl } from "@/lib/contato";

const ITENS = [
  { href: "/", nome: "Início" },
  { href: "/portfolio", nome: "Portfólio" },
  { href: "/agenda", nome: "Agenda" },
  { href: "/encomendas", nome: "Encomendas" },
];

export function Rodape() {
  const site = useSite();
  const p = site.perfil;
  return (
    <footer className="rodape">
      <div className="wrap">
        <p className="fim">Fim</p>
        <p className="fim-sub" id="rod-assinatura">{p.assinatura ? p.assinatura + " ✦" : ""}</p>
        <nav className="rodape-nav" aria-label="Páginas">
          {ITENS.map((i) => (
            <LinkSite key={i.href} href={i.href}>{i.nome}</LinkSite>
          ))}
        </nav>
        <div className="creditos">
          <span>arte e personagens <b id="rod-nome">{p.nome}</b></span>
          <span>
            <a href={instagramUrl(site)} id="rod-ig" target="_blank" rel="noopener">@{p.instagram}</a>
          </span>
        </div>
        <p className="trirreme">
          Site desenvolvido pela <a href="https://trirreme.com" target="_blank" rel="noopener">TRIRREME</a>
        </p>
      </div>
    </footer>
  );
}
