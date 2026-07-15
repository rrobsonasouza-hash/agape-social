import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import { AreaPastoralFormData } from "../schemas/area-pastoral.schema";
import { AreaPastoralDocumento } from "../types/area-pastoral-documento";

export class AreaPastoralRepository {
  async criar(data: AreaPastoralFormData): Promise<string> {
    const referencia = await addDoc(collection(db, "areasPastorais"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return referencia.id;
  }

  async listar(): Promise<AreaPastoralDocumento[]> {
    const snapshot = await getDocs(collection(db, "areasPastorais"));
    return snapshot.docs.map((documento) => ({
      id: documento.id,
      ...(documento.data() as AreaPastoralFormData),
    }));
  }

  async remover(id: string): Promise<void> {
    await deleteDoc(doc(db, "areasPastorais", id));
  }
}
