import { NextRequest, NextResponse } from "next/server";
import { contextoOperacional, criarRegistro, respostaErroOperacional } from "@/lib/supabase/operational-api";

const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador", "operador", "voluntario"];

export async function GET(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS);
    const familiaId = new URL(request.url).searchParams.get("familiaId");
    let consulta = supabase.from("visitas").select("id,dados").eq("paroquia_id", paroquiaId);
    if (familiaId) consulta = consulta.eq("dados->>familiaId", familiaId);
    const { data, error } = await consulta;
    if (error) throw error;
    const visitas: Array<Record<string, unknown> & { id: string }> = (data ?? []).map((item) => ({ id: String(item.id), ...(item.dados as Record<string, unknown>) }));
    visitas.sort((a, b) => `${String(b.data)}T${String(b.horario)}`.localeCompare(`${String(a.data)}T${String(a.horario)}`));
    return NextResponse.json(visitas);
  } catch (error) { return respostaErroOperacional(error); }
}

export async function POST(request: NextRequest) {
  try { return NextResponse.json(await criarRegistro(request, "visitas", PERFIS), { status: 201 }); }
  catch (error) { return respostaErroOperacional(error); }
}
