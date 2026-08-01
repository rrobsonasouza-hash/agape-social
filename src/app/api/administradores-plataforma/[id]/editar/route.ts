import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const administrador = await exigirUsuarioAtivo(request);
    if (administrador.role !== "admin_plataforma") throw new Error("FORBIDDEN");
    const { id } = await context.params;
    const body = await request.json() as { nome?: string; email?: string; telefone?: string };
    const nome = String(body.nome ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const telefone = String(body.telefone ?? "").trim();
    if (nome.length < 3 || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Informe nome e e-mail válidos.");
    const supabase = supabaseAdmin();
    const { data: atual, error: consultaError } = await supabase.from("perfis").select("id").eq("id", id).eq("perfil", "admin_plataforma").maybeSingle();
    if (consultaError || !atual) throw new Error("Administrador não encontrado.");
    const { error: authError } = await supabase.auth.admin.updateUserById(id, { email, user_metadata: { nome } });
    if (authError) throw authError;
    const { error } = await supabase.from("perfis").update({ nome, email, telefone: telefone || null, updated_at: new Date().toISOString() }).eq("id", id).eq("perfil", "admin_plataforma");
    if (error) throw error;
    return NextResponse.json({ id, nome, email, telefone });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro interno.";
    const conflito = /already|registered|duplicate/i.test(mensagem);
    return NextResponse.json({ erro: conflito ? "Já existe uma credencial com este e-mail." : mensagem }, { status: mensagem === "FORBIDDEN" ? 403 : conflito ? 409 : 400 });
  }
}
