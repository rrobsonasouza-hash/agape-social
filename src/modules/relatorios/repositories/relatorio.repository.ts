import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import { CampanhaCestas, MovimentacaoCestas } from "@/modules/cestas/types/cestas.types";
import { DistribuicaoDocumento } from "@/modules/distribuicoes/types/distribuicao-documento";
import { FamiliaDocumento } from "@/modules/familias/types/familia-documento";
import { VisitaDocumento } from "@/modules/visitas/types/visita-documento";

export interface DadosRelatorio {
  familias: FamiliaDocumento[];
  distribuicoes: DistribuicaoDocumento[];
  movimentos: MovimentacaoCestas[];
  campanhas: CampanhaCestas[];
  visitas: VisitaDocumento[];
}

async function listar<T>(nome: string): Promise<T[]> {
  const snapshot = await getDocs(collection(db, nome));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

export class RelatorioRepository {
  async carregar(): Promise<DadosRelatorio> {
    const [familias, distribuicoes, movimentos, campanhas, visitas] = await Promise.all([
      listar<FamiliaDocumento>("familias"),
      listar<DistribuicaoDocumento>("distribuicoesCestas"),
      listar<MovimentacaoCestas>("movimentacoesCestas"),
      listar<CampanhaCestas>("campanhasCestas"),
      listar<VisitaDocumento>("visitas"),
    ]);
    return { familias, distribuicoes, movimentos, campanhas, visitas };
  }
}
