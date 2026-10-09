"use client";

/*
 * Tela de carregamento + abertura de cinema.
 * Progresso de verdade (imagens da tela + fontes). Quando termina (ou passa
 * do tempo máximo), as faixas se abrem. Primeira visita: versão completa,
 * com tempo mínimo pra dar pra ver; depois, só a abertura rápida.
 * Aparece só ao abrir o site (trocar de página não recarrega).
 *
 * A preparação antes da página aparecer fica em src/lib/cortina.ts.
 */
import { useEffect, useRef, useState } from "react";
import { INTRO_CHAVE } from "@/lib/cortina";
import { img } from "@/lib/util";
import { PADRAO } from "@/lib/conteudo/padrao";
import { semMovimento } from "./Cinema";

/* avisa o CSS que a cena começou (letreiro do topo, arte assentando) */
function cenaAberta() {
  document.documentElement.classList.remove("esperando-cena");
  document.documentElement.classList.add("cena-aberta");
}

export function Cortina() {
  const ref = useRef<HTMLDivElement>(null);
  const barra = useRef<HTMLElement>(null);
  const pct = useRef<HTMLParagraphElement>(null);
  const [fim, setFim] = useState(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (c.classList.contains("pular")) {
      cenaAberta();
      setFim(true);
      return;
    }
    const rapida = c.classList.contains("rapida");
    if (semMovimento()) c.classList.add("simples");
    const t0 = performance.now();
    const MIN = rapida ? 0 : 1300;
    const MAX = rapida ? 2500 : 6000;
    let total = 1, prontos = 0, mostrado = 0, alvo = 0, terminou = false, quadro = 0;
    const timers: number[] = [];

    const pintar = () => {
      mostrado += (alvo - mostrado) * 0.12;
      if (alvo - mostrado < 0.004) mostrado = alvo;
      if (barra.current) barra.current.style.transform = "scaleX(" + mostrado.toFixed(3) + ")";
      if (pct.current) pct.current.textContent = Math.round(mostrado * 100) + "%";
      if (!terminou || mostrado < 1) quadro = requestAnimationFrame(pintar);
    };
    const abrir = () => {
      try { sessionStorage.setItem(INTRO_CHAVE, "1"); } catch { /* sem armazenamento */ }
      document.body.classList.add(c.classList.contains("simples") ? "simples-revelando" : "revelando");
      c.classList.add("abrindo");
      cenaAberta();
      timers.push(window.setTimeout(() => {
        document.body.classList.remove("revelando", "simples-revelando");
        setFim(true);
      }, rapida ? 1000 : 1700));
    };
    const terminar = () => {
      if (terminou) return;
      terminou = true;
      alvo = 1;
      const espera = Math.max(0, MIN - (performance.now() - t0)) + (rapida ? 0 : 350);
      timers.push(window.setTimeout(abrir, espera));
    };
    const um = () => {
      prontos++;
      alvo = Math.min(1, prontos / total);
      if (prontos >= total) terminar();
    };

    quadro = requestAnimationFrame(pintar);
    timers.push(window.setTimeout(terminar, MAX));
    /* imagens que já estão na tela (as "lazy" ficam pra depois) + fontes.
       Conta um instante depois, quando o carrossel já desenhou a primeira arte. */
    const contar = () => {
      const imgs = Array.from(document.images).filter((i) => i.getAttribute("src") && i.loading !== "lazy" && !c.contains(i));
      total = imgs.length + 1;
      imgs.forEach((i) => {
        if (i.complete) um();
        else {
          i.addEventListener("load", um, { once: true });
          i.addEventListener("error", um, { once: true });
        }
      });
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(um, um);
    };
    timers.push(window.setTimeout(contar, 60));

    return () => {
      cancelAnimationFrame(quadro);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  if (fim) return null;
  return (
    <div className="cortina" id="cortina" aria-hidden="true" ref={ref} suppressHydrationWarning>
      <div className="cort-barra cort-topo"></div>
      <div className="cort-barra cort-base"></div>
      <div className="cort-centro">
        <img className="cort-avatar" id="cort-avatar" src={img(PADRAO.perfil.avatar)} width={88} height={88} alt="" suppressHydrationWarning />
        <p className="cort-nome" id="cort-nome" suppressHydrationWarning>{PADRAO.perfil.nome}</p>
        <p className="cort-sub" id="cort-sub" suppressHydrationWarning>{PADRAO.perfil.titulo}</p>
        <div className="cort-trilho"><i id="cort-prog" ref={barra}></i></div>
        <p className="cort-pct" id="cort-pct" ref={pct} suppressHydrationWarning>0%</p>
      </div>
    </div>
  );
}
