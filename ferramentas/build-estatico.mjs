/*
 * Gera o site como arquivos prontos (pasta out/), para hospedagens que só
 * servem arquivos estáticos, como o Firebase Hosting no plano grátis (Spark).
 * Funciona no Windows, no macOS e no Linux (não depende da sintaxe do terminal).
 *
 *   npm run build:estatico
 *
 * No modo estático não há servidor: os redirecionamentos dos endereços
 * antigos (*.html) ficam desligados.
 */
import { spawnSync } from "node:child_process";

const r = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, NEXT_OUTPUT: "export" },
});
process.exit(r.status ?? 1);
