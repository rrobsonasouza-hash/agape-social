import { FamiliaService } from "../services/familia.service";
import { FamiliaFormData } from "../schemas/familia.schema";

const service = new FamiliaService();

export function useFamilias() {

  async function listar() {
    return await service.listar();
  }

  async function criar(data: FamiliaFormData) {
    return await service.criar(data);
  }

  return {
    listar,
    criar,
  };
}