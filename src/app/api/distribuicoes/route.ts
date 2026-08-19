import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { contextoOperacional, respostaErroOperacional } from "@/lib/supabase/operational-api";
import { distribuicaoSchema } from "@/modules/distribuicoes/schemas/distribuicao.schema";

const PERFIS_LEITURA = ["admin_plataforma", "admin_paroquia", "coordenador", "operador", "voluntario"];
const PERFIS_GESTAO = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];

export async function GET(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS_LEITURA, false, "/cestas");
    const dataFiltro = new URL(request.url).searchParams.get("data");
    let consulta = supabase.from("distribuicoes_cestas").select("id,dados").eq("paroquia_id", paroquiaId);
    if (dataFiltro) consulta = consulta.eq("dados->>data", dataFiltro);
    const { data, error } = await consulta;
    if (error) throw error;
    const linhas = data ?? [];
    const familiaIds = [...new Set(linhas
      .map((item) => (item.dados as Record<string, unknown>).familiaId)
      .filter((id): id is string => typeof id === "string" && Boolean(id)))];
    const familias = familiaIds.length
      ? await supabase.from("familias").select("id,dados").eq("paroquia_id", paroquiaId).in("id", familiaIds)
      : { data: [], error: null };
    if (familias.error) throw familias.error;
    const nomesAtuais = new Map((familias.data ?? []).map((familia) => [
      String(familia.id),
      String((familia.dados as Record<string, unknown>).nomeResponsavel ?? ""),
    ]));
    const registros: Array<Record<string, unknown> & { id: string }> = linhas.map((item) => {
      const dados = item.dados as Record<string, unknown>;
      const familiaId = typeof dados.familiaId === "string" ? dados.familiaId : "";
      const familiaNome = dados.status === "AGENDADA" ? nomesAtuais.get(familiaId) || dados.familiaNome : dados.familiaNome;
      return { id: String(item.id), ...dados, familiaNome };
    });
    registros.sort((a, b) => String(a.familiaNome).localeCompare(String(b.familiaNome)));
    return NextResponse.json(registros);
  } catch (error) { return respostaErroOperacional(error); }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS_GESTAO, true, "/cestas");
    const corpo = await request.json();
    const entradas = Array.isArray(corpo) ? corpo : [corpo];
    if (!entradas.length || entradas.length > 500) return NextResponse.json({ erro: "Envie entre 1 e 500 registros por vez." }, { status: 400 });
    const linhas = entradas.map((item) => ({ id: randomUUID(), paroquia_id: paroquiaId, dados: distribuicaoSchema.parse(item) }));
    const { error } = await supabase.from("distribuicoes_cestas").insert(linhas);
    if (error) throw error;
    return NextResponse.json({ ids: linhas.map((item) => item.id), id: linhas[0]?.id }, { status: 201 });
  } catch (error) { return respostaErroOperacional(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS_GESTAO, true, "/cestas");
    const { ids } = await request.json() as { ids?: string[] };
    if (!ids?.length || ids.length > 500 || ids.some((id) => typeof id !== "string" || !id.trim())) return NextResponse.json({ erro: "Informe entre 1 e 500 agendamentos válidos." }, { status: 400 });
    const { data, error } = await supabase.from("distribuicoes_cestas").delete().eq("paroquia_id", paroquiaId).eq("dados->>status", "AGENDADA").in("id", ids).select("id");
    if (error) throw error;
    return NextResponse.json({ removidas: data?.length ?? 0 });
  } catch (error) { return respostaErroOperacional(error); }
}
