import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function exigirAdminPlataforma(request: NextRequest) { const usuario = await exigirUsuarioAtivo(request); if (usuario.role !== "admin_plataforma") throw new Error("FORBIDDEN"); return usuario; }
function respostaErro(error: unknown) { const mensagem = error instanceof Error ? error.message : "Erro interno."; const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : mensagem.includes("email-already-exists") ? 409 : 400; return NextResponse.json({ erro: status === 409 ? "Já existe uma credencial com este e-mail." : mensagem }, { status }); }

export async function GET(request: NextRequest) {
  try { await exigirAdminPlataforma(request); const snapshot = await adminDb().collection("usuarios").where("role", "==", "admin_plataforma").get(); return NextResponse.json(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))); }
  catch (error) { return respostaErro(error); }
}

export async function POST(request: NextRequest) {
  try { const administrador = await exigirAdminPlataforma(request); const entrada = await request.json(); const nome = String(entrada.nome || "").trim(); const email = String(entrada.email || "").trim().toLowerCase(); const telefone = String(entrada.telefone || "").trim(); if (nome.length < 3 || !email.includes("@")) throw new Error("Informe nome e e-mail válidos."); const conta = await adminAuth().createUser({ email, displayName: nome, password: randomBytes(24).toString("base64url"), disabled: false }); const perfil = { nome, email, telefone, role: "admin_plataforma", paroquiaId: "principal", paroquiaNome: "Todas as paróquias", status: "ATIVO", observacoes: "Administrador geral da plataforma.", authUid: conta.uid, createdAt: new Date(), updatedAt: new Date() }; await adminDb().collection("usuarios").doc(conta.uid).set(perfil); await adminAuth().setCustomUserClaims(conta.uid, { role: "admin_plataforma", paroquiaId: "principal" }); await adminDb().collection("auditoria").add({ acao: "CADASTRO", entidade: "ADMINISTRADORES_PLATAFORMA", entidadeId: conta.uid, descricao: `Administrador geral criado: ${nome}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome, usuarioEmail: administrador.email, paroquiaId: "plataforma", data: new Date() }); return NextResponse.json({ id: conta.uid }, { status: 201 }); }
  catch (error) { return respostaErro(error); }
}
