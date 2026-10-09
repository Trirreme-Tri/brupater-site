/*
 * Camada de dados: onde o conteúdo do site fica guardado.
 *
 * HOJE: o padrão vem de src/lib/conteudo/padrao.ts (PADRAO) e o que a Bru
 * edita no painel fica salvo no navegador dela (localStorage). Por isso o que
 * ela salva ainda não aparece para os visitantes.
 *
 * PRÓXIMA ETAPA (banco de dados): este é o ÚNICO arquivo que precisa mudar.
 * carregar/salvar passam a ler e gravar no Firestore, no mesmo formato
 * (tipo Site). O resto do site não muda. Ver o guia do banco de dados.
 *
 * Só roda no navegador (usa localStorage). No servidor, o site usa o PADRAO.
 */
import { PADRAO } from "./conteudo/padrao";
import type { Site } from "./conteudo/tipos";
import { copiaProfunda, rotaInterna } from "./util";

/* v2: as imagens do portfólio foram trocadas (out/2026). Mudar a chave
   descarta edições antigas que apontavam para imagens que não existem mais. */
export const LOJA_CHAVE = "brupater:site:v2";

/* Prévia ao vivo do painel: o painel grava o rascunho (ainda não salvo) em
   PREVIA_CHAVE e mostra o site num quadro com ?previa=1. Nesse modo o site lê
   o rascunho em vez do conteúdo salvo e redesenha a cada mudança. */
export const PREVIA_CHAVE = "brupater:previa";

export function emPrevia(): boolean {
  return typeof window !== "undefined" && /[?&]previa=1(&|$)/.test(window.location.search);
}
export function lojaChaveAtual(): string {
  return emPrevia() ? PREVIA_CHAVE : LOJA_CHAVE;
}

/* junta o que foi salvo por cima do padrão. Objetos são mesclados campo a
   campo (um campo novo no PADRAO aparece mesmo pra quem já salvou antes);
   listas e valores simples salvos substituem os do padrão. */
export function mesclar<T>(base: T, salvo: unknown): T {
  if (Array.isArray(base) || Array.isArray(salvo)) return (salvo !== undefined ? salvo : base) as T;
  if (base && typeof base === "object" && salvo && typeof salvo === "object") {
    const b = base as Record<string, unknown>;
    const s = salvo as Record<string, unknown>;
    const saida: Record<string, unknown> = {};
    Object.keys(b).forEach((k) => {
      saida[k] = mesclar(b[k], s[k]);
    });
    Object.keys(s).forEach((k) => {
      if (!(k in saida)) saida[k] = s[k];
    });
    return saida as T;
  }
  return (salvo !== undefined ? salvo : base) as T;
}

/* Ajustes que rodam UMA vez em dados já salvos. Sem isso, um campo que já
   tinha sido salvo não recebe o valor novo do PADRAO. Cada ajuste fica
   anotado em site.migracoes. Nunca apagar uma migração antiga. */
interface Migracao {
  id: string;
  rodar: (s: Site) => void;
}
const MIGRACOES: Migracao[] = [
  {
    id: "2026-10-pdf-bru",
    rodar: (s) => {
      if (!String(s.perfil.whatsapp || "").replace(/\D/g, "")) s.perfil.whatsapp = PADRAO.perfil.whatsapp;
      if (s.perfil.titulo === "RPG Character Creation") s.perfil.titulo = PADRAO.perfil.titulo;
      if (s.cenas.abertura.kicker === "RPG Character Creation") s.cenas.abertura.kicker = PADRAO.cenas.abertura.kicker;
    },
  },
  /* out/2026: o topo passou a mostrar a arte inteira por padrão (estava cortando) */
  { id: "2026-10-topo-inteira", rodar: (s) => { s.cenas.abertura.modo = "inteira"; } },
  /* ...e voltou a cobrir a tela toda, como o Wellington aprovou (out/2026) */
  { id: "2026-10-topo-fundo", rodar: (s) => { s.cenas.abertura.modo = "fundo"; } },
  /* out/2026: o site deixou de falar em "cenas" */
  {
    id: "2026-10-sem-cenas",
    rodar: (s) => {
      const troca: Record<string, string> = {
        "Personagens de RPG, OCs e heróis da sua mesa ganhando cor, traço e história.": "Personagens, ilustrações e identidades visuais ganhando cor, traço e história.",
        "Personagens, cenas e identidades visuais ganhando cor, traço e história.": "Personagens, ilustrações e identidades visuais ganhando cor, traço e história.",
        "Personagens, pôsteres, cenas e estudos.": "Personagens, pôsteres, ilustrações e estudos.",
        "Personagens, pôsteres, cenas e estudos": "Personagens, pôsteres, ilustrações e estudos",
        "Ambiente desenhado, como uma cena de filme.": "Ambiente desenhado por trás do personagem.",
        "interlúdio · estudo de cor": "estudo de cor",
        "interlúdio · caderno de campanha": "caderno de campanha",
        "Erro 404 · cena perdida": "Erro 404",
        "Ops, essa cena não existe": "Ops, essa página não existe",
      };
      const t = (o: Record<string, unknown> | undefined, k: string) => {
        if (o && typeof o[k] === "string" && troca[o[k] as string]) o[k] = troca[o[k] as string];
      };
      const r = (o: unknown) => o as Record<string, unknown>;
      t(r(s.cenas.abertura), "legenda");
      t(r((s.cenas.paginas || {}).portfolio), "sub");
      t(r(s.cenas.interludio1), "credito");
      t(r(s.cenas.interludio2), "credito");
      (s.links || []).forEach((l) => t(r(l), "desc"));
      (s.precos.fundos || []).forEach((f) => t(r(f), "desc"));
      const av = (s.paginasAviso || {}).naoEncontrada;
      t(r(av), "rotulo");
      t(r(av), "titulo");
      (s.galeria || []).forEach((o) => { if (o.tag === "Cenas") o.tag = "Ilustrações"; });
      (s.projetos || []).forEach((p) => {
        if (p.id === "cenas") {
          p.id = "ilustracoes";
          if (p.titulo === "Cenas") p.titulo = "Ilustrações";
          if (p.resumo === "Cenas de aventura com luz e clima.") p.resumo = "Aventura com luz, clima e movimento.";
        }
      });
    },
  },
  /* out/2026: migração para Next.js. Links internos "encomendas.html" viram "/encomendas" */
  {
    id: "2026-10-next-rotas",
    rodar: (s) => {
      (s.links || []).forEach((l) => { l.url = rotaInterna(String(l.url || "")); });
    },
  },
];

function lerSalvo(): unknown {
  try {
    const previa = emPrevia() ? localStorage.getItem(PREVIA_CHAVE) : null;
    return JSON.parse(previa || localStorage.getItem(LOJA_CHAVE) || "null");
  } catch {
    return null;
  }
}

/** conteúdo atual: o salvo (ou o rascunho da prévia) por cima do padrão */
export function lojaCarregar(): Site {
  const salvo = typeof window === "undefined" ? null : lerSalvo();
  const site = mesclar(copiaProfunda(PADRAO), salvo || {});
  const feitas: string[] = ((salvo as Site | null)?.migracoes || []).slice();
  let rodou = false;
  MIGRACOES.forEach((m) => {
    if (feitas.indexOf(m.id) >= 0) return;
    if (salvo) {
      try {
        m.rodar(site);
        rodou = true;
      } catch {
        /* dado estranho: deixa como está */
      }
    }
    feitas.push(m.id);
  });
  site.migracoes = feitas;
  if (rodou && !emPrevia()) {
    try {
      localStorage.setItem(LOJA_CHAVE, JSON.stringify(site));
    } catch {
      /* sem espaço: roda de novo na próxima */
    }
  }
  return site;
}

/** grava o conteúdo. Lança erro com mensagem amigável se não coube. */
export function lojaSalvar(site: Site): true {
  try {
    localStorage.setItem(LOJA_CHAVE, JSON.stringify(site));
    return true;
  } catch {
    throw new Error("Não coube no armazenamento do navegador. Use imagens menores ou menos imagens enviadas do computador.");
  }
}

/** grava o rascunho da prévia do painel (não muda o site de verdade) */
export function lojaPrevia(site: Site): boolean {
  try {
    localStorage.setItem(PREVIA_CHAVE, JSON.stringify(site));
    return true;
  } catch {
    return false;
  }
}

export function lojaRestaurarPadrao(): void {
  try {
    localStorage.removeItem(LOJA_CHAVE);
  } catch {
    /* sem armazenamento: já está no padrão */
  }
}
