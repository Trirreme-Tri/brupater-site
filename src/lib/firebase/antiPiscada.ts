/**
 * Evita que o visitante veja o conteúdo PADRAO por um instante antes do
 * conteúdo salvo pela Bru (o HTML estático é gerado com o PADRAO).
 *
 * Como funciona:
 * 1. SCRIPT_ANTI_PISCADA roda no <head>, antes da primeira pintura. Se existe
 *    cópia salva (visita repetida), marca <html data-conteudo="aguardando">.
 * 2. CSS_ANTI_PISCADA esconde a página enquanto a marca existe.
 * 3. Depois que o React monta com a cópia, liberarConteudo() tira a marca.
 * 4. Segurança: o próprio script tira a marca em 1,5 s, aconteça o que acontecer.
 *
 * Primeira visita (sem cópia): nada é escondido; a tela de carregamento já cobre.
 */
// Importa só a constante (não o Firestore), para não pesar no layout.
import { CHAVE_CACHE } from "./constantes";

const LIMITE_MS = 1500;

export const SCRIPT_ANTI_PISCADA = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  CHAVE_CACHE,
)})){var h=document.documentElement;h.setAttribute("data-conteudo","aguardando");setTimeout(function(){h.removeAttribute("data-conteudo")},${LIMITE_MS})}}catch(e){}})();`;

export const CSS_ANTI_PISCADA = `html[data-conteudo="aguardando"] body{visibility:hidden}`;

export function liberarConteudo(): void {
  if (typeof document !== "undefined") document.documentElement.removeAttribute("data-conteudo");
}
