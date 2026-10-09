import type { NextConfig } from "next";

/*
 * Dois jeitos de gerar o site (o código é o mesmo):
 *   npm run build           → Next.js com servidor (Firebase App Hosting, Hostinger com Node.js)
 *   npm run build:estatico  → arquivos prontos na pasta out/ (Firebase Hosting grátis)
 * Por isso o site não usa nada que exija servidor (Server Actions, rotas de API, proxy).
 */
const estatico = process.env.NEXT_OUTPUT === "export";

/* endereços do site antigo (HTML puro) → endereços novos */
const ANTIGOS: [string, string][] = [
  ["/index.html", "/"],
  ["/site.html", "/"],
  ["/portfolio.html", "/portfolio"],
  ["/agenda.html", "/agenda"],
  ["/encomendas.html", "/encomendas"],
  ["/projeto.html", "/projeto"],
  ["/admin.html", "/admin"],
  ["/apresentacao.html", "/apresentacao"],
  ["/erro.html", "/erro"],
  ["/manutencao.html", "/manutencao"],
];

const nextConfig: NextConfig = {
  output: estatico ? "export" : undefined,
  poweredByHeader: false,
  ...(estatico
    ? {}
    : {
        async redirects() {
          return ANTIGOS.map(([source, destination]) => ({ source, destination, permanent: true }));
        },
      }),
};

export default nextConfig;
