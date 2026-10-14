import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import type { Site } from "../conteudo/tipos";
import { banco, noNavegador } from "./config";
import { configPronta } from "./projetos";
import { CHAVE_CACHE } from "./constantes";
import { validarParaFirestore } from "./validar";

/**
 * Conteúdo do site no Firestore (opção A: um documento, conteudo/site).
 *
 * Só loja.ts e useSite.ts devem importar este arquivo (mais o painel,
 * para salvar e para o histórico). O resto do site não sabe que o Firebase existe.
 */

export { CHAVE_CACHE };
const TEMPO_LIMITE_MS = 8000;
const CAMPOS_DE_CONTROLE = ["atualizadoEm", "atualizadoPor", "copiadoEm", "copiadoPor"] as const;

export type CopiaRemota = {
  /** Conteúdo como está no banco, sem os campos de controle. Mesclar sobre o PADRAO. */
  site: Partial<Site>;
  /** Hora do servidor do último salvamento, em ms. Usada para detectar edição simultânea. */
  atualizadoEmMs: number | null;
  atualizadoPor: string | null;
};

export type MotivoFalha = "tempo-esgotado" | "erro";

// ---------- cache local (só leitura rápida; a verdade é o Firestore) ----------

export function lerCache(): CopiaRemota | null {
  if (!noNavegador()) return null;
  try {
    const bruto = window.localStorage.getItem(CHAVE_CACHE);
    if (!bruto) return null;
    const dado = JSON.parse(bruto) as Partial<CopiaRemota>;
    if (!dado || typeof dado !== "object" || !dado.site || typeof dado.site !== "object") return null;
    return {
      site: dado.site,
      atualizadoEmMs: typeof dado.atualizadoEmMs === "number" ? dado.atualizadoEmMs : null,
      atualizadoPor: typeof dado.atualizadoPor === "string" ? dado.atualizadoPor : null,
    };
  } catch {
    return null;
  }
}

function gravarCache(copia: CopiaRemota): void {
  try {
    window.localStorage.setItem(CHAVE_CACHE, JSON.stringify(copia));
  } catch {
    // Sem espaço ou modo privado: o site segue sem cache.
  }
}

function separar(dados: Record<string, unknown>): CopiaRemota {
  const site: Record<string, unknown> = { ...dados };
  for (const campo of CAMPOS_DE_CONTROLE) delete site[campo];
  const { atualizadoEm, atualizadoPor } = dados;
  return {
    site: site as Partial<Site>,
    atualizadoEmMs: atualizadoEm instanceof Timestamp ? atualizadoEm.toMillis() : null,
    atualizadoPor: typeof atualizadoPor === "string" ? atualizadoPor : null,
  };
}

// ---------- leitura ----------

/**
 * Escuta conteudo/site. Chama aoReceber com a cópia nova (ou null se o
 * documento ainda não existe: vale o PADRAO). Se o Firestore não responder
 * em 8 s ou der erro, chama aoFalhar e o site segue com cache ou PADRAO.
 * Devolve a função que para de escutar.
 */
export function ouvirConteudo(
  aoReceber: (copia: CopiaRemota | null) => void,
  aoFalhar?: (motivo: MotivoFalha, erro?: unknown) => void,
): Unsubscribe {
  if (!noNavegador() || !configPronta()) return () => {};

  let recebeu = false;
  const timer = window.setTimeout(() => {
    if (!recebeu) aoFalhar?.("tempo-esgotado");
  }, TEMPO_LIMITE_MS);

  const parar = onSnapshot(
    doc(banco(), "conteudo", "site"),
    (snap) => {
      recebeu = true;
      window.clearTimeout(timer);
      if (!snap.exists()) {
        aoReceber(null);
        return;
      }
      const copia = separar(snap.data({ serverTimestamps: "estimate" }));
      // Gravação local ainda não confirmada pelo servidor: não vira cache.
      if (!snap.metadata.hasPendingWrites) gravarCache(copia);
      aoReceber(copia);
    },
    (erro) => {
      window.clearTimeout(timer);
      aoFalhar?.("erro", erro);
    },
  );

  return () => {
    window.clearTimeout(timer);
    parar();
  };
}

// ---------- gravação (só painel, com login) ----------

export class ConflitoDeEdicao extends Error {
  readonly salvoPor: string | null;
  constructor(salvoPor: string | null) {
    super("Outra pessoa salvou o site depois que você abriu o painel.");
    this.name = "ConflitoDeEdicao";
    this.salvoPor = salvoPor;
  }
}

function idHistorico(uid: string): string {
  return `${new Date().toISOString().replace(/[:.]/g, "-")}_${uid.slice(0, 8)}`;
}

/**
 * Salva o site inteiro. Numa única transação:
 * 1. confere se ninguém salvou desde que o painel carregou (atualizadoEmEsperadoMs);
 * 2. copia a versão anterior para historico/{data-hora};
 * 3. grava a nova versão com carimbo de hora do servidor e UID.
 * Se qualquer parte falhar, nada é gravado.
 *
 * @param uid UID de quem está logado (vem de auth.ts; não importamos auth aqui
 *            para não pesar nas páginas públicas).
 */
export async function salvarConteudo(
  site: Site,
  atualizadoEmEsperadoMs: number | null,
  uid: string,
): Promise<void> {
  validarParaFirestore(site);
  const db = banco();
  const ref = doc(db, "conteudo", "site");

  await runTransaction(db, async (tx) => {
    const atual = await tx.get(ref);
    if (atual.exists()) {
      const dados = atual.data();
      const ms = dados.atualizadoEm instanceof Timestamp ? dados.atualizadoEm.toMillis() : null;
      if (ms !== atualizadoEmEsperadoMs) {
        throw new ConflitoDeEdicao(typeof dados.atualizadoPor === "string" ? dados.atualizadoPor : null);
      }
      tx.set(doc(collection(db, "historico"), idHistorico(uid)), {
        ...dados,
        copiadoEm: serverTimestamp(),
        copiadoPor: uid,
      });
    }
    tx.set(ref, { ...site, atualizadoEm: serverTimestamp(), atualizadoPor: uid });
  });
}

/** "Voltar ao padrão" = salvar o PADRAO. A versão anterior vai para o histórico. */
export function restaurarPadrao(padrao: Site, atualizadoEmEsperadoMs: number | null, uid: string): Promise<void> {
  return salvarConteudo(padrao, atualizadoEmEsperadoMs, uid);
}

// ---------- histórico (só admins) ----------

export type ItemHistorico = { id: string; copiadoEmMs: number | null; atualizadoPor: string | null };

export async function listarHistorico(quantos = 20): Promise<ItemHistorico[]> {
  const q = query(collection(banco(), "historico"), orderBy("copiadoEm", "desc"), limit(quantos));
  const res = await getDocs(q);
  return res.docs.map((d) => {
    const dados = d.data();
    return {
      id: d.id,
      copiadoEmMs: dados.copiadoEm instanceof Timestamp ? dados.copiadoEm.toMillis() : null,
      atualizadoPor: typeof dados.atualizadoPor === "string" ? dados.atualizadoPor : null,
    };
  });
}

/** Volta para uma versão do histórico. A versão atual também vai para o histórico antes. */
export async function restaurarVersao(
  idHistoricoVersao: string,
  atualizadoEmEsperadoMs: number | null,
  uid: string,
): Promise<void> {
  const snap = await getDoc(doc(banco(), "historico", idHistoricoVersao));
  if (!snap.exists()) throw new Error(`Versão ${idHistoricoVersao} não encontrada no histórico.`);
  const { site } = separar(snap.data());
  await salvarConteudo(site as Site, atualizadoEmEsperadoMs, uid);
}
