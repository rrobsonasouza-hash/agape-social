import { CestasRepository } from "../repositories/cestas.repository";
import { campanhaCestasSchema, CampanhaCestasData, movimentacaoCestasSchema, MovimentacaoCestasData } from "../schemas/cestas.schema";
import { ItemCestaPadrao, MovimentacaoCestas } from "../types/cestas.types";

export class CestasService {
  private repository = new CestasRepository();
  buscarComposicao() { return this.repository.buscarComposicao(); }
  listarCampanhas() { return this.repository.listarCampanhas(); }
  listarMovimentacoes() { return this.repository.listarMovimentacoes(); }
  salvarComposicao(itens: ItemCestaPadrao[]) { return this.repository.salvarComposicao(itens); }
  criarCampanha(data: CampanhaCestasData) { return this.repository.criarCampanha(campanhaCestasSchema.parse(data)); }
  criarMovimentacao(data: MovimentacaoCestasData) { return this.repository.criarMovimentacao(movimentacaoCestasSchema.parse(data)); }

  calcular(itens: ItemCestaPadrao[], movimentos: MovimentacaoCestas[], meta: number) {
    const cestasProntas = movimentos.filter((m) => m.tipo === "CESTA_PRONTA").reduce((s, m) => s + (m.operacao === "SAIDA" ? -m.quantidade : m.quantidade), 0);
    const estoque = new Map<string, number>();
    movimentos.filter((m) => m.tipo === "ITEM_AVULSO").forEach((m) => estoque.set(m.itemId ?? "", (estoque.get(m.itemId ?? "") ?? 0) + (m.operacao === "SAIDA" ? -m.quantidade : m.quantidade)));
    const cestasMontaveis = itens.length ? Math.min(...itens.map((item) => Math.floor((estoque.get(item.id) ?? 0) / item.quantidade))) : 0;
    const total = cestasProntas + cestasMontaveis;
    const valorParoquia = movimentos.filter((m) => m.origem === "COMPRA_PAROQUIA").reduce((s, m) => s + (m.valorTotal ?? 0), 0);
    return { cestasProntas, cestasMontaveis, total, deficit: Math.max(meta - total, 0), valorParoquia, estoque };
  }

  async montarCestas(campanhaId: string, quantidade: number) {
    const [itens, movimentos] = await Promise.all([this.buscarComposicao(), this.listarMovimentacoes()]);
    const resumo = this.calcular(itens, movimentos.filter((m) => m.campanhaId === campanhaId), 0);
    if (!Number.isInteger(quantidade) || quantidade <= 0) throw new Error("Informe uma quantidade válida.");
    if (quantidade > resumo.cestasMontaveis) throw new Error("O estoque não possui itens suficientes.");
    const data = new Date().toISOString().slice(0, 10);
    const base = { campanhaId, origem: "COMPRA_PAROQUIA" as const, doadorId: "", doadorNome: "", valorTotal: 0, data, familiaId: "", familiaNome: "" };
    const saidas: MovimentacaoCestasData[] = itens.map((item) => ({ ...base, tipo: "ITEM_AVULSO", operacao: "SAIDA", itemId: item.id, itemNome: item.nome, quantidade: item.quantidade * quantidade, unidade: item.unidade, observacoes: `Consumo para montagem de ${quantidade} cesta(s).` }));
    saidas.push({ ...base, tipo: "CESTA_PRONTA", operacao: "ENTRADA", itemId: "", itemNome: "", quantidade, unidade: "cesta", observacoes: "Cestas montadas pela paróquia." });
    return this.repository.criarMovimentacoes(saidas);
  }

  async entregarCestas(campanhaId: string, quantidade: number, familiaId: string, familiaNome: string) {
    const movimentos = (await this.listarMovimentacoes()).filter((m) => m.campanhaId === campanhaId);
    const saldo = this.calcular([], movimentos, 0).cestasProntas;
    if (!familiaId) throw new Error("Selecione uma família.");
    if (!Number.isInteger(quantidade) || quantidade <= 0) throw new Error("Informe uma quantidade válida.");
    if (quantidade > saldo) throw new Error("Não há cestas prontas suficientes.");
    return this.criarMovimentacao({ campanhaId, tipo: "CESTA_PRONTA", origem: "COMPRA_PAROQUIA", operacao: "SAIDA", doadorId: "", doadorNome: "", itemId: "", itemNome: "", quantidade, unidade: "cesta", valorTotal: 0, data: new Date().toISOString().slice(0, 10), observacoes: "Cesta entregue à família.", familiaId, familiaNome });
  }
}
