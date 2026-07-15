import { AreaPastoralRepository } from "../repositories/area-pastoral.repository";
import {
  areaPastoralSchema,
  AreaPastoralFormData,
} from "../schemas/area-pastoral.schema";

export class AreaPastoralService {
  private repository = new AreaPastoralRepository();

  async criar(data: AreaPastoralFormData) {
    return this.repository.criar(areaPastoralSchema.parse(data));
  }

  async listar() {
    return this.repository.listar();
  }

  async remover(id: string) {
    if (!id) throw new Error("Área pastoral não informada.");
    return this.repository.remover(id);
  }
}
