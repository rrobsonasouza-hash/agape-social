import {
  addDoc,
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import { FamiliaFormData } from "../schemas/familia.schema";

export class FamiliaRepository {

  async criar(data: FamiliaFormData) {

    return await addDoc(
      collection(db, "familias"),
      {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

  }

  async listar() {

    return await getDocs(
      collection(db, "familias")
    );

  }

}