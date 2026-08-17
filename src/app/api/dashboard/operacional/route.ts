import { NextRequest, NextResponse } from "next/server";

import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { exigirPermissaoServidor } from "@/lib/auth/server-permissions";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

type Registro = { id: string; dados: Record<string, unknown> };

function hojeLocal() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
}

function numero(valor: unknown) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

export async function GET(request: NextRequest) {
  try {
    const usuario = await exigirUsuarioAtivo(request);
    const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(
      request,
      usuario,
    );
    await exigirPermissaoServidor(supabase, paroquiaId, usuario.role, "/dashboard", ["admin_plataforma", "admin_paroquia", "coordenador", "operador", "voluntario", "leitor"]);
    const [familias, campanhasResposta, movimentacoes, distribuicoes] =
      await Promise.all([
        supabase
          .from("familias")
          .select("id,dados")
          .eq("paroquia_id", paroquiaId),
        supabase
          .from("campanhas_cestas")
          .select("id,dados")
          .eq("paroquia_id", paroquiaId),
        supabase
          .from("movimentacoes_cestas")
          .select("id,dados")
          .eq("paroquia_id", paroquiaId),
        supabase
          .from("distribuicoes_cestas")
          .select("id,dados")
          .eq("paroquia_id", paroquiaId),
      ]);
    const erro = [
      familias,
      campanhasResposta,
      movimentacoes,
      distribuicoes,
    ].find((resultado) => resultado.error)?.error;
    if (erro) throw erro;

    const registrosFamilias = (familias.data ?? []) as Registro[];
    const registrosCampanhas = (campanhasResposta.data ?? []) as Registro[];
    const registrosMovimentacoes = (movimentacoes.data ?? []) as Registro[];
    const registrosDistribuicoes = (distribuicoes.data ?? []) as Registro[];
    const hoje = hojeLocal();
    const mesAtual = hoje.slice(0, 7);
    const cadastrosIncompletos = registrosFamilias.filter(
      ({ dados }) =>
        !dados.telefone || !dados.cidade || (!dados.cpf && !dados.rg),
    ).length;
    const cestasDisponiveis = registrosMovimentacoes.reduce(
      (total, { dados }) => {
        if (dados.tipo !== "CESTA_PRONTA") return total;
        const quantidade = numero(dados.quantidade);
        return dados.operacao === "SAIDA"
          ? total - quantidade
          : total + quantidade;
      },
      0,
    );
    const campanhas = registrosCampanhas
      .filter(({ dados }) => dados.status === "ATIVA")
      .map(({ id, dados }) => {
        const movimentos = registrosMovimentacoes.filter(
          ({ dados: movimento }) =>
            movimento.campanhaId === id && movimento.tipo === "CESTA_PRONTA",
        );
        const recebidas = movimentos
          .filter(({ dados: movimento }) => movimento.operacao !== "SAIDA")
          .reduce(
            (total, { dados: movimento }) =>
              total + numero(movimento.quantidade),
            0,
          );
        const distribuidas = movimentos
          .filter(({ dados: movimento }) => movimento.operacao === "SAIDA")
          .reduce(
            (total, { dados: movimento }) =>
              total + numero(movimento.quantidade),
            0,
          );
        return {
          id,
          nome: String(dados.nome || "Campanha sem nome"),
          metaCestas: numero(dados.metaCestas),
          recebidas,
          distribuidas,
          saldo: recebidas - distribuidas,
          dataLimite: String(dados.dataLimite || ""),
        };
      })
      .sort((primeira, segunda) =>
        primeira.dataLimite.localeCompare(segunda.dataLimite),
      );
    const agendadas = registrosDistribuicoes.filter(
      ({ dados }) => dados.status === "AGENDADA",
    );
    const proximas = agendadas.filter(
      ({ dados }) => String(dados.data || "") >= hoje,
    );
    const distribuicoesMes = registrosDistribuicoes.filter(({ dados }) =>
      String(dados.data || "").startsWith(mesAtual),
    );
    const somarQuantidade = (itens: Registro[]) =>
      itens.reduce(
        (total, { dados }) => total + numero(dados.quantidade || 1),
        0,
      );
    const formatoMes = new Intl.DateTimeFormat("pt-BR", { month: "short" });
    const distribuicoesPorMes = Array.from({ length: 6 }, (_, indice) => {
      const data = new Date();
      data.setDate(1);
      data.setMonth(data.getMonth() - (5 - indice));
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
      const itens = registrosDistribuicoes.filter(({ dados }) =>
        String(dados.data || "").startsWith(chave),
      );
      return {
        rotulo: formatoMes.format(data).replace(".", ""),
        entregues: somarQuantidade(
          itens.filter(
            ({ dados }) =>
              dados.status === "RETIRADA" ||
              dados.status === "ENTREGUE_DOMICILIO",
          ),
        ),
        ausentes: somarQuantidade(
          itens.filter(({ dados }) => dados.status === "AUSENTE"),
        ),
      };
    });

    return NextResponse.json({
      cadastrosIncompletos,
      cestasDisponiveis: Math.max(cestasDisponiveis, 0),
      campanhasAtivas: campanhas.length,
      distribuicoesAgendadas: somarQuantidade(agendadas),
      proximasDistribuicoes: somarQuantidade(proximas),
      proximaDataDistribuicao:
        proximas.map(({ dados }) => String(dados.data)).sort()[0] ?? null,
      distribuicoesEntreguesMes: somarQuantidade(
        distribuicoesMes.filter(
          ({ dados }) =>
            dados.status === "RETIRADA" ||
            dados.status === "ENTREGUE_DOMICILIO",
        ),
      ),
      distribuicoesAusentesMes: somarQuantidade(
        distribuicoesMes.filter(({ dados }) => dados.status === "AUSENTE"),
      ),
      campanhas,
      distribuicoesPorMes,
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro interno.";
    const status =
      mensagem === "UNAUTHENTICATED"
        ? 401
        : mensagem === "FORBIDDEN"
          ? 403
          : mensagem === "PARISH_REQUIRED"
            ? 409
            : 500;
    return NextResponse.json({ erro: mensagem }, { status });
  }
}
