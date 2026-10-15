/*
 * Monitoramento 24h: confere se o site e o banco estão no ar.
 * Roda sozinho a cada 15 min no GitHub (.github/workflows/monitoramento.yml)
 * e também no computador:
 *
 *   npm run monitorar
 *   MONITORAR_URL=https://outro-endereco npm run monitorar
 *
 * O que confere:
 *   1. cada página responde 200 e tem o rodapé da TRIRREME (é o nosso site, não uma página genérica);
 *   2. o JavaScript da página inicial carrega (deploy quebrado devolve 200 com a página em branco);
 *   3. o Firestore responde (conteudo/site), quando o projeto do ambiente já está em projetos.ts.
 *
 * Cada conferência vira uma linha JSON no log. Sai com código 1 se alguma falhar.
 * Não grava nada em lugar nenhum: cada execução custa 1 leitura do Firestore.
 * Ver docs/monitoramento/guia.md.
 */
import { appendFileSync } from "node:fs";
import { CONFIGS } from "../src/lib/firebase/projetos.ts";

const URL_BASE = (process.env.MONITORAR_URL || "https://trirreme-tri.github.io/brupater-site").replace(/\/+$/, "");
const AMBIENTE = process.env.MONITORAR_AMBIENTE || "prod";
const PAGINAS = ["/", "/portfolio", "/agenda", "/encomendas", "/projeto", "/admin"];
const MARCA = "TRIRREME";
const TEMPO_LIMITE_MS = 15000;
const LENTO_MS = 5000;
const TENTATIVAS = 2;

/** Busca com tempo limite e uma nova tentativa (evita alarme por um soluço da rede). */
async function buscar(url) {
  let ultimoErro;
  for (let i = 1; i <= TENTATIVAS; i++) {
    const inicio = performance.now();
    try {
      const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
      const corpo = await r.text();
      const resposta = { status: r.status, corpo, ms: Math.round(performance.now() - inicio) };
      if (r.status < 500 || i === TENTATIVAS) return resposta;
    } catch (erro) {
      ultimoErro = erro;
    }
    if (i < TENTATIVAS) await new Promise((ok) => setTimeout(ok, 3000));
  }
  throw ultimoErro;
}

async function conferirPagina(caminho) {
  const url = URL_BASE + caminho;
  const r = await buscar(url);
  const problemas = [];
  if (r.status !== 200) problemas.push(`status ${r.status}`);
  else if (!r.corpo.includes(MARCA)) problemas.push(`sem "${MARCA}" no HTML`);
  return { alvo: caminho, url, status: r.status, ms: r.ms, problemas, corpo: r.corpo };
}

async function conferirScript(htmlInicio) {
  const src = htmlInicio.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];
  if (!src) return { alvo: "javascript", url: null, status: null, ms: 0, problemas: ["nenhum <script src> na página inicial"] };
  const url = new URL(src, URL_BASE + "/").href;
  const r = await buscar(url);
  return { alvo: "javascript", url, status: r.status, ms: r.ms, problemas: r.status === 200 ? [] : [`status ${r.status}`] };
}

async function conferirFirestore() {
  const projeto = CONFIGS[AMBIENTE]?.projectId;
  if (!projeto) return { alvo: "firestore", url: null, status: null, ms: 0, problemas: [], aviso: `projeto "${AMBIENTE}" ainda vazio em projetos.ts; pulado` };
  const url = `https://firestore.googleapis.com/v1/projects/${projeto}/databases/(default)/documents/conteudo/site`;
  const r = await buscar(url);
  const problemas = [];
  let aviso;
  // 404: documento ainda não criado (o site mostra o PADRAO). Não é queda.
  if (r.status === 404) aviso = "conteudo/site não existe: o site mostra o PADRAO";
  else if (r.status === 429) problemas.push("cota do Firestore esgotada (429)");
  else if (r.status === 403) problemas.push("leitura negada (403): conferir firestore.rules e o projectId em projetos.ts");
  else if (r.status !== 200) problemas.push(`status ${r.status}`);
  return { alvo: "firestore", url, status: r.status, ms: r.ms, problemas, aviso };
}

async function seguro(alvo, conferir) {
  try {
    return await conferir();
  } catch (erro) {
    const motivo = erro?.name === "TimeoutError" ? `sem resposta em ${TEMPO_LIMITE_MS / 1000} s` : String(erro?.cause?.code || erro?.message || erro);
    return { alvo, url: null, status: null, ms: 0, problemas: [motivo] };
  }
}

const hora = new Date().toISOString();
const paginas = await Promise.all(PAGINAS.map((p) => seguro(p, () => conferirPagina(p))));
const inicio = paginas[0];
const resultados = [
  ...paginas,
  inicio.problemas.length === 0 ? await seguro("javascript", () => conferirScript(inicio.corpo)) : { alvo: "javascript", url: null, status: null, ms: 0, problemas: ["página inicial fora do ar"] },
  await seguro("firestore", conferirFirestore),
];

for (const r of resultados) {
  if (r.problemas.length === 0 && r.ms > LENTO_MS) r.aviso = `lento (${r.ms} ms)`;
  const linha = { ...r };
  delete linha.corpo;
  console.log(JSON.stringify({ hora, ok: r.problemas.length === 0, ...linha }));
}

const falhas = resultados.filter((r) => r.problemas.length > 0);

/* resumo em tabela na página da execução, no GitHub Actions */
if (process.env.GITHUB_STEP_SUMMARY) {
  const linhas = resultados.map((r) => {
    const situacao = r.problemas.length ? "❌ " + r.problemas.join("; ") : r.aviso ? "⚠️ " + r.aviso : "✅";
    return `| ${r.alvo} | ${r.status ?? "-"} | ${r.ms} | ${situacao} |`;
  });
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [`### Monitoramento ${hora}`, "", `Endereço: ${URL_BASE} · Firestore: ${AMBIENTE}`, "", "| Alvo | Status | ms | Situação |", "| --- | --- | --- | --- |", ...linhas, ""].join("\n"),
  );
}

if (falhas.length) {
  console.error(`[monitorar] ${falhas.length} falha(s): ` + falhas.map((f) => `${f.alvo} (${f.problemas.join("; ")})`).join(", "));
  process.exit(1);
}
console.log(`[monitorar] tudo no ar (${resultados.length} conferências).`);
