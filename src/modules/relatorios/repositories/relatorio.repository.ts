import { CestasRepository } from "@/modules/cestas/repositories/cestas.repository";
import { CampanhaCestas, MovimentacaoCestas } from "@/modules/cestas/types/cestas.types";
import { DistribuicaoRepository } from "@/modules/distribuicoes/repositories/distribuicao.repository";
import { DistribuicaoDocumento } from "@/modules/distribuicoes/types/distribuicao-documento";
import { FamiliaRepository } from "@/modules/familias/repositories/familia.repository";
import { FamiliaDocumento } from "@/modules/familias/types/familia-documento";
import { VisitaRepository } from "@/modules/visitas/repositories/visita.repository";
import { VisitaDocumento } from "@/modules/visitas/types/visita-documento";

export interface DadosRelatorio {
  familias: FamiliaDocumento[];
  distribuicoes: DistribuicaoDocumento[];
  movimentos: MovimentacaoCestas[];
  campanhas: CampanhaCestas[];
  visitas: VisitaDocumento[];
}

export class RelatorioRepository {
  private familias = new FamiliaRepository();
  private distribuicoes = new DistribuicaoRepository();
  private cestas = new CestasRepository();
  private visitas = new VisitaRepository();

  async carregar(): Promise<DadosRelatorio> {
    const [familias, distribuicoes, movimentos, campanhas, visitas] = await Promise.all([
      this.familias.listar(),
      this.distribuicoes.listarPorData(""),
      this.cestas.listarMovimentacoes(),
      this.cestas.listarCampanhas(),
      this.visitas.listar(),
    ]);
    return { familias, distribuicoes, movimentos, campanhas, visitas };
  }
}
