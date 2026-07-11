"use server";

import { FamiliaService } from "../services/familia.service";
import { FamiliaFormData } from "../schemas/familia.schema";

const service = new FamiliaService();

export async function criarFamilia(data: FamiliaFormData) {
  return await service.criar(data);
}