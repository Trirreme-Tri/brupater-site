import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";
import { AMBIENTE, CONFIGS, EH_EMULADOR } from "./projetos";

/**
 * Instâncias únicas do Firebase (só no navegador).
 * Guardadas em globalThis para sobreviver ao recarregamento a quente do `next dev`,
 * que senão tentaria inicializar o Firestore duas vezes.
 *
 * O login (firebase/auth) fica em auth.ts, separado, para não pesar
 * nas páginas públicas: só o painel importa.
 */
type Cache = { app?: FirebaseApp; db?: Firestore };
const cache = globalThis as typeof globalThis & { __brupaterFirebase?: Cache };
const instancias: Cache = (cache.__brupaterFirebase ??= {});

export function noNavegador(): boolean {
  return typeof window !== "undefined";
}

export function firebaseApp(): FirebaseApp {
  if (!instancias.app) {
    instancias.app = getApps().length > 0 ? getApp() : initializeApp(CONFIGS[AMBIENTE]);
  }
  return instancias.app;
}

export function banco(): Firestore {
  if (!instancias.db) {
    const app = firebaseApp();
    try {
      // ignoreUndefinedProperties: campos opcionais vazios do tipo Site
      // (undefined) são omitidos em vez de derrubar a gravação.
      instancias.db = initializeFirestore(app, { ignoreUndefinedProperties: true });
      if (EH_EMULADOR) connectFirestoreEmulator(instancias.db, "127.0.0.1", 8080);
    } catch {
      instancias.db = getFirestore(app);
    }
  }
  return instancias.db;
}
