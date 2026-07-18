import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function exigirAdminPlataforma(request: NextRequest) { const usuario = await exigirUsuarioAtivo(request); if (usuario.role !== "admin_plataforma") throw new Error("FORBIDDEN"); return usuario; }
function respostaErro(error: unknown) { const mensagem = error instanceof Error ? error.message : "Erro interno."; const conflito = /already|registered|duplicate/i.test(mensagem); const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : conflito ? 409 : 400; return NextResponse.json({ erro: conflito ? "Já existe uma credencial com este e-mail." : mensagem }, { status }); }

export async function GET(request: NextRequest) {
  try {
    await exigirAdminPlataforma(request); const supabase = supabaseAdmin();
    const { data, error } = await supabase.from("perfis").select("id,nome,email,telefone,status").eq("perfil", "admin_plataforma").order("nome");
    if (error) throw error; return NextResponse.json(data ?? []);
  } catch (error) { return respostaErro(error); }
}

export async function POST(request: NextRequest) {
  try {
    await exigirAdminPlataforma(request); const entrada = await request.json(); const nome = String(entrada.nome || "").trim(); const email = String(entrada.email || "").trim().toLowerCase(); const telefone = String(entrada.telefone || "").trim();
    if (nome.length < 3 || !email.includes("@")) throw new Error("Informe nome e e-mail válidos.");
    const supabase = supabaseAdmin(); const criacao = await supabase.auth.admin.createUser({ email, password: randomBytes(32).toString("base64url"), email_confirm: true, user_metadata: { nome } });
    if (criacao.error) throw criacao.error; const id = criacao.data.user.id;
    const { error } = await supabase.from("perfis").insert({ id, paroquia_id: null, nome, email, telefone, perfil: "admin_plataforma", status: "ATIVO", observacoes: "Administrador geral da plataforma." });
    if (error) { await supabase.auth.admin.deleteUser(id); throw error; }
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) { return respostaErro(error); }
}
