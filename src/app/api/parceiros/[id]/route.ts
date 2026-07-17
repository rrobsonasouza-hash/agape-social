import { NextRequest, NextResponse } from "next/server";
import { atualizarRegistro, buscarRegistro, respostaErroOperacional } from "@/lib/supabase/operational-api";

const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador"];
type Contexto = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Contexto) {
  try { return NextResponse.json(await buscarRegistro(request, "parceiros", PERFIS, (await context.params).id)); }
  catch (error) { return respostaErroOperacional(error); }
}
export async function PATCH(request: NextRequest, context: Contexto) {
  try { const resultado = await atualizarRegistro(request, "parceiros", PERFIS, (await context.params).id); return resultado ? NextResponse.json(resultado) : NextResponse.json({ erro: "Parceiro não encontrado." }, { status: 404 }); }
  catch (error) { return respostaErroOperacional(error); }
}
