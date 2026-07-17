import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { usuarioSchema } from "@/modules/usuarios/schemas/usuario.schema";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

export async function GET(request: NextRequest) {
  try { const administrador = await exigirAdministrador(request); const { paroquia, paroquiaId } = await resolverParoquiaDaRequisicao(request, administrador); const snapshot = await adminDb().collection("usuarios").get(); const principal = String(paroquia.slug) === "paroquia-nossa-senhora-aparecida"; const usuarios: Array<Record<string, unknown> & { id: string }> = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Record<string, unknown>) })); return NextResponse.json(usuarios.filter((item) => item.role !== "admin_plataforma" && (item.paroquiaId === paroquiaId || (principal && item.paroquiaId === "principal")))); }
  catch (error) { const mensagem = error instanceof Error ? error.message : "Erro interno."; return NextResponse.json({ erro: mensagem }, { status: mensagem === "FORBIDDEN" ? 403 : 400 }); }
}

export async function POST(request: NextRequest) {
  try {
    const administrador = await exigirAdministrador(request);
    const dados = usuarioSchema.parse(await request.json());
    if (dados.role === "admin_plataforma") throw new Error("O perfil Administrador da plataforma só pode ser gerenciado pela Central.");
    const { paroquia, paroquiaId } = await resolverParoquiaDaRequisicao(request, administrador);
    const dadosSeguros = { ...dados, paroquiaId, paroquiaNome: String(paroquia.nome) };
    const conta = await adminAuth().createUser({ email: dadosSeguros.email, displayName: dadosSeguros.nome, password: randomBytes(24).toString("base64url"), disabled: false });
    const perfil = { ...dadosSeguros, status: "ATIVO", authUid: conta.uid, createdAt: new Date(), updatedAt: new Date() };
    await adminDb().collection("usuarios").doc(conta.uid).set(perfil);
    await adminAuth().setCustomUserClaims(conta.uid, { role: dadosSeguros.role, paroquiaId });
    await adminDb().collection("auditoria").add({ acao: "CADASTRO", entidade: "USUÁRIOS", entidadeId: conta.uid, descricao: `Credencial criada para ${dadosSeguros.nome}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome || "Administrador", usuarioEmail: administrador.email || "", paroquiaId, data: new Date() });
    return NextResponse.json({ id: conta.uid }, { status: 201 });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro interno.";
    const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : mensagem.includes("email-already-exists") ? 409 : 400;
    return NextResponse.json({ erro: status === 409 ? "Já existe uma credencial com este e-mail." : mensagem }, { status });
  }
}
