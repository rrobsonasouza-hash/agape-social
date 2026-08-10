import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const administrador = await exigirAdministrador(request);
    const { id } = await context.params;
    const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, administrador);
    const { data: convite, error: buscaError } = await supabase.from("convites_usuarios").select("id").eq("id", id).eq("paroquia_id", paroquiaId).is("used_at", null).maybeSingle();
    if (buscaError || !convite) throw new Error("Convite não encontrado ou já utilizado.");
    const { error } = await supabase.from("convites_usuarios").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("paroquia_id", paroquiaId);
    if (error) throw error;
    await supabase.from("auditoria").insert({ id: randomUUID(), paroquia_id: paroquiaId, dados: { acao: "CONVITE_REVOGADO", entidade: "CONVITES_USUARIOS", entidadeId: id, descricao: "Convite de usuário revogado.", usuarioId: administrador.uid, usuarioNome: administrador.nome, usuarioEmail: administrador.email, data: new Date().toISOString() } });
    return NextResponse.json({ id });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ erro: mensagem }, { status: mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400 });
  }
}
