import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const administrador = await exigirUsuarioAtivo(request); if (administrador.role !== "admin_plataforma") throw new Error("FORBIDDEN");
    const { id } = await context.params; const { status } = await request.json(); if (!["ATIVO", "INATIVO"].includes(status)) throw new Error("Status inválido.");
    const supabase = supabaseAdmin(); const atual = await supabase.from("perfis").select("id,nome,email,status").eq("id", id).eq("perfil", "admin_plataforma").maybeSingle();
    if (atual.error || !atual.data) throw new Error("Administrador não encontrado.");
    if (id === administrador.uid || atual.data.email.toLowerCase() === administrador.email.toLowerCase()) throw new Error("Você não pode inativar o próprio acesso.");
    if (status === "INATIVO") { const ativos = await supabase.from("perfis").select("id", { count: "exact", head: true }).eq("perfil", "admin_plataforma").eq("status", "ATIVO"); if (ativos.error) throw ativos.error; if ((ativos.count ?? 0) <= 1) throw new Error("A plataforma precisa manter pelo menos um administrador ativo."); }
    const { error } = await supabase.from("perfis").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("perfil", "admin_plataforma");
    if (error) throw error; return NextResponse.json({ id, status });
  } catch (error) { const mensagem = error instanceof Error ? error.message : "Erro interno."; return NextResponse.json({ erro: mensagem }, { status: mensagem === "FORBIDDEN" ? 403 : 400 }); }
}
