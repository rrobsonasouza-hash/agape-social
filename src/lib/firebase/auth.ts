import {
  browserLocalPersistence,
  getAuth,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { app } from "./firebase";

export const auth = getAuth(app);

export async function entrarComEmail(email: string, senha: string) {
  await setPersistence(auth, browserLocalPersistence);
  return signInWithEmailAndPassword(auth, email.trim(), senha);
}

export function enviarRecuperacaoSenha(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export function sair() {
  return signOut(auth);
}
