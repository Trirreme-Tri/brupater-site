import type { CSSProperties } from "react";

/* Utilidades usadas pelo site, pelo painel e pela apresentação. */

/** escapa texto antes de ir para HTML montado em texto (só o painel usa isso) */
export function esc(txt: unknown): string {
  return String(txt == null ? "" : txt)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** só deixa passar links seguros: http(s), âncora, caminho relativo e imagem em data: */
export function urlSegura(url: unknown, permitirDataImg = false): string {
  const u = String(url || "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u) || u.charAt(0) === "#" || /^[\w.\-/]+(\.\w+)?([?#].*)?$/.test(u)) return u;
  if (permitirDataImg && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(u)) return u;
  return "";
}

/*
 * Endereço final de uma imagem. O conteúdo guarda caminhos como
 * "assets/obras/x.webp"; aqui eles ganham a base certa:
 *  - sem NEXT_PUBLIC_IMAGENS_URL: "/assets/obras/x.webp" (pasta public/ do site)
 *  - com NEXT_PUBLIC_IMAGENS_URL: "<base>/assets/obras/x.webp" (ex.: Firebase Storage)
 * URLs completas (https://...) e imagens enviadas (data:) passam sem mudança.
 * É o ÚNICO lugar que decide de onde vêm as imagens.
 */
const BASE_IMAGENS = (process.env.NEXT_PUBLIC_IMAGENS_URL || "").replace(/\/+$/, "");
export function img(url: unknown): string {
  const u = urlSegura(url, true);
  if (!u || /^(https?:|data:|#)/i.test(u)) return u;
  return BASE_IMAGENS + "/" + u.replace(/^\.?\/+/, "");
}

/*
 * Links internos salvos no formato do site antigo ("encomendas.html") viram
 * as rotas novas ("/encomendas"). Links externos passam sem mudança.
 */
const ROTAS_ANTIGAS: Record<string, string> = {
  "index.html": "/",
  "portfolio.html": "/portfolio",
  "agenda.html": "/agenda",
  "encomendas.html": "/encomendas",
  "projeto.html": "/projeto",
};
export function rotaInterna(url: string): string {
  const m = /^\.?\/?([\w-]+\.html)([?#].*)?$/.exec(url);
  if (m && ROTAS_ANTIGAS[m[1]]) return ROTAS_ANTIGAS[m[1]] + (m[2] || "");
  return url;
}

export function brl(n: unknown): string {
  return "R$ " + Number(n || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function copiaProfunda<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/** copia texto para a área de transferência (com plano B para navegadores antigos) */
export function copiarTexto(txt: string): Promise<void> {
  return new Promise((ok, falha) => {
    const tentar = () => {
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        ok();
      } catch (e) {
        falha(e);
      }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, tentar);
    else tentar();
  });
}

/** estilo com variáveis CSS (ex.: { "--foco": "50% 30%" }) */
export function estilo(o: Record<string, string | number | undefined>): CSSProperties {
  return o as CSSProperties;
}
