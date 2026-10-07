"use strict";

/* Ícones dos links ("créditos iniciais"). O painel mostra esta lista como
   opções na aba Links — pra adicionar um ícone novo, basta incluir aqui. */
var ICONES = {
  instagram: { nome: "Instagram", svg: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>' },
  threads: { nome: "Threads", svg: '<path d="M16.5 11.2c-.3-2.6-1.9-3.9-4.3-3.9-1.9 0-3.3.9-3.9 2.3"/><path d="M8.6 14.5c.2 1.6 1.6 2.5 3.4 2.4 2.4-.1 3.7-1.8 3.7-4.4 0-3.9-2.4-7.5-6.7-7.5C5.5 5 3.5 8 3.5 12s2.2 7.5 7.8 7.5c3.3 0 5.6-1.4 6.8-3.6"/><path d="M15.7 12.3c-1.4-.6-3.1-.8-4.4-.5-1.6.4-2.7 1.4-2.7 2.7"/>' },
  whatsapp: { nome: "WhatsApp", svg: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.2-1.2 1.8.8-.3 1.6c-3.6.4-7.3-3.3-6.9-6.9l1.6-.3.8 1.8z"/>' },
  email: { nome: "E-mail", svg: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6l8.5 7 8.5-7"/>' },
  dado: { nome: "Dado (encomendas)", svg: '<path d="M12 2.5l8.5 5v9L12 21.5l-8.5-5v-9z"/><path d="M12 2.5L7.5 15h9z"/><path d="M3.5 7.5l4 7.5M20.5 7.5l-4 7.5M7.5 15L12 21.5 16.5 15"/>' },
  agenda: { nome: "Agenda", svg: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none"/>' },
  estrela: { nome: "Estrela", svg: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>' },
  coracao: { nome: "Coração", svg: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>' },
  youtube: { nome: "YouTube", svg: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.3v5.4l4.6-2.7z" fill="currentColor"/>' },
  tiktok: { nome: "TikTok", svg: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2.2 4.4 5 4.6"/>' },
  artstation: { nome: "ArtStation", svg: '<path d="M3 16.5l2 3.5h11l-2-3.5z"/><path d="M9.5 4h4.5l7 12-2.2 3.8z"/><path d="M8.5 13.5L12 7.5l3.5 6z"/>' },
  loja: { nome: "Loja", svg: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9h16v11H4z"/><path d="M9.5 20v-6h5v6"/>' },
  musica: { nome: "Música", svg: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>' },
  link: { nome: "Link", svg: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>' }
};

function iconeSvg(id) {
  var ic = ICONES[id] || ICONES.link;
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ic.svg + "</svg>";
}
