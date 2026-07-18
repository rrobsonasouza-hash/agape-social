import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

type UsuarioAtivo = { uid: string; nome: string; email: string; role: string; paroquiaId: string };

async function validarSupabase(token: string): Promise<UsuarioAtivo | null> {
  const supabase = supabaseAdmin();
  const { data: autenticacao, error: erroAuth } = await supabase.auth.getUser(token);
  if (erroAuth || !autenticacao.user) return null;
  const { data: perfil, error } = await supabase.from("perfis").select("nome,email,perfil,status,paroquia_id").eq("id", autenticacao.user.id).maybeSingle();
  if (error || !perfil || perfil.status !== "ATIVO" || !perfil.perfil) throw new Error("FORBIDDEN");
  return { uid: autenticacao.user.id, nome: perfil.nome || "Usuário", email: perfil.email || autenticacao.user.email || "", role: perfil.perfil, paroquiaId: perfil.paroquia_id || "principal" };
}

export async function exigirUsuarioAtivo(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("UNAUTHENTICATED");
  const usuarioSupabase = await validarSupabase(token);
  if (usuarioSupabase) return usuarioSupabase;
  const decoded = await adminAuth().verifyIdToken(token);
  const perfil = await adminDb().collection("usuarios").doc(decoded.uid).get();
  const dados = perfil.data() as { nome?: string; email?: string; status?: string; role?: string; paroquiaId?: string } | undefined;
  if (!perfil.exists || dados?.status !== "ATIVO" || !dados.role) throw new Error("FORBIDDEN");
  return { uid: decoded.uid, nome: dados?.nome || decoded.name || "Administrador", email: dados?.email || decoded.email || "", role: dados?.role || "", paroquiaId: dados?.paroquiaId || "principal" };
}

export async function exigirAdministrador(request: NextRequest) {
  const usuario = await exigirUsuarioAtivo(request);
  if (!["admin_plataforma", "admin_paroquia"].includes(usuario.role)) throw new Error("FORBIDDEN");
  return usuario;
}
