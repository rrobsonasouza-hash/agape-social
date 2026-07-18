"use client";

import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, entrarComEmail as entrarFirebase, enviarRecuperacaoSenha as recuperarFirebase, sair as sairFirebase } from "@/lib/firebase/auth";
import { supabase } from "@/lib/supabase/client";

export type IdentidadeSessao = { provedor: "supabase" | "firebase"; uid: string; email: string; nome: string; firebaseUser?: FirebaseUser };

export async function obterTokenAcesso() {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session.access_token;
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sessão expirada.");
  return token;
}

export async function entrar(email: string, senha: string) {
  const endereco = email.trim().toLowerCase();
  const resultado = await supabase.auth.signInWithPassword({ email: endereco, password: senha });
  if (!resultado.error) return;
  try { await entrarFirebase(endereco, senha); } catch { throw resultado.error; }
}

export async function enviarRecuperacaoSenha(email: string) {
  const endereco = email.trim().toLowerCase();
  const resultado = await supabase.auth.resetPasswordForEmail(endereco, { redirectTo: `${window.location.origin}/definir-senha` });
  if (resultado.error) await recuperarFirebase(endereco);
}

export async function sair() { await Promise.allSettled([supabase.auth.signOut(), sairFirebase()]); }

export function observarSessao(callback: (identidade: IdentidadeSessao | null) => void) {
  let identidadeSupabase: IdentidadeSessao | null = null, identidadeFirebase: IdentidadeSessao | null = null;
  let supabasePronto = false, firebasePronto = false;
  const publicar = () => { if (supabasePronto && firebasePronto) callback(identidadeSupabase || identidadeFirebase); };
  const assinatura = supabase.auth.onAuthStateChange((_evento, sessao) => {
    const user = sessao?.user;
    identidadeSupabase = user ? { provedor: "supabase", uid: user.id, email: user.email || "", nome: String(user.user_metadata?.nome || "") } : null;
    supabasePronto = true; publicar();
  });
  const cancelarFirebase = onAuthStateChanged(auth, (user) => {
    identidadeFirebase = user ? { provedor: "firebase", uid: user.uid, email: user.email || "", nome: user.displayName || "", firebaseUser: user } : null;
    firebasePronto = true; publicar();
  });
  return () => { assinatura.data.subscription.unsubscribe(); cancelarFirebase(); };
}
