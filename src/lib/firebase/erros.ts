import { FirebaseError } from "firebase/app";
import { ConflitoDeEdicao } from "./conteudoRemoto";
import { FormatoInvalido } from "./validar";

/** Traduz qualquer erro do login ou do salvamento numa frase para a Bru. */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ConflitoDeEdicao) {
    return "Alguém salvou o site enquanto você editava. Baixe uma cópia (.json) das suas mudanças, recarregue o painel e aplique de novo.";
  }
  if (erro instanceof FormatoInvalido) {
    return `Não deu para salvar: ${erro.message}`;
  }
  if (erro instanceof FirebaseError) {
    switch (erro.code) {
      case "auth/invalid-credential":
      case "auth/invalid-email":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "E-mail ou senha incorretos.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Espere alguns minutos ou redefina a senha.";
      case "auth/network-request-failed":
      case "unavailable":
        return "Sem conexão com o servidor. Confira a internet e tente de novo.";
      case "permission-denied":
        return "Esta conta não tem permissão para editar o site.";
      case "resource-exhausted":
        return "O limite gratuito do banco foi atingido hoje. Avise a TRIRREME.";
      default:
        return `Erro inesperado (${erro.code}). Avise a TRIRREME.`;
    }
  }
  return "Erro inesperado. Avise a TRIRREME.";
}
