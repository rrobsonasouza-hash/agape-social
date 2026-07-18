import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
import { usuarioSchema } from "@/modules/usuarios/schemas/usuario.schema";

function erro(error: unknown) {
  const mensagem = error instanceof Error ? error.message : "Erro interno.";
  const conflito = /already|registered|duplicate/i.test(mensagem);
  const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : conflito ? 409 : 400;
  return NextResponse.json({ erro: conflito ? "Já existe uma credencial com este e-mail." : mensagem }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const administrador = await exigirAdministrador(request);
    const { supabase, paroquiaId, paroquia } = await resolverParoquiaDaRequisicao(request, administrador);
    const { data, error } = await supabase.from("perfis").select("id,nome,email,telefone,perfil,status,observacoes,created_at,updated_at").eq("paroquia_id", paroquiaId).neq("perfil", "admin_plataforma").order("nome");
    if (error) throw error;
    return NextResponse.json((data ?? []).map((item) => ({ id: item.id, nome: item.nome, email: item.email, telefone: item.telefone, role: item.perfil, paroquiaId, paroquiaNome: paroquia.nome, status: item.status, observacoes: item.observacoes, createdAt: item.created_at, updatedAt: item.updated_at })));
  } catch (error) { return erro(error); }
}

export async function POST(request: NextRequest) {
  try {
    const administrador = await exigirAdministrador(request);
    const dados = usuarioSchema.parse(await request.json());
    if (dados.role === "admin_plataforma") throw new Error("O perfil Administrador da plataforma só pode ser gerenciado pela Central.");
    const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, administrador);
    const email = dados.email.trim().toLowerCase();
    const criacao = await supabase.auth.admin.createUser({ email, password: randomBytes(32).toString("base64url"), email_confirm: true, user_metadata: { nome: dados.nome } });
    if (criacao.error) throw criacao.error;
    const id = criacao.data.user.id;
    const { error } = await supabase.from("perfis").insert({ id, paroquia_id: paroquiaId, nome: dados.nome, email, telefone: dados.telefone || "", perfil: dados.role, status: "ATIVO", observacoes: dados.observacoes || "" });
    if (error) { await supabase.auth.admin.deleteUser(id); throw error; }
    await supabase.from("auditoria").insert({ id: randomUUID(), paroquia_id: paroquiaId, dados: { acao: "CADASTRO", entidade: "USUÁRIOS", entidadeId: id, descricao: `Credencial criada para ${dados.nome}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome, usuarioEmail: administrador.email, data: new Date().toISOString() } });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) { return erro(error); }
}
