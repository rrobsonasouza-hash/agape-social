import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
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
}