// Prepara o repositório brupater-site para o Firebase. Seguro de rodar mais de
// uma vez: só acrescenta o que falta, nunca apaga nem sobrescreve.
//
// Uso (na raiz do repositório): node scripts/instalar-firebase.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const feito = [];

// 1. firebase.json: acrescenta firestore e emuladores, mantém o hosting já configurado.
const fb = existsSync("firebase.json") ? JSON.parse(readFileSync("firebase.json", "utf8")) : {};
if (!fb.firestore) {
  fb.firestore = { rules: "firestore.rules", indexes: "firestore.indexes.json" };
  feito.push("firebase.json: seção firestore");
}
fb.emulators ??= {};
for (const [nome, valor] of Object.entries({
  auth: { port: 9099 },
  firestore: { port: 8080 },
  ui: { enabled: true, port: 4000 },
  singleProjectMode: true,
})) {
  if (fb.emulators[nome] === undefined) {
    fb.emulators[nome] = valor;
    feito.push(`firebase.json: emulators.${nome}`);
  }
}
writeFileSync("firebase.json", JSON.stringify(fb, null, 2) + "\n");

// 2. package.json: scripts novos (não mexe nos existentes).
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
pkg.scripts ??= {};
const scripts = {
  emuladores: "firebase emulators:start --project demo-brupater --import ./.emulador --export-on-exit",
  "emuladores:semear": "node scripts/semear-emulador.mjs",
  "test:regras":
    'firebase emulators:exec --only firestore --project demo-brupater "node --test tests/regras/regras.test.mjs"',
  "build:estatico:staging": "cross-env NEXT_PUBLIC_FIREBASE_AMBIENTE=staging npm run build:estatico",
  "deploy:staging": "npm run build:estatico:staging && firebase deploy --project staging --only hosting,firestore",
};
for (const [nome, cmd] of Object.entries(scripts)) {
  if (!pkg.scripts[nome]) {
    pkg.scripts[nome] = cmd;
    feito.push(`package.json: script ${nome}`);
  }
}
writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");

// 3. .gitignore: dados do emulador e logs do Firebase nunca vão para o git.
const gi = existsSync(".gitignore") ? readFileSync(".gitignore", "utf8") : "";
const entradas = [".emulador/", "firebase-debug*.log", "firestore-debug.log", "ui-debug.log", "*-service-account*.json"];
const faltam = entradas.filter((e) => !gi.split(/\r?\n/).includes(e));
if (faltam.length) {
  writeFileSync(".gitignore", gi.replace(/\n?$/, "\n") + "\n# Firebase\n" + faltam.join("\n") + "\n");
  feito.push(`.gitignore: ${faltam.join(", ")}`);
}

console.log(feito.length ? "Feito:\n- " + feito.join("\n- ") : "Nada a fazer: já estava configurado.");
console.log(`
Agora instale as dependências:
  npm install firebase
  npm install -D firebase-tools @firebase/rules-unit-testing cross-env
`);
