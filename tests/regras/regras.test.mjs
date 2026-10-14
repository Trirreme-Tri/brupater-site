// Testes das regras do Firestore. Rodam só no emulador (projeto demo-brupater).
// Comando: npm run test:regras
import { after, before, beforeEach, test } from "node:test";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

const conteudo = { perfil: { nome: "Bru" }, versao: 2, migracoes: [] };

/** @type {import("@firebase/rules-unit-testing").RulesTestEnvironment} */
let amb;

before(async () => {
  amb = await initializeTestEnvironment({
    projectId: "demo-brupater",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});

after(async () => {
  await amb?.cleanup();
});

beforeEach(async () => {
  await amb.clearFirestore();
  await amb.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "admins/bru"), { nome: "Bru" });
    await setDoc(doc(db, "conteudo/site"), { ...conteudo, atualizadoEm: Timestamp.now(), atualizadoPor: "bru" });
    await setDoc(doc(db, "historico/antigo"), { ...conteudo });
  });
});

const visitante = () => amb.unauthenticatedContext().firestore();
const estranho = () => amb.authenticatedContext("estranho").firestore();
const bru = () => amb.authenticatedContext("bru").firestore();
const carimbo = (uid) => ({ atualizadoEm: serverTimestamp(), atualizadoPor: uid });

// ---- Os 6 testes mínimos do guia ----

test("1. visitante sem login lê conteudo/site", async () => {
  await assertSucceeds(getDoc(doc(visitante(), "conteudo/site")));
});

test("2. visitante sem login não grava conteudo/site", async () => {
  await assertFails(setDoc(doc(visitante(), "conteudo/site"), { ...conteudo, ...carimbo("ninguem") }));
});

test("3. usuário logado fora de admins não grava", async () => {
  await assertFails(setDoc(doc(estranho(), "conteudo/site"), { ...conteudo, ...carimbo("estranho") }));
});

test("4. admin grava conteudo/site e cria historico (juntos)", async () => {
  const db = bru();
  const lote = writeBatch(db);
  lote.set(doc(db, "historico/2026-10-09T12-00-00-000Z_bru"), { ...conteudo, copiadoEm: serverTimestamp() });
  lote.set(doc(db, "conteudo/site"), { ...conteudo, perfil: { nome: "Bru Pater" }, ...carimbo("bru") });
  await assertSucceeds(lote.commit());
});

test("5. ninguém altera nem apaga historico pelo site", async () => {
  await assertFails(updateDoc(doc(bru(), "historico/antigo"), { versao: 3 }));
  await assertFails(deleteDoc(doc(bru(), "historico/antigo")));
  await assertFails(getDoc(doc(visitante(), "historico/antigo")));
});

test("6. ninguém lê nem altera admins pelo site", async () => {
  await assertFails(getDoc(doc(bru(), "admins/bru")));
  await assertFails(setDoc(doc(bru(), "admins/outra"), { nome: "x" }));
  await assertFails(setDoc(doc(estranho(), "admins/estranho"), { nome: "eu" }));
});

// ---- Extras (endurecimento proposto no plano) ----

test("extra: admin não pode gravar com o UID de outra pessoa", async () => {
  await assertFails(setDoc(doc(bru(), "conteudo/site"), { ...conteudo, ...carimbo("wellington") }));
});

test("extra: hora do navegador no lugar da hora do servidor é recusada", async () => {
  await assertFails(
    setDoc(doc(bru(), "conteudo/site"), { ...conteudo, atualizadoEm: Timestamp.now(), atualizadoPor: "bru" }),
  );
});

test("extra: gravação sem carimbo é recusada", async () => {
  await assertFails(setDoc(doc(bru(), "conteudo/site"), conteudo));
});

test("extra: ninguém apaga conteudo/site", async () => {
  await assertFails(deleteDoc(doc(bru(), "conteudo/site")));
});

test("extra: coleções fora do combinado são negadas (ex.: pedidos)", async () => {
  await assertFails(setDoc(doc(bru(), "pedidos/x"), { nome: "cliente" }));
  await assertFails(getDoc(doc(visitante(), "pedidos/x")));
});
