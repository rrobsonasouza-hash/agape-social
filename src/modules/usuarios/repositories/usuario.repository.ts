import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { UsuarioDocumento, UsuarioFormData } from "../types/usuario-documento";
export class UsuarioRepository {
  async listar(): Promise<UsuarioDocumento[]> { const snapshot = await getDocs(collection(db, "usuarios")); return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as UsuarioFormData) })); }
  async buscarPorEmail(email: string) { const snapshot = await getDocs(query(collection(db, "usuarios"), where("email", "==", email), limit(1))); const item = snapshot.docs[0]; return item ? { id: item.id, ...(item.data() as UsuarioFormData) } : null; }
  criar(data: UsuarioFormData) { return addDoc(collection(db, "usuarios"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); }
  atualizar(id: string, data: UsuarioFormData) { return updateDoc(doc(db, "usuarios", id), { ...data, updatedAt: serverTimestamp() }); }
  alterarStatus(id: string, status: UsuarioDocumento["status"]) { return updateDoc(doc(db, "usuarios", id), { status, updatedAt: serverTimestamp() }); }
}
