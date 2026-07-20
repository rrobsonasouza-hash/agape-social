import { NextRequest, NextResponse } from "next/server";
import { criarRegistro, listarRegistros, respostaErroOperacional } from "@/lib/supabase/operational-api";
import { doadorSchema } from "@/modules/doadores/schemas/doador.schema";

const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];

export async function GET(request: NextRequest) {
  try { return NextResponse.json(await listarRegistros(request, "doadores", PERFIS, "documento")); }
  catch (error) { return respostaErroOperacional(error); }
}
export async function POST(request: NextRequest) {
  try { return NextResponse.json(await criarRegistro(request, "doadores", PERFIS, doadorSchema), { status: 201 }); }
  catch (error) { return respostaErroOperacional(error); }
}
