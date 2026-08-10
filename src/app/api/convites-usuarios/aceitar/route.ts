import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({ token: z.string().min(30), nome: z.string().trim().min(3), email: z.email().transform((value) => value.toLowerCase()), telefone: z.string().trim(), senha: z.string().min(8) });
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

async function localizarConvite(token: string) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("convites_usuarios").select("id,paroquia_id,perfil,expires_at,used_at,revoked_at,paroquias(nome)").eq("token_hash", hash(token)).maybeSingle();
  if (error) throw error;
  if (!data || data.used_at || data.revoked_at || new Date(data.expires_at) <= new Date()) throw new Error("Este convite é inválido, expirou ou já foi utilizado.");
  return { supabase, convite: data };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token") || "";
    const { convite } = await localizarConvite(token);
    const paroquia = convite.paroquias as unknown as { nome?: string } | null;
    return NextResponse.json({ paroquiaNome: paroquia?.nome || "Paróquia", role: convite.perfil, expiresAt: convite.expires_at });
  } catch (error) { return NextResponse.json({ erro: error instanceof Error ? error.message : "Convite inválido." }, { status: 400 }); }
}

export async function POST(request: NextRequest) {
  let authUserId: string | null = null;
  try {
    const dados = schema.parse(await request.json());
    const { supabase, convite } = await localizarConvite(dados.token);
    const criacao = await supabase.auth.admin.createUser({ email: dados.email, password: dados.senha, email_confirm: true, user_metadata: { nome: dados.nome } });
    if (criacao.error) throw criacao.error;
    authUserId = criacao.data.user.id;
    const { data: uso, error: usoError } = await supabase.from("convites_usuarios").update({ used_at: new Date().toISOString() }).eq("id", convite.id).is("used_at", null).is("revoked_at", null).gt("expires_at", new Date().toISOString()).select("id").maybeSingle();
    if (usoError || !uso) throw new Error("Este convite acabou de ser utilizado ou expirou.");
    const { error: perfilError } = await supabase.from("perfis").insert({ id: authUserId, paroquia_id: convite.paroquia_id, nome: dados.nome, email: dados.email, telefone: dados.telefone || "", perfil: convite.perfil, status: "ATIVO", observacoes: "Cadastro realizado por convite." });
    if (perfilError) throw perfilError;
    await supabase.from("auditoria").insert({ id: randomUUID(), paroquia_id: convite.paroquia_id, dados: { acao: "CONVITE_ACEITO", entidade: "USUARIOS", entidadeId: authUserId, descricao: `Cadastro concluído por convite: ${dados.nome}.`, data: new Date().toISOString() } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (authUserId) await supabaseAdmin().auth.admin.deleteUser(authUserId);
    return NextResponse.json({ erro: error instanceof Error ? error.message : "Não foi possível concluir o cadastro." }, { status: 400 });
  }
}
