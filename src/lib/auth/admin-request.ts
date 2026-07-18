import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type UsuarioAtivo = { uid: string; nome: string; email: string; role: string; paroquiaId: string };

async function validarSupabase(token: string): Promise<UsuarioAtivo> {
  const supabase = supabaseAdmin();
  const { data: autenticacao, error: erroAuth } = await supabase.auth.getUser(token);
  if (erroAuth || !autenticacao.user) throw new Error("UNAUTHENTICATED");
  const { data: perfil, error } = await supabase.from("perfis").select("nome,email,perfil,status,paroquia_id").eq("id", autenticacao.user.id).maybeSingle();
  if (error || !perfil || perfil.status !== "ATIVO" || !perfil.perfil) throw new Error("FORBIDDEN");
  return { uid: autenticacao.user.id, nome: perfil.nome || "Usuário", email: perfil.email || autenticacao.user.email || "", role: perfil.perfil, paroquiaId: perfil.paroquia_id || "principal" };
}

export async function exigirUsuarioAtivo(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("UNAUTHENTICATED");
  return validarSupabase(token);
}

export async function exigirAdministrador(request: NextRequest) {
  const usuario = await exigirUsuarioAtivo(request);
  if (!["admin_plataforma", "admin_paroquia"].includes(usuario.role)) throw new Error("FORBIDDEN");
  return usuario;
}
