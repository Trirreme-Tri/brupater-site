"use client";

/* Botão flutuante do WhatsApp no cantinho (pedido da Bru). Só aparece com número
   no painel. No topo da página mostra o texto; ao rolar, fica só o ícone. */
import { useEffect, useState } from "react";
import { useSite } from "@/lib/useSite";
import { contatoLink, contatoTemWhats } from "@/lib/contato";
import { Icone } from "./Icone";

export function WhatsFlutuante() {
  const site = useSite();
  const [compacto, setCompacto] = useState(false);
  useEffect(() => {
    let pedindo = false;
    const aoRolar = () => {
      if (pedindo) return;
      pedindo = true;
      requestAnimationFrame(() => {
        setCompacto(window.scrollY > 240);
        pedindo = false;
      });
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);
  const p = site.perfil;
  const txt = p.whatsappBotao || "Fale comigo no WhatsApp";
  return (
    <a
      className={"whats-flut" + (compacto ? " compacto" : "")}
      id="whats-flut"
      target="_blank"
      rel="noopener"
      hidden={!contatoTemWhats(site) || p.whatsappFlutuante === false}
      href={contatoLink(site, p.whatsappMensagem || "")}
      aria-label={txt}
    >
      <span className="wf-txt">{txt}</span>
      <span className="wf-ico"><Icone id="whatsapp" /></span>
    </a>
  );
}
