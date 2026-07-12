import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import { FamiliaFormData } from "../schemas/familia.schema";
import { FamiliaDocumento } from "../types/familia-documento";

export class FamiliaRepository {
  async criar(data: FamiliaFormData) {
    return addDoc(collection(db, "familias"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async listar(): Promise<FamiliaDocumento[]> {
    const snapshot = await getDocs(collection(db, "familias"));

    return snapshot.docs.map((documento) => ({
      id: documento.id,
      ...(documento.data() as FamiliaFormData),
    }));
  }

  async buscarPorId(id: string): Promise<FamiliaDocumento | null> {
    const referencia = doc(db, "familias", id);
    const snapshot = await getDoc(referencia);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...(snapshot.data() as FamiliaFormData),
    };
  }

  async atualizar(id: string, data: FamiliaFormData) {
    const referencia = doc(db, "familias", id);

    await updateDoc(referencia, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async alterarStatus(
    id: string,
    status: "ATIVA" | "INATIVA"
  ) {
    const referencia = doc(db, "familias", id);

    await updateDoc(referencia, {
      status,
      updatedAt: serverTimestamp(),
    });
  }
}