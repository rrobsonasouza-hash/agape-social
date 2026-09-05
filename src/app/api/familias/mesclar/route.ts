import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { exigirAdministrador } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

const schema = z.object({
  manterId: z.string().uuid(),
  removerId: z.string().uuid(),
  confirmacao: z.literal("MESCLAR_DUPLICADO"),
}).refine((dados) => dados.manterId !== dados.removerId, "Selecione dois cadastros diferentes.");

export async function POST(request: NextRequest) {
  try {
    const administrador = await exigirAdministrador(request);
    const dados = schema.parse(await request.json());
    const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, administrador);
    const resultado = await supabase.rpc("mesclar_familias_duplicadas", {
      p_paroquia_id: paroquiaId,
      p_manter_id: dados.manterId,
      p_remover_id: dados.removerId,
    });
    if (resultado.error) throw resultado.error;
    return NextResponse.json(resultado.data);
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro interno.";
    const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status });
  }
}
