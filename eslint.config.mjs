import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /* O site usa <img> comum de propósito: as imagens vêm do conteúdo
         editável (inclusive imagens enviadas como data:), e a otimização do
         next/image exigiria um servidor de imagens (função paga no Firebase)
         e não funciona no modo estático. */
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
