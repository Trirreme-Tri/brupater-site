/*
 * Camada de dados: onde o conteúdo do site fica guardado.
 *
 * O padrão vem de src/lib/conteudo/padrao.ts (PADRAO). O que a Bru salva no
 * painel mora no Firestore (conteudo/site, formato do tipo Site) e vale para
 * todos os visitantes. A última cópia recebida fica em cache no navegador, para
 * a próxima visita abrir já com o conteúdo certo.
 *
 * Só este arquivo e useSite.ts conversam com o armazenamento. O rascunho da
 * prévia do painel continua local (PREVIA_CHAVE).
 *
 * Só roda no navegador. No servidor, o site usa o PADRAO.
 */
import { PADRAO } from "./conteudo/padrao";
import type { Site } from "./conteudo/tipos";
import { copiaProfunda, rotaInterna } from "./util";
import {
  lerCache,
  ouvirConteudo,
  restaurarPadrao,
  salvarConteudo,
  type CopiaRemota,
} from "./firebase/conteudoRemoto";

/* Chave antiga do localStorage (v2). O site público não lê mais daqui: o
   conteúdo vem do Firestore. Fica só para o painel não perder o que a Bru
   salvou neste navegador antes do banco (o dado nunca é apagado). */
export const LOJA_CHAVE = "brupater:site:v2";

/* Prévia ao vivo do painel: o painel grava o rascunho (ainda não salvo) em
   PREVIA_CHAVE e mostra o site num quadro com ?previa=1. Nesse modo o site lê
   o rascunho em vez do conteúdo salvo e redesenha a cada mudança. */
export const PREVIA_CHAVE = "brupater:previa";

export function emPrevia(): boolean {
  return typeof window !== "undefined" && /[?&]previa=1(&|$)/.test(window.location.search);
}

/* ---------- cópia vinda do Firestore ---------- */
let remoto: CopiaRemota | null | undefined; // undefined = cache local ainda não lido
let versaoRemoto = 0;
const ouvintes = new Set<() => void>();
let pararEscuta: (() => void) | null = null;

function copiaRemota(): CopiaRemota | null {
  if (remoto === undefined) remoto = lerCache();
  return remoto;
}

/** muda a cada cópia nova recebida (para o useSite saber quando recalcular) */
export const lojaVersao = (): number => versaoRemoto;

/** hora do servidor do último salvamento conhecido, em ms (null se ainda não há) */
export function lojaAtualizadoEmMs(): number | null {
  return copiaRemota()?.atualizadoEmMs ?? null;
}

/** Avisa quando chega conteúdo novo. Abre UMA escuta no Firestore, compartilhada, e fecha quando o último sai. */
export function lojaAssinar(avisar: () => void): () => void {
  ouvintes.add(avisar);
  if (!pararEscuta) {
    pararEscuta = ouvirConteudo(
      (copia) => {
        remoto = copia;
        versaoRemoto++;
        ouvintes.forEach((f) => f());
      },
      (motivo, erro) => console.warn("[brupater] Firestore indisponível (" + motivo + "); seguindo com a cópia local ou o padrão.", erro),
    );
  }
  return () => {
    ouvintes.delete(avisar);
    if (ouvintes.size === 0 && pararEscuta) {
      pararEscuta();
      pararEscuta = null;
    }
  };
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
  /* out/2026: "Crie sua Ilustração" ganhou cenário e capa de livro */
  {
    id: "2026-10-cenario-capa",
    rodar: (s) => {
      if (s.precos.ilustracao.sub === "Personagens, OCs e fichas") s.precos.ilustracao.sub = PADRAO.precos.ilustracao.sub;
      const enc = (s.cenas.paginas || {}).encomendas;
      if (enc && enc.sub === "Crie seu personagem e veja o preço na hora.") enc.sub = PADRAO.cenas.paginas.encomendas.sub;
      (s.links || []).forEach((l) => {
        if (l.nome === "Crie seu personagem" && l.desc === "Monte sua encomenda e veja o preço na hora") {
          l.nome = "Crie sua arte";
          l.desc = "Personagem, cenário ou capa: veja o preço na hora";
        }
      });
    },
  },
];

function lerSalvo(): unknown {
  if (emPrevia()) {
    try {
      const previa = localStorage.getItem(PREVIA_CHAVE);
      if (previa) return JSON.parse(previa);
    } catch {
      /* rascunho ilegível: usa o conteúdo salvo */
    }
  }
  return copiaRemota()?.site ?? null;
}

/** conteúdo atual: o salvo no Firestore (ou o rascunho da prévia) por cima do padrão */
export function lojaCarregar(): Site {
  const salvo = typeof window === "undefined" ? null : lerSalvo();
  const site = mesclar(copiaProfunda(PADRAO), salvo || {});
  const feitas: string[] = ((salvo as Site | null)?.migracoes || []).slice();
  MIGRACOES.forEach((m) => {
    if (feitas.indexOf(m.id) >= 0) return;
    if (salvo) {
      try {
        m.rodar(site);
      } catch {
        /* dado estranho: deixa como está */
      }
    }
    feitas.push(m.id);
  });
  site.migracoes = feitas;
  return site;
}

/**
 * Grava no Firestore (só com a Bru ou o Wellington logados). Lança erro se não conseguir; traduzir com mensagemDeErro().
 * baseMs = lojaAtualizadoEmMs() de quando o painel carregou o conteúdo que está sendo editado: se outra pessoa
 * salvou depois, o salvamento é recusado (ConflitoDeEdicao) em vez de sobrescrever.
 */
export async function lojaSalvar(site: Site, baseMs: number | null, uid: string): Promise<void> {
  await salvarConteudo(site, baseMs, uid);
  await aguardarCopiaNova(baseMs);
}

/* Depois de salvar, espera a escuta trazer o carimbo novo: sem isso, um segundo
   salvamento seguido seria recusado como "edição simultânea". */
function aguardarCopiaNova(antes: number | null): Promise<void> {
  return new Promise((resolve) => {
    let solta = () => {};
    const fim = () => {
      window.clearTimeout(limite);
      solta();
      resolve();
    };
    const limite = window.setTimeout(fim, 5000);
    solta = lojaAssinar(() => {
      if (lojaAtualizadoEmMs() !== antes) fim();
    });
    if (lojaAtualizadoEmMs() !== antes) fim();
  });
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

/** Volta ao padrão. A versão anterior vai para o histórico (nada se perde). */
export async function lojaRestaurarPadrao(baseMs: number | null, uid: string): Promise<void> {
  const padrao = copiaProfunda(PADRAO);
  padrao.migracoes = MIGRACOES.map((m) => m.id);
  await restaurarPadrao(padrao, baseMs, uid);
  await aguardarCopiaNova(baseMs);
}
