"use client";

import { useEffect } from "react";
import "@/styles/site.css";
import { AvisoPagina } from "@/components/paginas/AvisoPagina";

/*
 * Aparece sozinha quando alguma página quebra. "Tentar de novo" redesenha a
 * página. O erro vai pro console do navegador: é aqui que a ferramenta de
 * monitoramento de erros (ver o guia do monitoramento) deve ser ligada.
 */
export default function Erro({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <AvisoPagina tipo="erro" tentarDeNovo={retry} />;
}
