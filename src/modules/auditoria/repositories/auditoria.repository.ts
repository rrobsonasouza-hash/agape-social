import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { AuditoriaDocumento, AuditoriaEntrada } from "../types/auditoria-documento";

export class AuditoriaRepository {
  registrar(entrada: AuditoriaEntrada) {
    return addDoc(collection(db, "auditoria"), { ...entrada, data: serverTimestamp() });
  }

  async listar(limite = 200): Promise<AuditoriaDocumento[]> {
    const snapshot = await getDocs(query(collection(db, "auditoria"), orderBy("data", "desc"), limit(limite)));
    return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<AuditoriaDocumento, "id">) }));
  }
}
