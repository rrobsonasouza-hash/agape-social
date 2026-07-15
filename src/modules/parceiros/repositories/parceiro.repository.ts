import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { ParceiroFormData } from "../schemas/parceiro.schema";
import { ParceiroDocumento } from "../types/parceiro-documento";

export class ParceiroRepository {
  async criar(data: ParceiroFormData) { return addDoc(collection(db, "parceiros"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); }
  async listar(): Promise<ParceiroDocumento[]> { const snapshot = await getDocs(collection(db, "parceiros")); return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as ParceiroFormData) })); }
  async buscarPorId(id: string): Promise<ParceiroDocumento | null> { const snapshot = await getDoc(doc(db, "parceiros", id)); return snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as ParceiroFormData) } : null; }
  async buscarPorCnpj(cnpj: string): Promise<ParceiroDocumento | null> { const snapshot = await getDocs(query(collection(db, "parceiros"), where("cnpj", "==", cnpj), limit(1))); const item = snapshot.docs[0]; return item ? { id: item.id, ...(item.data() as ParceiroFormData) } : null; }
  async atualizar(id: string, data: ParceiroFormData) { await updateDoc(doc(db, "parceiros", id), { ...data, updatedAt: serverTimestamp() }); }
  async alterarStatus(id: string, status: "ATIVO" | "INATIVO") { await updateDoc(doc(db, "parceiros", id), { status, updatedAt: serverTimestamp() }); }
}
