import { RelatorioRepository } from "../repositories/relatorio.repository";
import { RelatorioMensal } from "../types/relatorio-mensal";

export class RelatorioService {
  private repository = new RelatorioRepository();

  async gerarMensal(mes: string): Promise<RelatorioMensal> {
    if (!/^\d{4}-\d{2}$/.test(mes)) throw new Error("Período inválido.");
    const dados = await this.repository.carregar();
    const [ano, numeroMes] = mes.split("-").map(Number);
    const fimDoMes = new Date(ano, numeroMes, 0).toISOString().slice(0, 10);
    const hoje = new Date().toISOString().slice(0, 10);
    const dataCorte = fimDoMes < hoje ? fimDoMes : hoje;
    const noMes = (data?: string) => data?.startsWith(mes) ?? false;
    const distribuicoes = dados.distribuicoes.filter((item) => noMes(item.data));
    const distribuicoesAteCorte = dados.distribuicoes
      .filter((item) => item.data <= dataCorte)
      .sort((a, b) => a.data.localeCompare(b.data));
    const movimentos = dados.movimentos.filter((item) => noMes(item.data));
    const recebimentos = distribuicoes.filter(
      (item) => item.status === "RETIRADA" || item.status === "ENTREGUE_DOMICILIO",
    );
    const saidas = movimentos.filter(
      (item) => item.tipo === "CESTA_PRONTA" && item.operacao === "SAIDA",
    );
    const nomesFamilias = new Map(
      dados.familias.map((item) => [item.id, item.nomeResponsavel]),
    );
    const faltasNoMesPorFamilia = new Map<string, number>();
    distribuicoes
      .filter((item) => item.status === "AUSENTE")
      .forEach((item) =>
        faltasNoMesPorFamilia.set(
          item.familiaId,
          (faltasNoMesPorFamilia.get(item.familiaId) ?? 0) + 1,
        ),
      );

    const historicoPorFamilia = new Map<
      string,
      { total: number; consecutivas: number; ultimaAusencia: string }
    >();
    distribuicoesAteCorte.forEach((item) => {
      const historico = historicoPorFamilia.get(item.familiaId) ?? {
        total: 0,
        consecutivas: 0,
        ultimaAusencia: "",
      };
      if (item.status === "AUSENTE") {
        historico.total += 1;
        historico.consecutivas += 1;
        historico.ultimaAusencia = item.data;
      } else if (
        item.status === "RETIRADA" ||
        item.status === "ENTREGUE_DOMICILIO"
      ) {
        historico.consecutivas = 0;
      }
      historicoPorFamilia.set(item.familiaId, historico);
    });
    const historicosComFalta = [...historicoPorFamilia.entries()].filter(
      ([, item]) => item.total > 0,
    );
    const ausenciasNoMes = distribuicoes.filter(
      (item) => item.status === "AUSENTE",
    ).length;
    const lancamentosConcluidos = recebimentos.length + ausenciasNoMes;

    const campanhas = dados.campanhas
      .map((campanha) => {
        const movimentosCampanha = movimentos.filter(
          (item) => item.campanhaId === campanha.id,
        );
        const produzidas = movimentosCampanha
          .filter(
            (item) =>
              item.tipo === "CESTA_PRONTA" && item.operacao !== "SAIDA",
          )
          .reduce((total, item) => total + item.quantidade, 0);
        const entregues = movimentosCampanha
          .filter(
            (item) =>
              item.tipo === "CESTA_PRONTA" && item.operacao === "SAIDA",
          )
          .reduce((total, item) => total + item.quantidade, 0);
        return {
          id: campanha.id,
          nome: campanha.nome,
          meta: campanha.metaCestas,
          cestasProduzidas: produzidas,
          cestasEntregues: entregues,
          percentual:
            campanha.metaCestas > 0
              ? Math.min((produzidas / campanha.metaCestas) * 100, 100)
              : 0,
        };
      })
      .filter(
        (campanha) =>
          campanha.cestasProduzidas > 0 || campanha.cestasEntregues > 0,
      );

    return {
      dataCorte,
      familiasAtendidas: new Set(recebimentos.map((item) => item.familiaId))
        .size,
      cestasEntregues: saidas.reduce(
        (total, item) => total + item.quantidade,
        0,
      ),
      ausencias: ausenciasNoMes,
      faltasAcumuladas: historicosComFalta.reduce(
        (total, [, item]) => total + item.total,
        0,
      ),
      taxaComparecimento:
        lancamentosConcluidos > 0
          ? (recebimentos.length / lancamentosConcluidos) * 100
          : 0,
      familiasEmAlerta: historicosComFalta.filter(
        ([, item]) => item.consecutivas === 1,
      ).length,
      familiasProximasBloqueio: historicosComFalta.filter(
        ([, item]) => item.consecutivas === 2,
      ).length,
      pendenciasDeBaixa: distribuicoesAteCorte.filter(
        (item) => item.status === "AGENDADA",
      ).length,
      familiasBloqueadas: historicosComFalta.filter(
        ([, item]) => item.consecutivas >= 3,
      ).length,
      visitasRealizadas: dados.visitas.filter(
        (item) => item.status === "REALIZADA" && noMes(item.data),
      ).length,
      investimentoParoquia: movimentos
        .filter(
          (item) =>
            item.origem === "COMPRA_PAROQUIA" && item.operacao !== "SAIDA",
        )
        .reduce((total, item) => total + (item.valorTotal ?? 0), 0),
      entradasPorDoacao: movimentos.filter(
        (item) => item.origem === "DOACAO" && item.operacao !== "SAIDA",
      ).length,
      campanhas,
      familiasComAusencias: historicosComFalta
        .map(([familiaId, historico]) => ({
          familiaId,
          nome: nomesFamilias.get(familiaId) ?? "Família não encontrada",
          quantidadeNoMes: faltasNoMesPorFamilia.get(familiaId) ?? 0,
          totalAteCorte: historico.total,
          consecutivas: historico.consecutivas,
          ultimaAusencia: historico.ultimaAusencia,
        }))
        .sort(
          (a, b) =>
            b.consecutivas - a.consecutivas ||
            b.totalAteCorte - a.totalAteCorte ||
            a.nome.localeCompare(b.nome, "pt-BR"),
        ),
      familiasBloqueadasDetalhes: historicosComFalta
        .filter(([, item]) => item.consecutivas >= 3)
        .map(([familiaId, item]) => ({
          id: familiaId,
          nome: nomesFamilias.get(familiaId) ?? "Família não encontrada",
          faltas: item.consecutivas,
        }))
        .sort(
          (a, b) =>
            b.faltas - a.faltas || a.nome.localeCompare(b.nome, "pt-BR"),
        ),
    };
  }
}
