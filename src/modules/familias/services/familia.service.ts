import { FamiliaRepository } from "../repositories/familia.repository";
import { FamiliaFormData } from "../schemas/familia.schema";

export class FamiliaService {
  private repository = new FamiliaRepository();

  async criar(data: FamiliaFormData) {
    return await this.repository.criar(data);
  }

  async listar() {
    return await this.repository.listar();
  }
}