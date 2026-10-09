/*
 * Preparação da tela de carregamento (componente Cortina). Roda como script
 * logo depois da cortina no HTML, antes da página aparecer: escolhe a versão
 * (completa, rápida ou nenhuma) e escreve nome, título e avatar.
 * Escrita "sozinha" (sem usar nada de fora dela) porque vira texto de script.
 */
import { PADRAO } from "./conteudo/padrao";
import { LOJA_CHAVE, PREVIA_CHAVE } from "./loja";

export const INTRO_CHAVE = "brupater:intro";

export function prepararCortina(a: { lojaChave: string; previaChave: string; introChave: string; nome: string; titulo: string; avatar: string; base: string }): void {
  try {
    const c = document.getElementById("cortina");
    if (!c) return;
    const previa = /[?&]previa=1(&|$)/.test(location.search);
    let s: { perfil?: { nome?: string; titulo?: string; avatar?: string }; aparencia?: { carregamento?: boolean } } | null = null;
    try {
      s = JSON.parse((previa && localStorage.getItem(a.previaChave)) || localStorage.getItem(a.lojaChave) || "null");
    } catch {
      s = null;
    }
    const p = (s && s.perfil) || {};
    const ap = (s && s.aparencia) || {};
    if (ap.carregamento === false || previa) {
      c.className += " pular";
      return;
    }
    let jaViu = false;
    try { jaViu = sessionStorage.getItem(a.introChave) === "1"; } catch { jaViu = false; }
    if (jaViu) c.className += " rapida";
    document.documentElement.classList.add("esperando-cena");
    const nome = document.getElementById("cort-nome");
    const sub = document.getElementById("cort-sub");
    const av = document.getElementById("cort-avatar") as HTMLImageElement | null;
    const pct = document.getElementById("cort-pct");
    if (nome) nome.textContent = p.nome || a.nome;
    if (sub) sub.textContent = p.titulo || a.titulo;
    if (pct) pct.textContent = "0%";
    const avatar = String(p.avatar || "");
    if (av && avatar && (/^https?:\/\//.test(avatar) || /^data:image\//.test(avatar))) av.src = avatar;
    else if (av && avatar && /^[\w.\-/]+$/.test(avatar)) av.src = a.base + "/" + avatar.replace(/^\.?\/+/, "");
  } catch {
    /* sem a preparação, a cortina abre do jeito padrão */
  }
}

export const scriptCortina =
  "(" + prepararCortina.toString() + ")(" +
  JSON.stringify({
    lojaChave: LOJA_CHAVE,
    previaChave: PREVIA_CHAVE,
    introChave: INTRO_CHAVE,
    nome: PADRAO.perfil.nome,
    titulo: PADRAO.perfil.titulo,
    avatar: PADRAO.perfil.avatar,
    base: (process.env.NEXT_PUBLIC_IMAGENS_URL || "").replace(/\/+$/, ""),
  }) + ");";
