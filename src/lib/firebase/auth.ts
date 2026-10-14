import {
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type Unsubscribe,
} from "firebase/auth";
import { firebaseApp } from "./config";
import { EH_EMULADOR } from "./projetos";

/**
 * Login do painel (Firebase Authentication, e-mail e senha).
 * Substitui o usuário e senha que hoje estão em src/lib/acessoPainel.ts.
 * Só o painel importa este arquivo.
 *
 * Sessão por aba (browserSessionPersistence), igual ao comportamento atual
 * com sessionStorage: fechou a aba, precisa entrar de novo.
 */
type Cache = { auth?: Auth; persistencia?: Promise<void> };
const cache = globalThis as typeof globalThis & { __brupaterAuth?: Cache };
const instancias: Cache = (cache.__brupaterAuth ??= {});

export function autenticacao(): Auth {
  if (!instancias.auth) {
    const auth = getAuth(firebaseApp());
    if (EH_EMULADOR) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    }
    instancias.persistencia = setPersistence(auth, browserSessionPersistence);
    instancias.auth = auth;
  }
  return instancias.auth;
}

export type Usuario = { uid: string; email: string | null };

export async function entrar(email: string, senha: string): Promise<Usuario> {
  const auth = autenticacao();
  await instancias.persistencia;
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), senha);
  return { uid: user.uid, email: user.email };
}

export function sair(): Promise<void> {
  return signOut(autenticacao());
}

export function ouvirUsuario(aoMudar: (usuario: Usuario | null) => void): Unsubscribe {
  return onAuthStateChanged(autenticacao(), (user) => {
    aoMudar(user ? { uid: user.uid, email: user.email } : null);
  });
}

/** E-mail de redefinição do próprio Firebase. A senha nunca passa por chat. */
export function enviarRedefinicao(email: string): Promise<void> {
  return sendPasswordResetEmail(autenticacao(), email.trim());
}
