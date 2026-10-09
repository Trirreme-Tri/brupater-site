/*
 * Ganchos (hooks) que entregam o conteúdo do site aos componentes.
 *
 * No servidor (e na primeira montagem no navegador) o conteúdo é o PADRAO.
 * Logo depois, no navegador, passa a ser o que está salvo (lojaCarregar).
 * useSyncExternalStore faz essa troca sem erro de hidratação, e redesenha
 * sozinho quando o painel salva em outra aba (evento "storage").
 */
import { useSyncExternalStore } from "react";
import { PADRAO } from "./conteudo/padrao";
import type { Site } from "./conteudo/tipos";
import { LOJA_CHAVE, PREVIA_CHAVE, emPrevia, lojaCarregar } from "./loja";
import { TEMA_CHAVE, aplicarTema } from "./tema";

export const EVENTO_SITE = "brupater:site";

let cache: Site | null = null;
let ultimoBruto: string | null | undefined;

function bruto(): string | null {
  try {
    return (emPrevia() && localStorage.getItem(PREVIA_CHAVE)) || localStorage.getItem(LOJA_CHAVE);
  } catch {
    return null;
  }
}

function snapshot(): Site {
  const agora = bruto();
  if (cache && agora === ultimoBruto) return cache;
  cache = lojaCarregar();
  /* lojaCarregar pode gravar de volta (migrações): guarda o valor já gravado */
  ultimoBruto = bruto();
  return cache;
}

export function reaplicarTema(): void {
  aplicarTema({ padrao: PADRAO.aparencia, lojaChave: LOJA_CHAVE, previaChave: PREVIA_CHAVE, temaChave: TEMA_CHAVE });
}

const chaveDoSite = (e: StorageEvent) => e.key === LOJA_CHAVE || e.key === PREVIA_CHAVE || e.key === TEMA_CHAVE || e.key === null;

/* um único ouvinte reaplica as cores (não um por componente) */
let temaOuvindo = false;
function ouvirTema() {
  if (temaOuvindo || typeof window === "undefined") return;
  temaOuvindo = true;
  window.addEventListener("storage", (e) => { if (chaveDoSite(e)) reaplicarTema(); });
}

function assinar(avisar: () => void): () => void {
  ouvirTema();
  const aoArmazenar = (e: StorageEvent) => {
    if (chaveDoSite(e)) avisar();
  };
  window.addEventListener("storage", aoArmazenar);
  window.addEventListener(EVENTO_SITE, avisar);
  return () => {
    window.removeEventListener("storage", aoArmazenar);
    window.removeEventListener(EVENTO_SITE, avisar);
  };
}

/** o conteúdo atual do site */
export function useSite(): Site {
  return useSyncExternalStore(assinar, snapshot, () => PADRAO);
}

const nada = () => () => {};
/** false no servidor e na primeira montagem; true depois (pra partes que dependem da data de hoje ou do navegador) */
export function useMontado(): boolean {
  return useSyncExternalStore(nada, () => true, () => false);
}

/** true quando o site está aberto dentro da prévia do painel (?previa=1) */
export function usePrevia(): boolean {
  return useSyncExternalStore(nada, emPrevia, () => false);
}
