import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { contextoOperacional, respostaErroOperacional } from "@/lib/supabase/operational-api";
import { distribuicaoSchema } from "@/modules/distribuicoes/schemas/distribuicao.schema";

const PERFIS_LEITURA = ["admin_plataforma", "admin_paroquia", "coordenador", "operador", "voluntario"];
const PERFIS_GESTAO = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];

export async function GET(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS_LEITURA, false, "/cestas");
    const parametros = new URL(request.url).searchParams;
    const dataFiltro = parametros.get("data");
    let consulta = supabase.from("distribuicoes_cestas").select("id,dados").eq("paroquia_id", paroquiaId);
    if (dataFiltro) consulta = consulta.eq("dados->>data", dataFiltro);
    const { data, error } = await consulta;
    if (error) throw error;
    const linhas = data ?? [];
    if (parametros.get("resumo") === "datas") {
      const resumos = new Map<string, { data: string; total: number; agendadas: number; recebidas: number; ausentes: number }>();
      for (const item of linhas) {
        const dados = item.dados as Record<string, unknown>;
        const dataDistribuicao = typeof dados.data === "string" ? dados.data : "";
        if (!dataDistribuicao) continue;
        const resumo = resumos.get(dataDistribuicao) ?? { data: dataDistribuicao, total: 0, agendadas: 0, recebidas: 0, ausentes: 0 };
        resumo.total += 1;
        if (dados.status === "AGENDADA") resumo.agendadas += 1;
        else if (dados.status === "AUSENTE") resumo.ausentes += 1;
        else if (dados.status === "RETIRADA" || dados.status === "ENTREGUE_DOMICILIO") resumo.recebidas += 1;
        resumos.set(dataDistribuicao, resumo);
      }
      return NextResponse.json([...resumos.values()].sort((a, b) => b.data.localeCompare(a.data)));
    }
    const familiaIds = [...new Set(linhas
      .map((item) => (item.dados as Record<string, unknown>).familiaId)
      .filter((id): id is string => typeof id === "string" && Boolean(id)))];
    const familias = familiaIds.length
      ? await supabase.from("familias").select("id,dados").eq("paroquia_id", paroquiaId).in("id", familiaIds)
      : { data: [], error: null };
    if (familias.error) throw familias.error;
    const nomesAtuais = new Map((familias.data ?? []).map((familia) => [
      String(familia.id),
      String((familia.dados as Record<string, unknown>).nomeResponsavel ?? ""),
    ]));
    const registros: Array<Record<string, unknown> & { id: string }> = linhas.map((item) => {
      const dados = item.dados as Record<string, unknown>;
      const familiaId = typeof dados.familiaId === "string" ? dados.familiaId : "";
      const familiaNome = dados.status === "AGENDADA" ? nomesAtuais.get(familiaId) || dados.familiaNome : dados.familiaNome;
      return { id: String(item.id), ...dados, familiaNome };
    });
    registros.sort((a, b) => String(a.familiaNome).localeCompare(String(b.familiaNome)));
    return NextResponse.json(registros);
  } catch (error) { return respostaErroOperacional(error); }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS_GESTAO, true, "/cestas");
    const corpo = await request.json();
    const entradas = Array.isArray(corpo) ? corpo : [corpo];
    if (!entradas.length || entradas.length > 500) return NextResponse.json({ erro: "Envie entre 1 e 500 registros por vez." }, { status: 400 });
    const linhas = entradas.map((item) => ({ id: randomUUID(), paroquia_id: paroquiaId, dados: distribuicaoSchema.parse(item) }));
    const { error } = await supabase.from("distribuicoes_cestas").insert(linhas);
    if (error) throw error;
    return NextResponse.json({ ids: linhas.map((item) => item.id), id: linhas[0]?.id }, { status: 201 });
  } catch (error) { return respostaErroOperacional(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS_GESTAO, true, "/cestas");
    const { ids, status } = await request.json() as { ids?: string[]; status?: string };
    const idsUnicos = [...new Set(ids ?? [])];
    if (status !== "AUSENTE") return NextResponse.json({ erro: "A ação em lote permite somente registrar ausências." }, { status: 400 });
    if (!idsUnicos.length || idsUnicos.length > 500 || idsUnicos.some((id) => typeof id !== "string" || !id.trim())) {
      return NextResponse.json({ erro: "Informe entre 1 e 500 agendamentos válidos." }, { status: 400 });
    }

    const distribuicoes = await supabase.from("distribuicoes_cestas").select("id,dados").eq("paroquia_id", paroquiaId).in("id", idsUnicos);
    if (distribuicoes.error) throw distribuicoes.error;
    const pendentes = (distribuicoes.data ?? []).filter((item) => (item.dados as Record<string, unknown>).status === "AGENDADA");
    if (!pendentes.length) return NextResponse.json({ atualizadas: 0 });

    const faltasPorFamilia = new Map<string, number>();
    for (const item of pendentes) {
      const familiaId = (item.dados as Record<string, unknown>).familiaId;
      if (typeof familiaId === "string" && familiaId) faltasPorFamilia.set(familiaId, (faltasPorFamilia.get(familiaId) ?? 0) + 1);
    }
    const familias = faltasPorFamilia.size
      ? await supabase.from("familias").select("id,dados").eq("paroquia_id", paroquiaId).in("id", [...faltasPorFamilia.keys()])
      : { data: [], error: null };
    if (familias.error) throw familias.error;

    const agora = new Date().toISOString();
    const familiasAtualizadas = (familias.data ?? []).map((familia) => {
      const dados = familia.dados as Record<string, unknown>;
      const faltas = Math.max(0, Number(dados.faltasConsecutivas ?? 0)) + (faltasPorFamilia.get(String(familia.id)) ?? 0);
      return {
        id: familia.id,
        paroquia_id: paroquiaId,
        dados: {
          ...dados,
          faltasConsecutivas: faltas,
          beneficioBloqueado: faltas >= 3,
          motivoBloqueio: faltas >= 3 ? "Três ausências consecutivas na retirada de cestas." : "",
        },
        updated_at: agora,
      };
    });
    if (familiasAtualizadas.length) {
      const atualizacaoFamilias = await supabase.from("familias").upsert(familiasAtualizadas, { onConflict: "id" });
      if (atualizacaoFamilias.error) throw atualizacaoFamilias.error;
    }

    const atualizacaoDistribuicoes = await supabase.from("distribuicoes_cestas").upsert(
      pendentes.map((item) => ({
        id: item.id,
        paroquia_id: paroquiaId,
        dados: { ...(item.dados as Record<string, unknown>), status: "AUSENTE" },
        updated_at: agora,
      })),
      { onConflict: "id" },
    );
    if (atualizacaoDistribuicoes.error) throw atualizacaoDistribuicoes.error;
    return NextResponse.json({ atualizadas: pendentes.length });
  } catch (error) { return respostaErroOperacional(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS_GESTAO, true, "/cestas");
    const { ids } = await request.json() as { ids?: string[] };
    if (!ids?.length || ids.length > 500 || ids.some((id) => typeof id !== "string" || !id.trim())) return NextResponse.json({ erro: "Informe entre 1 e 500 agendamentos válidos." }, { status: 400 });
    const { data, error } = await supabase.from("distribuicoes_cestas").delete().eq("paroquia_id", paroquiaId).eq("dados->>status", "AGENDADA").in("id", ids).select("id");
    if (error) throw error;
    return NextResponse.json({ removidas: data?.length ?? 0 });
  } catch (error) { return respostaErroOperacional(error); }
}
