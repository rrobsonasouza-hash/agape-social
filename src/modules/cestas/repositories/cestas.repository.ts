import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { CampanhaCestasData, MovimentacaoCestasData } from "../schemas/cestas.schema";
import { CampanhaCestas, ItemCestaPadrao, MovimentacaoCestas } from "../types/cestas.types";

export class CestasRepository {
  async salvarComposicao(itens: ItemCestaPadrao[]) {
    await setDoc(doc(db, "configuracoes", "cestaPadrao"), { itens, updatedAt: serverTimestamp() });
  }
  async buscarComposicao(): Promise<ItemCestaPadrao[]> {
    const snapshot = await getDoc(doc(db, "configuracoes", "cestaPadrao"));
    return snapshot.exists() ? (snapshot.data().itens as ItemCestaPadrao[]) ?? [] : [];
  }
  async criarCampanha(data: CampanhaCestasData) {
    return addDoc(collection(db, "campanhasCestas"), { ...data, createdAt: serverTimestamp() });
  }
  async listarCampanhas(): Promise<CampanhaCestas[]> {
    const snapshot = await getDocs(collection(db, "campanhasCestas"));
    return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as CampanhaCestasData) }));
  }
  async criarMovimentacao(data: MovimentacaoCestasData) {
    return addDoc(collection(db, "movimentacoesCestas"), { ...data, createdAt: serverTimestamp() });
  }
  async listarMovimentacoes(): Promise<MovimentacaoCestas[]> {
    const snapshot = await getDocs(collection(db, "movimentacoesCestas"));
    return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as MovimentacaoCestasData) }));
  }

  async criarMovimentacoes(data: MovimentacaoCestasData[]) {
    const lote = writeBatch(db);
    data.forEach((movimento) => {
      const referencia = doc(collection(db, "movimentacoesCestas"));
      lote.set(referencia, { ...movimento, createdAt: serverTimestamp() });
    });
    await lote.commit();
  }
}
