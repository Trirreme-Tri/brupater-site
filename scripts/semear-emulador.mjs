// Cria no EMULADOR (nunca na nuvem) as contas de teste da Bru e do Wellington
// e as coloca em admins/{uid}. As senhas são geradas na hora e só aparecem no
// terminal; não são salvas no repositório.
//
// Uso: com `npm run emuladores` rodando em outro terminal, execute
//      npm run emuladores:semear
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
const CHAVE = "demo-chave";
const contas = [
  { nome: "Bru (teste)", email: "bru@teste.local" },
  { nome: "Wellington (teste)", email: "wellington@teste.local" },
];

async function chamar(rota, corpo) {
  const r = await fetch(`${AUTH}/${rota}?key=${CHAVE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...corpo, returnSecureToken: true }),
  });
  return { ok: r.ok, dados: await r.json() };
}

async function garantirConta(email, senha) {
  const criado = await chamar("accounts:signUp", { email, password: senha });
  if (criado.ok) return { uid: criado.dados.localId, senha };
  if (criado.dados?.error?.message === "EMAIL_EXISTS") {
    return { uid: null, senha: null }; // já existe: mantém a senha antiga
  }
  throw new Error(`Falha ao criar ${email}: ${JSON.stringify(criado.dados)}`);
}

let amb;
try {
  amb = await initializeTestEnvironment({
    projectId: "demo-brupater",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
} catch (e) {
  console.error("Não achei o emulador. Rode `npm run emuladores` em outro terminal antes.\n", e.message);
  process.exit(1);
}

for (const c of contas) {
  const { uid, senha } = await garantirConta(c.email, randomBytes(9).toString("base64url"));
  if (!uid) {
    console.log(`• ${c.email} já existia (senha anterior mantida; veja na UI do emulador: http://127.0.0.1:4000/auth)`);
    continue;
  }
  await amb.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "admins", uid), { nome: c.nome }));
  console.log(`• ${c.email}  senha: ${senha}  uid: ${uid}  (admin)`);
}

await amb.cleanup();
console.log("\nPronto. Abra http://localhost:3000/admin e entre com uma das contas acima.");
