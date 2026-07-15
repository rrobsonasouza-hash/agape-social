import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import { DoadorFormData } from "../schemas/doador.schema";
import { DoadorDocumento } from "../types/doador-documento";

export class DoadorRepository {
  async criar(data: DoadorFormData) {
    return addDoc(collection(db, "doadores"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }

  async listar(): Promise<DoadorDocumento[]> {
    const snapshot = await getDocs(collection(db, "doadores"));
    return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as DoadorFormData) }));
  }

  async buscarPorId(id: string): Promise<DoadorDocumento | null> {
    const snapshot = await getDoc(doc(db, "doadores", id));
    return snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as DoadorFormData) } : null;
  }

  async buscarPorDocumento(documento: string): Promise<DoadorDocumento | null> {
    const snapshot = await getDocs(query(collection(db, "doadores"), where("documento", "==", documento), limit(1)));
    const item = snapshot.docs[0];
    return item ? { id: item.id, ...(item.data() as DoadorFormData) } : null;
  }

  async atualizar(id: string, data: DoadorFormData) {
    await updateDoc(doc(db, "doadores", id), { ...data, updatedAt: serverTimestamp() });
  }

  async alterarStatus(id: string, status: "ATIVO" | "INATIVO") {
    await updateDoc(doc(db, "doadores", id), { status, updatedAt: serverTimestamp() });
  }
}
