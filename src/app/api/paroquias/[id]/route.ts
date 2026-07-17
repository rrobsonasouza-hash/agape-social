import { NextRequest, NextResponse } from "next/server";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolverParoquia } from "@/lib/supabase/tenant";
type Contexto = { params: Promise<{ id: string }> };
function erro(error: unknown) { const mensagem = error instanceof Error ? error.message : "Erro interno."; return NextResponse.json({ erro: mensagem }, { status: mensagem === "FORBIDDEN" ? 403 : 500 }); }

export async function GET(request: NextRequest, context: Contexto) {
  try { await exigirAdministrador(request); const { paroquia } = await resolverParoquia((await context.params).id); return NextResponse.json(paroquia); }
  catch (error) { return erro(error); }
}
export async function PUT(request: NextRequest, context: Contexto) {
  try {
    const usuario = await exigirAdministrador(request); const id = (await context.params).id;
    if (usuario.role !== "admin_plataforma" && (await resolverParoquia(usuario.paroquiaId)).paroquiaId !== id) throw new Error("FORBIDDEN");
    const dados = await request.json();
    const { error } = await supabaseAdmin().from("paroquias").update({ nome: dados.nome, endereco: { cep: dados.cep, logradouro: dados.logradouro, numero: dados.numero, complemento: dados.complemento, bairro: dados.bairro, cidade: dados.cidade, estado: dados.estado }, latitude: dados.latitude, longitude: dados.longitude, raio_atuacao_km: dados.raioAtendimentoKm, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error; return NextResponse.json({ id });
  } catch (error) { return erro(error); }
}
export async function PATCH(request: NextRequest, context: Contexto) {
  try { const usuario = await exigirAdministrador(request); if (usuario.role !== "admin_plataforma") throw new Error("FORBIDDEN"); const id = (await context.params).id; const { ativa } = await request.json(); const { error } = await supabaseAdmin().from("paroquias").update({ ativa: Boolean(ativa), updated_at: new Date().toISOString() }).eq("id", id); if (error) throw error; return NextResponse.json({ id }); }
  catch (error) { return erro(error); }
}
