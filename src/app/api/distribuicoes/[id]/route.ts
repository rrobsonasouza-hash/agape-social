import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  contextoOperacional,
  respostaErroOperacional,
} from "@/lib/supabase/operational-api";
import { familiaSchema } from "@/modules/familias/schemas/familia.schema";
import {
  distribuicaoSchema,
  statusDistribuicaoSchema,
} from "@/modules/distribuicoes/schemas/distribuicao.schema";

const PERFIS = [
  "admin_plataforma",
  "admin_paroquia",
  "coordenador",
  "operador",
  "voluntario",
];
type Contexto = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Contexto) {
  try {
    const { supabase, paroquiaId } = await contextoOperacional(
      request,
      PERFIS,
      false,
      "/cestas",
    );
    const { id } = await context.params;
    const consulta = await supabase
      .from("distribuicoes_cestas")
      .select("id,dados")
      .eq("id", id)
      .eq("paroquia_id", paroquiaId)
      .maybeSingle();
    if (consulta.error) throw consulta.error;
    if (!consulta.data) return NextResponse.json(null);
    const dados = consulta.data.dados as Record<string, unknown>;
    let familiaNome = dados.familiaNome;
    if (dados.status === "AGENDADA" && typeof dados.familiaId === "string") {
      const familia = await supabase
        .from("familias")
        .select("dados")
        .eq("id", dados.familiaId)
        .eq("paroquia_id", paroquiaId)
        .maybeSingle();
      if (familia.error) throw familia.error;
      const nomeAtual = (
        familia.data?.dados as Record<string, unknown> | undefined
      )?.nomeResponsavel;
      if (typeof nomeAtual === "string" && nomeAtual.trim())
        familiaNome = nomeAtual;
    }
    return NextResponse.json({ id: consulta.data.id, ...dados, familiaNome });
  } catch (error) {
    return respostaErroOperacional(error);
  }
}

export async function PATCH(request: NextRequest, context: Contexto) {
  try {
    const { supabase, paroquiaId } = await contextoOperacional(
      request,
      PERFIS,
      true,
      "/cestas",
    );
    const corpo = (await request.json()) as Record<string, unknown>;
    if (Object.keys(corpo).length !== 1 || !("status" in corpo)) {
      return NextResponse.json(
        { erro: "Somente o status da distribuição pode ser alterado." },
        { status: 400 },
      );
    }
    const novoStatus = statusDistribuicaoSchema.parse(corpo.status);
    const { id } = await context.params;
    const consulta = await supabase
      .from("distribuicoes_cestas")
      .select("id,dados")
      .eq("id", id)
      .eq("paroquia_id", paroquiaId)
      .maybeSingle();
    if (consulta.error) throw consulta.error;
    if (!consulta.data) {
      return NextResponse.json(
        { erro: "Distribuição não encontrada." },
        { status: 404 },
      );
    }

    const atual = distribuicaoSchema.parse(consulta.data.dados);
    if (atual.status === novoStatus) return NextResponse.json({ id });
    const concluindo =
      atual.status === "AGENDADA" &&
      ["RETIRADA", "ENTREGUE_DOMICILIO", "AUSENTE"].includes(novoStatus);
    const desfazendo =
      novoStatus === "AGENDADA" &&
      ["RETIRADA", "ENTREGUE_DOMICILIO"].includes(atual.status);
    if (!concluindo && !desfazendo) {
      return NextResponse.json(
        { erro: "Esta alteração de status não é permitida." },
        { status: 409 },
      );
    }

    const familia = await supabase
      .from("familias")
      .select("id,dados")
      .eq("id", atual.familiaId)
      .eq("paroquia_id", paroquiaId)
      .maybeSingle();
    if (familia.error) throw familia.error;
    if (!familia.data) {
      return NextResponse.json(
        { erro: "Família não encontrada." },
        { status: 404 },
      );
    }
    const dadosFamilia = familiaSchema.parse(familia.data.dados);
    const agora = new Date().toISOString();

    if (novoStatus === "RETIRADA" || novoStatus === "ENTREGUE_DOMICILIO") {
      const movimentos = await supabase
        .from("movimentacoes_cestas")
        .select("dados")
        .eq("paroquia_id", paroquiaId)
        .eq("dados->>campanhaId", atual.campanhaId);
      if (movimentos.error) throw movimentos.error;
      const saldo = (movimentos.data ?? []).reduce((total, item) => {
        const dados = item.dados as Record<string, unknown>;
        if (dados.tipo !== "CESTA_PRONTA") return total;
        const quantidade = Number(dados.quantidade ?? 0);
        return total + (dados.operacao === "SAIDA" ? -quantidade : quantidade);
      }, 0);
      if (atual.quantidade > saldo) {
        return NextResponse.json(
          { erro: "Não há cestas prontas suficientes." },
          { status: 409 },
        );
      }
      const movimento = {
        campanhaId: atual.campanhaId,
        tipo: "CESTA_PRONTA",
        origem: "COMPRA_PAROQUIA",
        operacao: "SAIDA",
        doadorId: "",
        doadorNome: "",
        itemId: "",
        itemNome: "",
        quantidade: atual.quantidade,
        unidade: "cesta",
        valorTotal: 0,
        data: agora.slice(0, 10),
        observacoes: "Cesta entregue à família.",
        familiaId: atual.familiaId,
        familiaNome: dadosFamilia.nomeResponsavel,
      };
      const insercao = await supabase.from("movimentacoes_cestas").insert({
        id: randomUUID(),
        paroquia_id: paroquiaId,
        dados: movimento,
      });
      if (insercao.error) throw insercao.error;
      dadosFamilia.beneficioBloqueado = false;
      dadosFamilia.faltasConsecutivas = 0;
      dadosFamilia.motivoBloqueio = "";
    } else if (novoStatus === "AUSENTE") {
      const faltas = (dadosFamilia.faltasConsecutivas ?? 0) + 1;
      dadosFamilia.faltasConsecutivas = faltas;
      dadosFamilia.beneficioBloqueado = faltas >= 3;
      dadosFamilia.motivoBloqueio =
        faltas >= 3
          ? "Três ausências consecutivas na retirada de cestas."
          : "";
    } else if (desfazendo) {
      const insercao = await supabase.from("movimentacoes_cestas").insert({
        id: randomUUID(),
        paroquia_id: paroquiaId,
        dados: {
          campanhaId: atual.campanhaId,
          tipo: "CESTA_PRONTA",
          origem: "COMPRA_PAROQUIA",
          operacao: "ENTRADA",
          doadorId: "",
          doadorNome: "",
          itemId: "",
          itemNome: "",
          quantidade: atual.quantidade,
          unidade: "cesta",
          valorTotal: 0,
          data: agora.slice(0, 10),
          observacoes: `Estorno de baixa de entrega para ${dadosFamilia.nomeResponsavel}.`,
          familiaId: "",
          familiaNome: "",
        },
      });
      if (insercao.error) throw insercao.error;
    }

    const atualizacaoFamilia = await supabase
      .from("familias")
      .update({ dados: dadosFamilia, updated_at: agora })
      .eq("id", atual.familiaId)
      .eq("paroquia_id", paroquiaId);
    if (atualizacaoFamilia.error) throw atualizacaoFamilia.error;

    const atualizacaoDistribuicao = await supabase
      .from("distribuicoes_cestas")
      .update({ dados: { ...atual, status: novoStatus }, updated_at: agora })
      .eq("id", id)
      .eq("paroquia_id", paroquiaId);
    if (atualizacaoDistribuicao.error) throw atualizacaoDistribuicao.error;
    return NextResponse.json({ id, status: novoStatus });
  } catch (error) {
    return respostaErroOperacional(error);
  }
}
