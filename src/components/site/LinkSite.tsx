"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { usePrevia } from "@/lib/useSite";

/*
 * Link entre as páginas do site. Usa o <Link> do Next.js: a troca de página
 * acontece sem recarregar (o mini player de música continua tocando).
 * Dentro da prévia do painel, os links continuam na prévia (?previa=1).
 */
export function hrefComPrevia(href: string, previa: boolean): string {
  if (!previa || typeof window === "undefined" || !href.startsWith("/")) return href;
  const tema = /[?&]tema=(dark|light)/.exec(window.location.search);
  const extra = "previa=1" + (tema ? "&tema=" + tema[1] : "");
  const [semHash, hash] = href.split("#");
  return semHash + (semHash.includes("?") ? "&" : "?") + extra + (hash !== undefined ? "#" + hash : "");
}

export function LinkSite({ href, ...resto }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const previa = usePrevia();
  return <Link href={hrefComPrevia(href, previa)} {...resto} />;
}
