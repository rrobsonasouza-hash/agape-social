import { RelatorioRepository } from "../repositories/relatorio.repository";
import { RelatorioMensal } from "../types/relatorio-mensal";

export class RelatorioService {
  private repository = new RelatorioRepository();

  async gerarMensal(mes: string): Promise<RelatorioMensal> {
    if (!/^\d{4}-\d{2}$/.test(mes)) throw new Error("Período inválido.");
    const dados = await this.repository.carregar();
    const noMes = (data?: string) => data?.startsWith(mes) ?? false;
    const distribuicoes = dados.distribuicoes.filter((item) => noMes(item.data));
    const movimentos = dados.movimentos.filter((item) => noMes(item.data));
    const recebimentos = distribuicoes.filter(
      (item) => item.status === "RETIRADA" || item.status === "ENTREGUE_DOMICILIO"
    );
    const saidas = movimentos.filter(
      (item) => item.tipo === "CESTA_PRONTA" && item.operacao === "SAIDA"
    );
    const nomesFamilias = new Map(dados.familias.map((item) => [item.id, item.nomeResponsavel]));
    const faltasPorFamilia = new Map<string, number>();
    distribuicoes
      .filter((item) => item.status === "AUSENTE")
      .forEach((item) =>
        faltasPorFamilia.set(item.familiaId, (faltasPorFamilia.get(item.familiaId) ?? 0) + 1)
      );

    const campanhas = dados.campanhas.map((campanha) => {
      const movimentosCampanha = movimentos.filter((item) => item.campanhaId === campanha.id);
      const produzidas = movimentosCampanha
        .filter((item) => item.tipo === "CESTA_PRONTA" && item.operacao !== "SAIDA")
        .reduce((total, item) => total + item.quantidade, 0);
      const entregues = movimentosCampanha
        .filter((item) => item.tipo === "CESTA_PRONTA" && item.operacao === "SAIDA")
        .reduce((total, item) => total + item.quantidade, 0);
      return {
        id: campanha.id,
        nome: campanha.nome,
        meta: campanha.metaCestas,
        cestasProduzidas: produzidas,
        cestasEntregues: entregues,
        percentual: campanha.metaCestas > 0 ? Math.min((produzidas / campanha.metaCestas) * 100, 100) : 0,
      };
    }).filter((campanha) => campanha.cestasProduzidas > 0 || campanha.cestasEntregues > 0);

    return {
      familiasAtendidas: new Set(recebimentos.map((item) => item.familiaId)).size,
      cestasEntregues: saidas.reduce((total, item) => total + item.quantidade, 0),
      ausencias: distribuicoes.filter((item) => item.status === "AUSENTE").length,
      familiasBloqueadas: dados.familias.filter((item) => item.beneficioBloqueado).length,
      visitasRealizadas: dados.visitas.filter((item) => item.status === "REALIZADA" && noMes(item.data)).length,
      investimentoParoquia: movimentos
        .filter((item) => item.origem === "COMPRA_PAROQUIA" && item.operacao !== "SAIDA")
        .reduce((total, item) => total + (item.valorTotal ?? 0), 0),
      entradasPorDoacao: movimentos.filter((item) => item.origem === "DOACAO" && item.operacao !== "SAIDA").length,
      campanhas,
      familiasComAusencias: [...faltasPorFamilia.entries()]
        .map(([familiaId, quantidade]) => ({
          familiaId,
          nome: nomesFamilias.get(familiaId) ?? "Família não encontrada",
          quantidade,
        }))
        .sort((a, b) => b.quantidade - a.quantidade),
      familiasBloqueadasDetalhes: dados.familias
        .filter((item) => item.beneficioBloqueado)
        .map((item) => ({
          id: item.id,
          nome: item.nomeResponsavel,
          faltas: item.faltasConsecutivas ?? 0,
        })),
    };
  }
}
