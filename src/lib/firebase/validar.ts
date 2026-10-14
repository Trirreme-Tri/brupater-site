/**
 * Confere se um objeto pode ir para o Firestore ANTES de tentar gravar,
 * com mensagem que diz exatamente qual campo está errado.
 *
 * Pega o que o Firestore recusaria ou o que as regras do guia proíbem:
 * - imagem em base64 (data:...) — o banco guarda só o endereço;
 * - lista dentro de lista (o Firestore não aceita);
 * - undefined dentro de lista, número não finito, Date, função, classe;
 * - chave vazia ou reservada (__x__);
 * - documento grande demais (limite real 1 MiB; usamos folga).
 */
export const LIMITE_BYTES = 900_000;

export class FormatoInvalido extends Error {
  readonly caminho: string;
  constructor(caminho: string, motivo: string) {
    super(`${caminho}: ${motivo}`);
    this.name = "FormatoInvalido";
    this.caminho = caminho;
  }
}

export function validarParaFirestore(valor: unknown, raiz = "site"): void {
  percorrer(valor, raiz, false);
  const bytes = new TextEncoder().encode(JSON.stringify(valor)).length;
  if (bytes > LIMITE_BYTES) {
    throw new FormatoInvalido(raiz, `documento com ${bytes} bytes passa do limite de ${LIMITE_BYTES}`);
  }
}

function ehObjetoSimples(v: object): boolean {
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function percorrer(v: unknown, caminho: string, dentroDeLista: boolean): void {
  if (v === null || typeof v === "boolean") return;

  if (v === undefined) {
    if (dentroDeLista) throw new FormatoInvalido(caminho, "valor vazio (undefined) dentro de lista");
    return; // em objeto, ignoreUndefinedProperties omite o campo
  }

  if (typeof v === "string") {
    if (/^data:/i.test(v.trim())) {
      throw new FormatoInvalido(caminho, "imagem em base64 não vai para o banco; use o endereço da imagem");
    }
    return;
  }

  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new FormatoInvalido(caminho, "número inválido (NaN ou infinito)");
    return;
  }

  if (Array.isArray(v)) {
    if (dentroDeLista) throw new FormatoInvalido(caminho, "lista dentro de lista não é aceita pelo Firestore");
    v.forEach((item, i) => percorrer(item, `${caminho}[${i}]`, true));
    return;
  }

  if (typeof v === "object" && ehObjetoSimples(v)) {
    for (const [chave, item] of Object.entries(v)) {
      if (chave === "" || /^__.*__$/.test(chave)) {
        throw new FormatoInvalido(`${caminho}.${chave}`, "nome de campo vazio ou reservado");
      }
      percorrer(item, `${caminho}.${chave}`, false);
    }
    return;
  }

  throw new FormatoInvalido(caminho, `tipo não suportado (${typeof v})`);
}
