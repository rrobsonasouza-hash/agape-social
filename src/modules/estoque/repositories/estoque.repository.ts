import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import { ItemCestaPadrao, MovimentacaoCestas } from "@/modules/cestas/types/cestas.types";

export class EstoqueRepository {
  async carregar(): Promise<{
    composicao: ItemCestaPadrao[];
    movimentos: MovimentacaoCestas[];
  }> {
    const [configuracao, snapshot] = await Promise.all([
      getDoc(doc(db, "configuracoes", "cestaPadrao")),
      getDocs(collection(db, "movimentacoesCestas")),
    ]);
    const composicao = configuracao.exists()
      ? ((configuracao.data().itens as ItemCestaPadrao[]) ?? [])
      : [];
    const movimentos = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as MovimentacaoCestas[];
    return { composicao, movimentos };
  }
}
