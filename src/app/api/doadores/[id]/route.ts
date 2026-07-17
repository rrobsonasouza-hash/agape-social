import { NextRequest, NextResponse } from "next/server";
import { atualizarRegistro, buscarRegistro, respostaErroOperacional } from "@/lib/supabase/operational-api";

const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];
type Contexto = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Contexto) {
  try { return NextResponse.json(await buscarRegistro(request, "doadores", PERFIS, (await context.params).id)); }
  catch (error) { return respostaErroOperacional(error); }
}
export async function PATCH(request: NextRequest, context: Contexto) {
  try { const resultado = await atualizarRegistro(request, "doadores", PERFIS, (await context.params).id); return resultado ? NextResponse.json(resultado) : NextResponse.json({ erro: "Doador não encontrado." }, { status: 404 }); }
  catch (error) { return respostaErroOperacional(error); }
}
