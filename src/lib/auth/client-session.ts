"use client";

import { supabase } from "@/lib/supabase/client";

export type IdentidadeSessao = { uid: string; email: string; nome: string };

export async function obterTokenAcesso() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("Sessão expirada.");
  return data.session.access_token;
}

export async function entrar(email: string, senha: string) {
  const resultado = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
  if (resultado.error) throw resultado.error;
}

export async function enviarRecuperacaoSenha(email: string) {
  const resultado = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/definir-senha` });
  if (resultado.error) throw resultado.error;
}

export async function sair() { await supabase.auth.signOut(); }

export function observarSessao(callback: (identidade: IdentidadeSessao | null) => void) {
  const assinatura = supabase.auth.onAuthStateChange((_evento, sessao) => {
    const user = sessao?.user;
    callback(user ? { uid: user.id, email: user.email || "", nome: String(user.user_metadata?.nome || "") } : null);
  });
  return () => assinatura.data.subscription.unsubscribe();
}
