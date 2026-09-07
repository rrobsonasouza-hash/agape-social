import { NextRequest, NextResponse } from "next/server";

import {
  contextoOperacional,
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
    const { supabase, paroquiaId } = await contextoOperacional(
      request,
      PERFIS,
      true,
      "/cestas",
    );
    const { id } = await context.params;
    const alteracoes = await request.json();
    const atual = await supabase.from("campanhas_cestas").select("dados").eq("id", id).eq("paroquia_id", paroquiaId).maybeSingle();
    if (atual.error) throw atual.error;
    if (!atual.data) return NextResponse.json({ erro: "Campanha não encontrada." }, { status: 404 });
    const dadosAnteriores = campanhaCestasSchema.parse(atual.data.dados);
    const dados = campanhaCestasSchema.parse({ ...dadosAnteriores, ...alteracoes });
    const agora = new Date().toISOString();
    const atualizacao = await supabase.from("campanhas_cestas").update({ dados, updated_at: agora }).eq("id", id).eq("paroquia_id", paroquiaId);
    if (atualizacao.error) throw atualizacao.error;

    let listasRemarcadas = 0;
    const distribuicoes = await supabase.from("distribuicoes_cestas").select("id,dados").eq("paroquia_id", paroquiaId).eq("dados->>campanhaId", id).eq("dados->>status", "AGENDADA");
    if (distribuicoes.error) throw distribuicoes.error;
    const pendentes = (distribuicoes.data ?? []).filter((item) => (item.dados as Record<string, unknown>).data !== dados.dataLimite);
    if (pendentes.length) {
        const remarcacao = await supabase.from("distribuicoes_cestas").upsert(pendentes.map((item) => ({
          id: item.id,
          paroquia_id: paroquiaId,
          dados: { ...(item.dados as Record<string, unknown>), data: dados.dataLimite },
          updated_at: agora,
        })), { onConflict: "id" });
        if (remarcacao.error) {
          await supabase.from("campanhas_cestas").update({ dados: dadosAnteriores, updated_at: agora }).eq("id", id).eq("paroquia_id", paroquiaId);
          throw remarcacao.error;
        }
        listasRemarcadas = pendentes.length;
    }
    return NextResponse.json({ id, listasRemarcadas });
  } catch (error) {
    return respostaErroOperacional(error);
  }
}
