import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { contextoOperacional, respostaErroOperacional } from "@/lib/supabase/operational-api";
const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador", "operador", "voluntario"];
export async function GET(request: NextRequest) {
  try { const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS); const dataFiltro = new URL(request.url).searchParams.get("data"); let consulta = supabase.from("distribuicoes_cestas").select("id,dados").eq("paroquia_id", paroquiaId); if (dataFiltro) consulta = consulta.eq("dados->>data", dataFiltro); const { data, error } = await consulta; if (error) throw error; const registros: Array<Record<string, unknown> & { id: string }> = (data ?? []).map((item) => ({ id: String(item.id), ...(item.dados as Record<string, unknown>) })); registros.sort((a, b) => String(a.familiaNome).localeCompare(String(b.familiaNome))); return NextResponse.json(registros); }
  catch (error) { return respostaErroOperacional(error); }
}
export async function POST(request: NextRequest) {
  try { const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS, true); const corpo = await request.json(); const registros = Array.isArray(corpo) ? corpo : [corpo]; const linhas = registros.map((dados) => ({ id: randomUUID(), paroquia_id: paroquiaId, dados })); const { error } = await supabase.from("distribuicoes_cestas").insert(linhas); if (error) throw error; return NextResponse.json({ ids: linhas.map((item) => item.id), id: linhas[0]?.id }, { status: 201 }); }
  catch (error) { return respostaErroOperacional(error); }
}
