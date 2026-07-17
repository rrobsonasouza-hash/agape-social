import { NextRequest, NextResponse } from "next/server";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { usuarioSchema } from "@/modules/usuarios/schemas/usuario.schema";
import { resolverParoquia, resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const administrador = await exigirAdministrador(request); const { id } = await context.params; const dados = usuarioSchema.parse(await request.json());
    if (dados.role === "admin_plataforma") throw new Error("O perfil Administrador da plataforma só pode ser gerenciado pela Central.");
    const { paroquia, paroquiaId } = await resolverParoquiaDaRequisicao(request, administrador); const atual = await adminDb().collection("usuarios").doc(id).get(); if (!atual.exists) throw new Error("Usuário não encontrado."); const atualParoquia = await resolverParoquia(String(atual.data()?.paroquiaId || "principal")); if (atualParoquia.paroquiaId !== paroquiaId) throw new Error("FORBIDDEN"); const dadosSeguros = { ...dados, paroquiaId, paroquiaNome: String(paroquia.nome) };
    await adminAuth().updateUser(id, { email: dadosSeguros.email, displayName: dadosSeguros.nome, disabled: dadosSeguros.status === "INATIVO" });
    await adminAuth().setCustomUserClaims(id, { role: dadosSeguros.role, paroquiaId });
    await adminDb().collection("usuarios").doc(id).set({ ...dadosSeguros, authUid: id, updatedAt: new Date() }, { merge: true });
    await adminDb().collection("auditoria").add({ acao: "EDIÇÃO", entidade: "USUÁRIOS", entidadeId: id, descricao: `Credencial e perfil atualizados: ${dadosSeguros.nome}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome || "Administrador", usuarioEmail: administrador.email || "", paroquiaId, data: new Date() });
    return NextResponse.json({ id });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro interno."; const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const administrador = await exigirAdministrador(request); const { id } = await context.params; const { status } = await request.json(); const { paroquiaId } = await resolverParoquiaDaRequisicao(request, administrador);
    if (!["ATIVO", "INATIVO"].includes(status)) return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
    const referencia = adminDb().collection("usuarios").doc(id); const perfil = await referencia.get(); if (!perfil.exists) throw new Error("Usuário não encontrado."); const perfilParoquia = await resolverParoquia(String(perfil.data()?.paroquiaId || "principal")); if (perfilParoquia.paroquiaId !== paroquiaId) throw new Error("FORBIDDEN");
    await adminAuth().updateUser(id, { disabled: status === "INATIVO" });
    await referencia.set({ status, updatedAt: new Date() }, { merge: true });
    await adminDb().collection("auditoria").add({ acao: status === "ATIVO" ? "ATIVAÇÃO" : "DESATIVAÇÃO", entidade: "USUÁRIOS", entidadeId: id, descricao: `Perfil ${perfil.data()?.nome || id} alterado para ${status.toLowerCase()}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome || "Administrador", usuarioEmail: administrador.email || "", paroquiaId: perfil.data()?.paroquiaId || "principal", data: new Date() });
    return NextResponse.json({ id, status });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro interno."; const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status });
  }
}
