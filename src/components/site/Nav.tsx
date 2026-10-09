"use client";

/* Barra do topo: marca, páginas, botão sol/lua, Encomendar e menu do celular. */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LinkSite } from "./LinkSite";
import { useMontado, useSite } from "@/lib/useSite";
import { img } from "@/lib/util";
import { TEMA_CHAVE } from "@/lib/tema";

const ITENS = [
  { href: "/", nome: "Início" },
  { href: "/portfolio", nome: "Portfólio" },
  { href: "/agenda", nome: "Agenda" },
];
const ENCOMENDAS = { href: "/encomendas", nome: "Encomendas" };

const SOL = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const LUA = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
  </svg>
);

function temaAtual(): "dark" | "light" {
  const t = document.documentElement.getAttribute("data-theme");
  if (t === "dark" || t === "light") return t;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function Nav() {
  const site = useSite();
  const montado = useMontado();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [solida, setSolida] = useState(false);
  const [escuro, setEscuro] = useState<boolean | null>(null);
  const [rotaMenu, setRotaMenu] = useState(pathname);

  /* trocou de página: o menu do celular fecha */
  if (rotaMenu !== pathname) {
    setRotaMenu(pathname);
    setMenu(false);
  }

  /* fica sólida depois do topo da página (ou sempre, se a página não tem topo) */
  useEffect(() => {
    let agendado = false;
    const medir = () => {
      agendado = false;
      const topo = document.querySelector<HTMLElement>("[data-topo]");
      setSolida(!topo || window.scrollY > topo.offsetHeight - 90);
    };
    const aoRolar = () => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(medir);
    };
    aoRolar();
    /* conteúdo que chega depois (ex.: página de projeto) também é medido */
    const t = window.setTimeout(aoRolar, 400);
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, [pathname]);

  const ehEscuro = montado ? (escuro ?? temaAtual() === "dark") : false;
  const trocarTema = () => {
    const novo = temaAtual() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", novo);
    try {
      localStorage.setItem(TEMA_CHAVE, novo);
    } catch {
      /* sem armazenamento: vale até recarregar */
    }
    setEscuro(novo === "dark");
  };

  const p = site.perfil;
  const nomeCurto = p.nome || String(p.handle || "").replace(/^[_.@]+/, "");
  const atual = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className={"nav" + (solida ? " solida" : "") + (menu ? " menu-aberto" : "")} id="nav">
      <div className="nav-in">
        <LinkSite className="marca" href="/" aria-label="Início">
          <img src={img(p.avatar) || "/assets/avatar.webp"} width={150} height={150} alt="" />
          <span className="t-cinema">{nomeCurto}</span>
        </LinkSite>
        <nav className="nav-links" aria-label="Páginas">
          {ITENS.map((i) => (
            <LinkSite key={i.href} href={i.href} aria-current={atual(i.href) ? "page" : undefined}>
              {i.nome}
            </LinkSite>
          ))}
        </nav>
        <div className="nav-acoes">
          <button
            className="tema-btn"
            type="button"
            id="tema-btn"
            hidden={site.aparencia.botaoTema === false}
            aria-label={ehEscuro ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
            aria-pressed={ehEscuro}
            onClick={trocarTema}
          >
            {montado ? (ehEscuro ? SOL : LUA) : null}
          </button>
          <LinkSite className="btn cheio nav-cta" href={ENCOMENDAS.href} aria-current={atual(ENCOMENDAS.href) ? "page" : undefined}>
            Encomendar
          </LinkSite>
          <button
            className="menu-btn"
            type="button"
            id="menu-btn"
            aria-expanded={menu}
            aria-controls="menu-movel"
            aria-label="Abrir menu"
            onClick={() => setMenu((m) => !m)}
          >
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
      <nav className="menu-movel" id="menu-movel" aria-label="Páginas" hidden={!menu}>
        {ITENS.concat([ENCOMENDAS]).map((i) => (
          <LinkSite key={i.href} href={i.href} aria-current={atual(i.href) ? "page" : undefined}>
            {i.nome}
          </LinkSite>
        ))}
      </nav>
    </header>
  );
}
