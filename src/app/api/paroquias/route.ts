import { NextRequest, NextResponse } from "next/server";
import { exigirAdministrador, exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolverParoquia } from "@/lib/supabase/tenant";

function slug(nome: string) { return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function erro(error: unknown) { const mensagem = error instanceof Error ? error.message : "Erro interno."; return NextResponse.json({ erro: mensagem }, { status: mensagem === "FORBIDDEN" ? 403 : 500 }); }

export async function GET(request: NextRequest) {
  try {
    const usuario = await exigirUsuarioAtivo(request);
    if (new URL(request.url).searchParams.get("atual") === "1") { const { paroquia } = await resolverParoquia(usuario.paroquiaId); return NextResponse.json([paroquia]); }
    if (usuario.role === "admin_plataforma") { const { data, error } = await supabaseAdmin().from("paroquias").select("*").order("nome"); if (error) throw error; return NextResponse.json(data); }
    const { paroquia } = await resolverParoquia(usuario.paroquiaId);
    return NextResponse.json([paroquia]);
  } catch (error) { return erro(error); }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await exigirAdministrador(request);
    if (usuario.role !== "admin_plataforma") throw new Error("FORBIDDEN");
    const dados = await request.json();
    const { data, error } = await supabaseAdmin().from("paroquias").insert({ nome: dados.nome, slug: slug(dados.nome), ativa: true, endereco: { cep: dados.cep, logradouro: dados.logradouro, numero: dados.numero, complemento: dados.complemento, bairro: dados.bairro, cidade: dados.cidade, estado: dados.estado }, latitude: dados.latitude, longitude: dados.longitude, raio_atuacao_km: dados.raioAtendimentoKm }).select("id").single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) { return erro(error); }
}
