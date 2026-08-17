import { NextRequest, NextResponse } from "next/server";

import { atualizarRegistro, buscarRegistro, respostaErroOperacional } from "@/lib/supabase/operational-api";
import { distribuicaoSchema, statusDistribuicaoSchema } from "@/modules/distribuicoes/schemas/distribuicao.schema";

const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador", "operador", "voluntario"];
type Contexto = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Contexto) {
  try { return NextResponse.json(await buscarRegistro(request, "distribuicoes_cestas", PERFIS, (await context.params).id)); }
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
