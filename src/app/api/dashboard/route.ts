import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

export async function GET(request: NextRequest) {
  try {
    const usuario = await exigirUsuarioAtivo(request);
    const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario);
    const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
    const contagem = (tabela: string, status?: string) => {
      let consulta = supabase.from(tabela).select("id", { count: "exact", head: true }).eq("paroquia_id", paroquiaId);
      if (status) consulta = consulta.eq("dados->>status", status);
      return consulta;
    };
    const [familias, familiasAtivas, familiasInativas, familiasMes, ultimas, voluntarios, voluntariosAtivos, voluntariosInativos] = await Promise.all([
      contagem("familias"), contagem("familias", "ATIVA"), contagem("familias", "INATIVA"),
      supabase.from("familias").select("id", { count: "exact", head: true }).eq("paroquia_id", paroquiaId).gte("created_at", inicioMes.toISOString()),
      supabase.from("familias").select("id,dados,created_at").eq("paroquia_id", paroquiaId).order("created_at", { ascending: false }).limit(5),
      contagem("voluntarios"), contagem("voluntarios", "ATIVO"), contagem("voluntarios", "INATIVO"),
    ]);
    const erro = [familias, familiasAtivas, familiasInativas, familiasMes, ultimas, voluntarios, voluntariosAtivos, voluntariosInativos].find((resultado) => resultado.error)?.error;
    if (erro) throw erro;
    return NextResponse.json({
      familiasAtivas: familiasAtivas.count ?? 0, familiasInativas: familiasInativas.count ?? 0, totalFamilias: familias.count ?? 0, familiasCadastradasMes: familiasMes.count ?? 0,
      voluntariosAtivos: voluntariosAtivos.count ?? 0, voluntariosInativos: voluntariosInativos.count ?? 0, totalVoluntarios: voluntarios.count ?? 0,
      ultimasFamilias: (ultimas.data ?? []).map((item) => { const dados = item.dados as Record<string, unknown>; return { id: item.id, nomeResponsavel: String(dados.nomeResponsavel || "Nome não informado"), cidade: String(dados.cidade || "Não informada"), status: dados.status === "INATIVA" ? "INATIVA" : "ATIVA", createdAt: item.created_at }; }),
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro interno.";
    const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : mensagem === "PARISH_REQUIRED" ? 409 : 500;
    return NextResponse.json({ erro: mensagem }, { status });
  }
}
