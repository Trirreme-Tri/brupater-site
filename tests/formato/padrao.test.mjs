// O PADRAO precisa caber no Firestore (sem lista dentro de lista, sem undefined, etc.).
import { test } from "node:test";
import { PADRAO } from "../../src/lib/conteudo/padrao.ts";
import { validarParaFirestore } from "../../src/lib/firebase/validar.ts";

test("PADRAO é válido para o Firestore", () => {
  validarParaFirestore(PADRAO);
});
