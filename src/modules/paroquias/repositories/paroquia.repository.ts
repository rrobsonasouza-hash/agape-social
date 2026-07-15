import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import { ParoquiaFormData } from "../schemas/paroquia.schema";
import { ParoquiaDocumento } from "../types/paroquia-documento";

const paroquiaId = "principal";

export class ParoquiaRepository {
  async buscarPrincipal(): Promise<ParoquiaDocumento | null> {
    const snapshot = await getDoc(doc(db, "paroquias", paroquiaId));

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...(snapshot.data() as ParoquiaFormData),
    };
  }

  async salvarPrincipal(data: ParoquiaFormData): Promise<void> {
    await setDoc(
      doc(db, "paroquias", paroquiaId),
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
}
