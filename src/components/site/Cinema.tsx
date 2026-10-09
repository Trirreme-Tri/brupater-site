"use client";

/*
 * Efeitos de cinema comuns às páginas públicas:
 *  - lightbox (arte em tela cheia), com teclado (Esc, setas)
 *  - aviso flutuante ("Mensagem copiada!")
 *  - entrada dos elementos ao rolar (.surge ganha data-visto)
 *  - barras de cinema do topo que recolhem ao rolar (--barra)
 * Tudo respeita "movimento" do painel e o "reduzir movimento" do aparelho.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export interface ItemLightbox {
  src: string;
  titulo?: string;
}
interface CinemaApi {
  lbAbrir: (lista: ItemLightbox[], i?: number, origem?: HTMLElement | null) => void;
  aviso: (txt: string) => void;
}

const Ctx = createContext<CinemaApi>({ lbAbrir: () => {}, aviso: () => {} });
export const useCinema = () => useContext(Ctx);

export function semMovimento(): boolean {
  const reduzido = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduzido || document.documentElement.dataset.movimento === "desligado";
}

/* ===== entrada ao rolar ===== */
function useSurge() {
  const pathname = usePathname();
  useEffect(() => {
    let observador: IntersectionObserver | null = null;
    const marcar = (el: Element) => (el as HTMLElement).setAttribute("data-visto", "");
    function observar() {
      const alvos = document.querySelectorAll(".surge:not([data-visto]):not([data-obs]), .interludio:not([data-visto]):not([data-obs])");
      if (!("IntersectionObserver" in window) || semMovimento()) {
        alvos.forEach(marcar);
        return;
      }
      if (!observador) {
        observador = new IntersectionObserver(
          (entradas) => {
            entradas.forEach((e) => {
              if (e.isIntersecting) {
                marcar(e.target);
                observador?.unobserve(e.target);
              }
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
        );
      }
      alvos.forEach((el, i) => {
        /* pequenos atrasos em cascata pra elementos que entram juntos */
        if (el.classList.contains("surge")) (el as HTMLElement).style.transitionDelay = Math.min(i % 6, 5) * 70 + "ms";
        el.setAttribute("data-obs", "");
        observador!.observe(el);
      });
    }
    observar();
    /* elementos novos (troca de filtro, conteúdo que chegou do painel) também entram */
    let pedido = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(pedido);
      pedido = requestAnimationFrame(observar);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      observador?.disconnect();
      cancelAnimationFrame(pedido);
      document.querySelectorAll("[data-obs]:not([data-visto])").forEach((el) => el.removeAttribute("data-obs"));
    };
  }, [pathname]);
}

/* ===== barras de cinema do topo: recolhem ao rolar ===== */
function useBarras() {
  const pathname = usePathname();
  useEffect(() => {
    let agendado = false;
    const aoRolar = () => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(() => {
        agendado = false;
        const topo = document.querySelector<HTMLElement>("[data-topo]");
        if (!topo) return;
        const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.45)));
        topo.style.setProperty("--barra", String(1 - p));
      });
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
}

export function CinemaProvider({ children }: { children: ReactNode }) {
  const [lb, setLb] = useState<{ lista: ItemLightbox[]; i: number } | null>(null);
  const origem = useRef<HTMLElement | null>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const [avisoTxt, setAvisoTxt] = useState("");
  const [avisoVisivel, setAvisoVisivel] = useState(false);
  const timerAviso = useRef<number | undefined>(undefined);

  useSurge();
  useBarras();

  const lbAbrir = useCallback((lista: ItemLightbox[], i = 0, el?: HTMLElement | null) => {
    if (!lista.length) return;
    origem.current = el || null;
    setLb({ lista, i: Math.max(0, i) });
  }, []);
  const lbFechar = useCallback(() => {
    setLb(null);
    origem.current?.focus();
  }, []);
  const lbPasso = useCallback((d: number) => {
    setLb((x) => (x ? { ...x, i: (x.i + d + x.lista.length) % x.lista.length } : x));
  }, []);

  /* trocou de página (ex.: botão Voltar do celular): o lightbox fecha */
  const pathname = usePathname();
  const [rotaLb, setRotaLb] = useState(pathname);
  if (rotaLb !== pathname) {
    setRotaLb(pathname);
    setLb(null);
  }

  /* o foco vai pro "Fechar" só quando abre (não a cada arte) */
  const aberto = !!lb;
  useEffect(() => {
    if (aberto) fecharRef.current?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!lb) return;
    document.body.style.overflow = "hidden";
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") lbFechar();
      if (e.key === "ArrowLeft") lbPasso(-1);
      if (e.key === "ArrowRight") lbPasso(1);
    };
    document.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", tecla);
    };
  }, [lb, lbFechar, lbPasso]);

  const aviso = useCallback((txt: string) => {
    setAvisoTxt(txt);
    setAvisoVisivel(true);
    window.clearTimeout(timerAviso.current);
    timerAviso.current = window.setTimeout(() => setAvisoVisivel(false), 5000);
  }, []);

  const api = useMemo(() => ({ lbAbrir, aviso }), [lbAbrir, aviso]);
  const item = lb ? lb.lista[lb.i] : null;
  const varios = !!lb && lb.lista.length > 1;

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        className={"lb" + (lb ? " aberto" : "")}
        id="lb"
        role="dialog"
        aria-modal="true"
        aria-label="Arte em tela cheia"
        onClick={(e) => { if (e.target === e.currentTarget) lbFechar(); }}
      >
        <button ref={fecharRef} className="fechar" type="button" aria-label="Fechar" onClick={lbFechar}>&times;</button>
        <button className="ant" type="button" aria-label="Arte anterior" hidden={!varios} onClick={() => lbPasso(-1)}>&#8592;</button>
        <figure>
          {item ? <img id="lb-img" src={item.src} alt={item.titulo || ""} /> : null}
          <figcaption id="lb-cap">{item?.titulo || ""}</figcaption>
        </figure>
        <button className="prox" type="button" aria-label="Próxima arte" hidden={!varios} onClick={() => lbPasso(1)}>&#8594;</button>
      </div>
      <div className={"aviso-site" + (avisoVisivel ? " visivel" : "")} id="aviso-site" role="status" aria-live="polite">
        {avisoTxt}
      </div>
    </Ctx.Provider>
  );
}
