import { NextRequest, NextResponse } from "next/server";
import { atualizarRegistro, respostaErroOperacional } from "@/lib/supabase/operational-api";
import { visitaSchema } from "@/modules/visitas/schemas/visita.schema";

const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador", "operador", "voluntario"];

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const resultado = await atualizarRegistro(request, "visitas", PERFIS, (await context.params).id, visitaSchema);
    return resultado ? NextResponse.json(resultado) : NextResponse.json({ erro: "Visita não encontrada." }, { status: 404 });
  } catch (error) { return respostaErroOperacional(error); }
}
