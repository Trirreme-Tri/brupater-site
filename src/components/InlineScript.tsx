/*
 * Script que roda enquanto o navegador lê o HTML, antes da página aparecer
 * (cores do painel, tela de carregamento). No navegador, o React não executa
 * scripts de novo: por isso o tipo muda pra "text/plain" do lado do cliente
 * (padrão recomendado na documentação do Next.js: "Preventing Flash").
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
