import type { FirebaseOptions } from "firebase/app";

/**
 * Configuração dos projetos Firebase do site.
 *
 * O firebaseConfig do app web pode ficar no código: ele identifica o projeto,
 * não dá acesso. Quem protege os dados são as regras (firestore.rules).
 * Chave de conta de serviço (.json com chave privada) NUNCA entra aqui.
 *
 * Preencha dev, staging e prod copiando do console:
 * Configurações do projeto → Seus apps → app Web → firebaseConfig.
 */
export type Ambiente = "emulador" | "dev" | "staging" | "prod";

const PENDENTE: FirebaseOptions = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export const CONFIGS: Record<Ambiente, FirebaseOptions> = {
  // Projeto "demo-*": só existe no emulador local, não toca a nuvem.
  emulador: {
    apiKey: "demo-chave",
    authDomain: "demo-brupater.firebaseapp.com",
    projectId: "demo-brupater",
  },
  dev: PENDENTE,
  staging: PENDENTE,
  prod: PENDENTE,
};

function lerAmbiente(): Ambiente {
  // Referência literal: o Next.js só embute NEXT_PUBLIC_* escritas assim.
  const valor = process.env.NEXT_PUBLIC_FIREBASE_AMBIENTE;
  if (valor === "emulador" || valor === "dev" || valor === "staging" || valor === "prod") {
    return valor;
  }
  return process.env.NODE_ENV === "production" ? "prod" : "emulador";
}

export const AMBIENTE: Ambiente = lerAmbiente();
export const EH_EMULADOR = AMBIENTE === "emulador";

/** Sem projectId o site funciona só com cópia local + PADRAO, sem quebrar. */
export function configPronta(): boolean {
  return Boolean(CONFIGS[AMBIENTE].projectId);
}
