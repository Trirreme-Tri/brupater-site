/*
 * Ganchos (hooks) que entregam o conteúdo do site aos componentes.
 *
 * No servidor (e na primeira montagem no navegador) o conteúdo é o PADRAO.
 * Logo depois, no navegador, passa a ser a última cópia do Firestore (cache
 * local ou a que acabou de chegar). useSyncExternalStore faz essa troca sem
 * erro de hidratação e redesenha sozinho quando o Firestore avisa de uma
 * mudança (ex.: a Bru salvou no painel) ou quando a prévia do painel muda.
 */
import { useEffect, useSyncExternalStore } from "react";
import { PADRAO } from "./conteudo/padrao";
import type { Site } from "./conteudo/tipos";
import { CHAVE_CACHE } from "./firebase/constantes";
import { liberarConteudo } from "./firebase/antiPiscada";
import { PREVIA_CHAVE, emPrevia, lojaAssinar, lojaCarregar, lojaVersao } from "./loja";
import { TEMA_CHAVE, aplicarTema } from "./tema";

export const EVENTO_SITE = "brupater:site";

let cache: Site | null = null;
let ultimaVersao = -1;
let ultimoBruto: string | null | undefined;

/* rascunho da prévia (só vale com ?previa=1) */
function brutoPrevia(): string | null {
  if (!emPrevia()) return null;
  try {
    return localStorage.getItem(PREVIA_CHAVE);
  } catch {
    return null;
  }
}

/* devolve a MESMA referência enquanto nada mudou (senão o React entra em loop) */
function snapshot(): Site {
  const versao = lojaVersao();
  const agora = brutoPrevia();
  if (cache && versao === ultimaVersao && agora === ultimoBruto) return cache;
  cache = lojaCarregar();
  ultimaVersao = versao;
  ultimoBruto = agora;
  return cache;
}

export function reaplicarTema(): void {
  aplicarTema({ padrao: PADRAO.aparencia, lojaChave: CHAVE_CACHE, previaChave: PREVIA_CHAVE, temaChave: TEMA_CHAVE });
}

const chaveDoSite = (e: StorageEvent) => e.key === PREVIA_CHAVE || e.key === TEMA_CHAVE || e.key === null;

/* um único ouvinte reaplica as cores (não um por componente) */
let temaOuvindo = false;
function ouvirTema() {
  if (temaOuvindo || typeof window === "undefined") return;
  temaOuvindo = true;
  window.addEventListener("storage", (e) => { if (chaveDoSite(e)) reaplicarTema(); });
  /* o cache local já foi atualizado quando o Firestore avisa */
  lojaAssinar(reaplicarTema);
}

function assinar(avisar: () => void): () => void {
  ouvirTema();
  const aoArmazenar = (e: StorageEvent) => {
    if (chaveDoSite(e)) avisar();
  };
  window.addEventListener("storage", aoArmazenar);
  window.addEventListener(EVENTO_SITE, avisar);
  const soltarLoja = lojaAssinar(avisar);
  return () => {
    window.removeEventListener("storage", aoArmazenar);
    window.removeEventListener(EVENTO_SITE, avisar);
    soltarLoja();
  };
}

/** o conteúdo atual do site */
export function useSite(): Site {
  const site = useSyncExternalStore(assinar, snapshot, () => PADRAO);
  /* já renderizou com o conteúdo salvo (não mais o PADRAO do HTML estático): pode mostrar a página */
  useEffect(() => {
    if (site !== PADRAO) liberarConteudo();
  }, [site]);
  return site;
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
