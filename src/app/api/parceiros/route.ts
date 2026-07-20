import { NextRequest, NextResponse } from "next/server";
import { criarRegistro, listarRegistros, respostaErroOperacional } from "@/lib/supabase/operational-api";
import { parceiroSchema } from "@/modules/parceiros/schemas/parceiro.schema";

const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador"];

export async function GET(request: NextRequest) {
  try { return NextResponse.json(await listarRegistros(request, "parceiros", PERFIS, "cnpj")); }
  catch (error) { return respostaErroOperacional(error); }
}
export async function POST(request: NextRequest) {
  try { return NextResponse.json(await criarRegistro(request, "parceiros", PERFIS, parceiroSchema), { status: 201 }); }
  catch (error) { return respostaErroOperacional(error); }
}
