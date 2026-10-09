/* Contato: WhatsApp se tiver número no painel, senão a DM do Instagram. */
import type { Site } from "./conteudo/tipos";

export function contatoTemWhats(site: Site): boolean {
  return !!String(site.perfil.whatsapp || "").replace(/\D/g, "");
}
export function contatoLink(site: Site, texto: string): string {
  const num = String(site.perfil.whatsapp || "").replace(/\D/g, "");
  if (num) return "https://wa.me/" + num + (texto ? "?text=" + encodeURIComponent(texto) : "");
  return "https://ig.me/m/" + encodeURIComponent(site.perfil.instagram || "");
}
export function instagramUrl(site: Site): string {
  return "https://www.instagram.com/" + encodeURIComponent(site.perfil.instagram || "") + "/";
}
export const MSG_AVISAR = "Oi, Bru! Quero ser avisada(o) quando a próxima agenda de encomendas abrir ✨";
