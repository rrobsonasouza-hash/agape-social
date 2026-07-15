import { EstoqueRepository } from "../repositories/estoque.repository";
import { ResumoEstoque } from "../types/estoque.types";

export class EstoqueService {
  private repository = new EstoqueRepository();

  async obterResumo(): Promise<ResumoEstoque> {
    const { composicao, movimentos } = await this.repository.carregar();
    const sinal = (operacao?: string) => (operacao === "SAIDA" ? -1 : 1);
    const saldos = new Map<string, number>();

    movimentos
      .filter((item) => item.tipo === "ITEM_AVULSO")
      .forEach((item) =>
        saldos.set(
          item.itemId ?? "",
          (saldos.get(item.itemId ?? "") ?? 0) +
            item.quantidade * sinal(item.operacao)
        )
      );

    const coberturas = composicao.map((item) =>
      Math.floor((saldos.get(item.id) ?? 0) / item.quantidade)
    );
    const cestasMontaveis = coberturas.length ? Math.max(Math.min(...coberturas), 0) : 0;
    const itensComposicao = composicao.map((item, indice) => ({
      id: item.id,
      nome: item.nome,
      unidade: item.unidade,
      saldo: saldos.get(item.id) ?? 0,
      necessarioPorCesta: item.quantidade,
      coberturaCestas: Math.max(coberturas[indice], 0),
      limitante: coberturas[indice] === cestasMontaveis,
    }));
    const idsComposicao = new Set(composicao.map((item) => item.id));
    const itensForaDaComposicao = new Map<string, { nome: string; unidade: string }>();
    movimentos
      .filter(
        (item) =>
          item.tipo === "ITEM_AVULSO" &&
          Boolean(item.itemId) &&
          !idsComposicao.has(item.itemId ?? "")
      )
      .forEach((item) =>
        itensForaDaComposicao.set(item.itemId ?? "", {
          nome: item.itemNome || "Item sem identificação",
          unidade: item.unidade || "unidade",
        })
      );
    const itens = [
      ...itensComposicao,
      ...Array.from(itensForaDaComposicao, ([id, item]) => ({
        id,
        ...item,
        saldo: saldos.get(id) ?? 0,
        necessarioPorCesta: 0,
        coberturaCestas: 0,
        limitante: false,
      })),
    ];
    const cestasProntas = movimentos
      .filter((item) => item.tipo === "CESTA_PRONTA")
      .reduce(
        (total, item) => total + item.quantidade * sinal(item.operacao),
        0
      );

    return {
      itens,
      cestasProntas: Math.max(cestasProntas, 0),
      cestasMontaveis,
      totalDisponivel: Math.max(cestasProntas, 0) + cestasMontaveis,
      investimentoAcumulado: movimentos
        .filter(
          (item) =>
            item.origem === "COMPRA_PAROQUIA" &&
            item.operacao !== "SAIDA"
        )
        .reduce((total, item) => total + (item.valorTotal ?? 0), 0),
      movimentos: [...movimentos].sort((a, b) => b.data.localeCompare(a.data)),
    };
  }
}
