import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";

import { VoluntarioFormData } from "../schemas/voluntario.schema";
import { VoluntarioDocumento } from "../types/voluntario-documento";

export class VoluntarioRepository {

  async criar(data: VoluntarioFormData) {

    const documento = await addDoc(
      collection(db, "voluntarios"),
      {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    return documento.id;

  }

  async listar(): Promise<VoluntarioDocumento[]> {

    const snapshot = await getDocs(
      collection(db, "voluntarios")
    );

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as VoluntarioFormData),
    }));

  }

  async buscarPorId(id: string): Promise<VoluntarioDocumento | null> {

    const referencia = doc(db, "voluntarios", id);

    const documento = await getDoc(referencia);

    if (!documento.exists()) {
      return null;
    }

    return {
      id: documento.id,
      ...(documento.data() as VoluntarioFormData),
    };

  }

  async atualizar(
    id: string,
    data: Partial<VoluntarioFormData>
  ) {

    await updateDoc(
      doc(db, "voluntarios", id),
      {
        ...data,
        updatedAt: new Date(),
      }
    );

  }

  async alterarStatus(
    id: string,
    status: "ATIVO" | "INATIVO"
  ) {

    await updateDoc(
      doc(db, "voluntarios", id),
      {
        status,
        updatedAt: new Date(),
      }
    );

  }

}