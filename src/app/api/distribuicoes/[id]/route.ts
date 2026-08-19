import { NextRequest, NextResponse } from "next/server";

import { atualizarRegistro, contextoOperacional, respostaErroOperacional } from "@/lib/supabase/operational-api";
import { distribuicaoSchema, statusDistribuicaoSchema } from "@/modules/distribuicoes/schemas/distribuicao.schema";

const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador", "operador", "voluntario"];
type Contexto = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Contexto) {
  try {
    const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS, false, "/cestas");
    const { id } = await context.params;
    const consulta = await supabase.from("distribuicoes_cestas").select("id,dados").eq("id", id).eq("paroquia_id", paroquiaId).maybeSingle();
    if (consulta.error) throw consulta.error;
    if (!consulta.data) return NextResponse.json(null);
    const dados = consulta.data.dados as Record<string, unknown>;
    let familiaNome = dados.familiaNome;
    if (dados.status === "AGENDADA" && typeof dados.familiaId === "string") {
      const familia = await supabase.from("familias").select("dados").eq("id", dados.familiaId).eq("paroquia_id", paroquiaId).maybeSingle();
      if (familia.error) throw familia.error;
      const nomeAtual = (familia.data?.dados as Record<string, unknown> | undefined)?.nomeResponsavel;
      if (typeof nomeAtual === "string" && nomeAtual.trim()) familiaNome = nomeAtual;
    }
    return NextResponse.json({ id: consulta.data.id, ...dados, familiaNome });
  }
  catch (error) { return respostaErroOperacional(error); }
}

export async function PATCH(request: NextRequest, context: Contexto) {
  try {
    const corpo = await request.json() as Record<string, unknown>;
    if (Object.keys(corpo).length !== 1 || !("status" in corpo)) return NextResponse.json({ erro: "Somente o status da distribuição pode ser alterado." }, { status: 400 });
    const status = statusDistribuicaoSchema.parse(corpo.status);
    const requisicaoValidada = new NextRequest(request.url, { method: "PATCH", headers: request.headers, body: JSON.stringify({ status }) });
    const resultado = await atualizarRegistro(requisicaoValidada, "distribuicoes_cestas", PERFIS, (await context.params).id, distribuicaoSchema);
    return resultado ? NextResponse.json(resultado) : NextResponse.json({ erro: "Distribuição não encontrada." }, { status: 404 });
  } catch (error) { return respostaErroOperacional(error); }
}
