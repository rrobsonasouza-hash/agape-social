import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { usuarioSchema } from "@/modules/usuarios/schemas/usuario.schema";

export async function POST(request: NextRequest) {
  try {
    const administrador = await exigirAdministrador(request);
    const dados = usuarioSchema.parse(await request.json());
    const conta = await adminAuth().createUser({ email: dados.email, displayName: dados.nome, password: randomBytes(24).toString("base64url"), disabled: false });
    const perfil = { ...dados, status: "ATIVO", authUid: conta.uid, createdAt: new Date(), updatedAt: new Date() };
    await adminDb().collection("usuarios").doc(conta.uid).set(perfil);
    await adminAuth().setCustomUserClaims(conta.uid, { role: dados.role, paroquiaId: dados.paroquiaId });
    await adminDb().collection("auditoria").add({ acao: "CADASTRO", entidade: "USUÁRIOS", entidadeId: conta.uid, descricao: `Credencial criada para ${dados.nome}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome || "Administrador", usuarioEmail: administrador.email || "", paroquiaId: dados.paroquiaId, data: new Date() });
    return NextResponse.json({ id: conta.uid }, { status: 201 });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro interno.";
    const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : mensagem.includes("email-already-exists") ? 409 : 400;
    return NextResponse.json({ erro: status === 409 ? "Já existe uma credencial com este e-mail." : mensagem }, { status });
  }
}
