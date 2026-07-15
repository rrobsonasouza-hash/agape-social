import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import { StatusVisita, VisitaFormData } from "../schemas/visita.schema";
import { VisitaDocumento } from "../types/visita-documento";

function ordenar(visitas: VisitaDocumento[]) {
  return visitas.sort((a, b) =>
    `${b.data}T${b.horario}`.localeCompare(`${a.data}T${a.horario}`)
  );
}

function mapear(snapshot: Awaited<ReturnType<typeof getDocs>>): VisitaDocumento[] {
  return ordenar(
    snapshot.docs.map((documento) => ({
      id: documento.id,
      ...(documento.data() as VisitaFormData),
    }))
  );
}

export class VisitaRepository {
  async criar(data: VisitaFormData): Promise<string> {
    const referencia = await addDoc(collection(db, "visitas"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return referencia.id;
  }

  async listar(): Promise<VisitaDocumento[]> {
    return mapear(await getDocs(collection(db, "visitas")));
  }

  async listarPorFamilia(familiaId: string): Promise<VisitaDocumento[]> {
    const consulta = query(
      collection(db, "visitas"),
      where("familiaId", "==", familiaId)
    );
    return mapear(await getDocs(consulta));
  }

  async alterarStatus(id: string, status: StatusVisita): Promise<void> {
    await updateDoc(doc(db, "visitas", id), {
      status,
      updatedAt: serverTimestamp(),
    });
  }
}
