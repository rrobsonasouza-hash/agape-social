import { CestasRepository } from "@/modules/cestas/repositories/cestas.repository";
import { ItemCestaPadrao, MovimentacaoCestas } from "@/modules/cestas/types/cestas.types";
export class EstoqueRepository {
  private cestas = new CestasRepository();
  async carregar(): Promise<{ composicao: ItemCestaPadrao[]; movimentos: MovimentacaoCestas[] }> {
    const [composicao, movimentos] = await Promise.all([this.cestas.buscarComposicao(), this.cestas.listarMovimentacoes()]);
    return { composicao, movimentos };
  }
}
