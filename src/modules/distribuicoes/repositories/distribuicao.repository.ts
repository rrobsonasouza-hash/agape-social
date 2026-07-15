import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { DistribuicaoData, StatusDistribuicao } from "../schemas/distribuicao.schema";
import { DistribuicaoDocumento } from "../types/distribuicao-documento";

export class DistribuicaoRepository {
  async agendar(data: DistribuicaoData) {
    return addDoc(collection(db, "distribuicoesCestas"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
  async buscarPorId(id: string): Promise<DistribuicaoDocumento | null> {
    const snapshot = await getDoc(doc(db, "distribuicoesCestas", id));
    return snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as DistribuicaoData) } : null;
  }
  async listarPorData(data: string): Promise<DistribuicaoDocumento[]> {
    const snapshot = await getDocs(query(collection(db, "distribuicoesCestas"), where("data", "==", data)));
    return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as DistribuicaoData) })).sort((a, b) => a.familiaNome.localeCompare(b.familiaNome));
  }
  async alterarStatus(id: string, status: StatusDistribuicao) {
    await updateDoc(doc(db, "distribuicoesCestas", id), { status, updatedAt: serverTimestamp() });
  }

  async agendarMuitas(registros: DistribuicaoData[]) {
    for (let inicio = 0; inicio < registros.length; inicio += 450) {
      const lote = writeBatch(db);
      registros.slice(inicio, inicio + 450).forEach((registro) => {
        const referencia = doc(collection(db, "distribuicoesCestas"));
        lote.set(referencia, { ...registro, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });
      await lote.commit();
    }
  }
}
