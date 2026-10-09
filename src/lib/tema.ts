/*
 * Aparência escolhida no painel: cores, fontes, grão de filme, barras de
 * cinema, movimento e tema claro/escuro.
 *
 * aplicarTema() é escrita "sozinha" (sem usar nada de fora dela) de propósito:
 * o layout a coloca como script no <head>, para rodar ANTES da página aparecer
 * (sem piscar a cor padrão antes da escolhida). Depois, o próprio site chama a
 * mesma função quando o painel salva algo.
 */
import type { Aparencia } from "./conteudo/tipos";

export const TEMA_CHAVE = "brupater:modo";

export interface ArgsTema {
  /** aparência padrão (PADRAO.aparencia) */
  padrao: Aparencia;
  lojaChave: string;
  previaChave: string;
  temaChave: string;
  /** aparência já pronta (o painel passa o rascunho); sem ela, lê do navegador */
  ap?: Aparencia;
  /** o painel aplica só cores da marca e fontes em si mesmo, nunca as cores por modo */
  semModos?: boolean;
}

export function aplicarTema(a: ArgsTema): void {
  try {
    const doc = document;
    const raiz = doc.documentElement;
    const previa = /[?&]previa=1(&|$)/.test(location.search);
    let ap = a.ap;
    if (!ap) {
      let salvo: { aparencia?: Partial<Aparencia> } | null = null;
      try {
        salvo = JSON.parse((previa && localStorage.getItem(a.previaChave)) || localStorage.getItem(a.lojaChave) || "null");
      } catch {
        salvo = null;
      }
      const s = (salvo && salvo.aparencia) || {};
      const p = a.padrao;
      const sm = (s.modos || {}) as Partial<Aparencia["modos"]>;
      ap = {
        ...p,
        ...s,
        cores: { ...p.cores, ...(s.cores || {}) },
        fontes: { ...p.fontes, ...(s.fontes || {}) },
        modos: { claro: { ...p.modos.claro, ...(sm.claro || {}) }, escuro: { ...p.modos.escuro, ...(sm.escuro || {}) } },
      };
    }
    const c = ap.cores;
    const mapa: Record<string, string> = {
      "--rosa": c.rosa, "--poster": c.poster, "--vinho": c.vinho,
      "--violeta": c.violeta, "--teal": c.teal, "--papel": c.papel, "--noite": c.noite,
    };
    Object.keys(mapa).forEach((k) => { if (mapa[k]) raiz.style.setProperty(k, mapa[k]); });
    raiz.style.setProperty("--f-cinema", '"' + ap.fontes.cinema + '", "Playfair Display", Georgia, serif');
    raiz.style.setProperty("--f-poster", '"' + ap.fontes.poster + '", "Montserrat", system-ui, sans-serif');
    raiz.style.setProperty("--f-mao", '"' + ap.fontes.mao + '", "Comic Sans MS", cursive');
    raiz.dataset.grao = ap.grao ? "on" : "off";
    raiz.dataset.barras = ap.barras ? "on" : "off";
    raiz.dataset.movimento = ap.movimento;

    /* Tema inicial vem do painel ("claro", "escuro" ou "auto" = segue o
       aparelho). Quem visita pode trocar no botão sol/lua; essa escolha vale
       só pra ela. Sem o botão, vale sempre o do painel. Na prévia do painel,
       o modo vem do endereço (?tema=dark|light). */
    let escolha: string | null = null;
    if (ap.botaoTema !== false) {
      try { escolha = localStorage.getItem(a.temaChave); } catch { escolha = null; }
    }
    const naPrevia = previa && /[?&]tema=(dark|light)/.exec(location.search);
    if (naPrevia) escolha = naPrevia[1];
    const tema = escolha === "light" || escolha === "dark" ? escolha : ap.tema === "auto" ? "" : ap.tema === "escuro" ? "dark" : "light";
    if (tema) raiz.setAttribute("data-theme", tema);
    else raiz.removeAttribute("data-theme");

    /* cores separadas por modo: uma folha de estilo com as variáveis de cada modo (só #RRGGBB) */
    const hex = (v: string) => (/^#[0-9a-f]{6}$/i.test(String(v || "")) ? v : null);
    const vars = (m: Aparencia["modos"]["claro"]) => {
      const mp: Record<string, string> = {
        "--casa-bg": m.fundo, "--bg": m.fundo, "--casa-bg2": m.secao, "--bg-2": m.secao,
        "--casa-ink": m.texto, "--ink": m.texto, "--casa-soft": m.textoSuave, "--ink-soft": m.textoSuave,
        "--nav-bg": m.barra, "--nav-ink": m.barraTexto, "--rodape-bg": m.rodape, "--rodape-ink": m.rodapeTexto,
      };
      let css = Object.keys(mp).filter((k) => hex(mp[k])).map((k) => k + ":" + mp[k]).join(";");
      if (hex(m.texto)) css += ";--casa-line:color-mix(in srgb," + m.texto + " 18%,transparent);--line:color-mix(in srgb," + m.texto + " 18%,transparent)";
      return css;
    };
    let css = "";
    if (!a.semModos && ap.modos) {
      const claro = vars(ap.modos.claro), escuro = vars(ap.modos.escuro);
      css = ":root{" + claro + "}:root[data-theme=\"light\"]{" + claro + "}:root[data-theme=\"dark\"]{" + escuro + "}" +
        "@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){" + escuro + "}}";
    }
    let st = doc.getElementById("tema-modos");
    if (!st) { st = doc.createElement("style"); st.id = "tema-modos"; doc.head.appendChild(st); }
    st.textContent = css;

    /* fontes do Google Fonts escolhidas no painel (Montserrat sempre, é a do texto) */
    const familias = [ap.fontes.cinema, ap.fontes.poster, ap.fontes.mao];
    const partes = familias
      .filter((f, i) => familias.indexOf(f) === i && f !== "Montserrat")
      .map((f) => "family=" + encodeURIComponent(f).replace(/%20/g, "+"));
    partes.push("family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500");
    const href = "https://fonts.googleapis.com/css2?" + partes.join("&") + "&display=swap";
    let link = doc.getElementById("fontes-tema");
    if (!link) {
      link = doc.createElement("link");
      link.id = "fontes-tema";
      (link as HTMLLinkElement).rel = "stylesheet";
      doc.head.appendChild(link);
    }
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
  } catch {
    /* se der qualquer erro, o site abre com as cores padrão do CSS */
  }
}
