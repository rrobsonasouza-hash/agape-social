import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
import { usuarioSchema } from "@/modules/usuarios/schemas/usuario.schema";

function erro(error: unknown) { const mensagem = error instanceof Error ? error.message : "Erro interno."; return NextResponse.json({ erro: mensagem }, { status: mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400 }); }

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const administrador = await exigirAdministrador(request); const { id } = await context.params; const dados = usuarioSchema.parse(await request.json());
    if (dados.role === "admin_plataforma") throw new Error("O perfil Administrador da plataforma só pode ser gerenciado pela Central.");
    const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, administrador);
    const atual = await supabase.from("perfis").select("id").eq("id", id).eq("paroquia_id", paroquiaId).neq("perfil", "admin_plataforma").maybeSingle();
    if (atual.error || !atual.data) throw new Error("Usuário não encontrado.");
    const email = dados.email.trim().toLowerCase();
    const atualizacaoAuth = await supabase.auth.admin.updateUserById(id, { email, email_confirm: true, user_metadata: { nome: dados.nome } });
    if (atualizacaoAuth.error) throw atualizacaoAuth.error;
    const { error } = await supabase.from("perfis").update({ nome: dados.nome, email, telefone: dados.telefone || "", perfil: dados.role, status: dados.status, observacoes: dados.observacoes || "", updated_at: new Date().toISOString() }).eq("id", id).eq("paroquia_id", paroquiaId);
    if (error) throw error;
    await supabase.from("auditoria").insert({ id: randomUUID(), paroquia_id: paroquiaId, dados: { acao: "EDIÇÃO", entidade: "USUÁRIOS", entidadeId: id, descricao: `Credencial e perfil atualizados: ${dados.nome}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome, usuarioEmail: administrador.email, data: new Date().toISOString() } });
    return NextResponse.json({ id });
  } catch (error) { return erro(error); }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const administrador = await exigirAdministrador(request); const { id } = await context.params; const { status } = await request.json();
    if (!["ATIVO", "INATIVO"].includes(status)) throw new Error("Status inválido.");
    const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, administrador);
    const atual = await supabase.from("perfis").select("nome").eq("id", id).eq("paroquia_id", paroquiaId).neq("perfil", "admin_plataforma").maybeSingle();
    if (atual.error || !atual.data) throw new Error("Usuário não encontrado.");
    const { error } = await supabase.from("perfis").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("paroquia_id", paroquiaId);
    if (error) throw error;
    await supabase.from("auditoria").insert({ id: randomUUID(), paroquia_id: paroquiaId, dados: { acao: status === "ATIVO" ? "ATIVAÇÃO" : "DESATIVAÇÃO", entidade: "USUÁRIOS", entidadeId: id, descricao: `Perfil ${atual.data.nome} alterado para ${status.toLowerCase()}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome, usuarioEmail: administrador.email, data: new Date().toISOString() } });
    return NextResponse.json({ id, status });
  } catch (error) { return erro(error); }
}
