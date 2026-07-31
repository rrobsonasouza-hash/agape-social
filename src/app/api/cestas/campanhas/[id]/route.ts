import { NextRequest, NextResponse } from "next/server";

import {
  atualizarRegistro,
  respostaErroOperacional,
} from "@/lib/supabase/operational-api";
import { campanhaCestasSchema } from "@/modules/cestas/schemas/cestas.schema";

const PERFIS = [
  "admin_plataforma",
  "admin_paroquia",
  "coordenador",
  "operador",
];
type Contexto = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Contexto) {
  try {
    const resultado = await atualizarRegistro(
      request,
      "campanhas_cestas",
      PERFIS,
      (await context.params).id,
      campanhaCestasSchema,
    );
    return resultado
      ? NextResponse.json(resultado)
      : NextResponse.json(
          { erro: "Campanha não encontrada." },
          { status: 404 },
        );
  } catch (error) {
    return respostaErroOperacional(error);
  }
}
