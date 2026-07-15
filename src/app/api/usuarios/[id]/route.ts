import { NextRequest, NextResponse } from "next/server";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { usuarioSchema } from "@/modules/usuarios/schemas/usuario.schema";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const administrador = await exigirAdministrador(request); const { id } = await context.params; const dados = usuarioSchema.parse(await request.json());
    await adminAuth().updateUser(id, { email: dados.email, displayName: dados.nome, disabled: dados.status === "INATIVO" });
    await adminAuth().setCustomUserClaims(id, { role: dados.role, paroquiaId: dados.paroquiaId });
    await adminDb().collection("usuarios").doc(id).set({ ...dados, authUid: id, updatedAt: new Date() }, { merge: true });
    await adminDb().collection("auditoria").add({ acao: "EDIÇÃO", entidade: "USUÁRIOS", entidadeId: id, descricao: `Credencial e perfil atualizados: ${dados.nome}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome || "Administrador", usuarioEmail: administrador.email || "", paroquiaId: dados.paroquiaId, data: new Date() });
    return NextResponse.json({ id });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro interno."; const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const administrador = await exigirAdministrador(request); const { id } = await context.params; const { status } = await request.json();
    if (!["ATIVO", "INATIVO"].includes(status)) return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
    await adminAuth().updateUser(id, { disabled: status === "INATIVO" });
    const referencia = adminDb().collection("usuarios").doc(id); const perfil = await referencia.get();
    await referencia.set({ status, updatedAt: new Date() }, { merge: true });
    await adminDb().collection("auditoria").add({ acao: status === "ATIVO" ? "ATIVAÇÃO" : "DESATIVAÇÃO", entidade: "USUÁRIOS", entidadeId: id, descricao: `Perfil ${perfil.data()?.nome || id} alterado para ${status.toLowerCase()}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome || "Administrador", usuarioEmail: administrador.email || "", paroquiaId: perfil.data()?.paroquiaId || "principal", data: new Date() });
    return NextResponse.json({ id, status });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro interno."; const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status });
  }
}
