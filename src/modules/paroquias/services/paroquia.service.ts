import { ParoquiaRepository } from "../repositories/paroquia.repository";
import { paroquiaSchema, ParoquiaFormData } from "../schemas/paroquia.schema";

export class ParoquiaService {
  private repository = new ParoquiaRepository();

  async buscarPrincipal() {
    return this.repository.buscarPrincipal();
  }

  async salvarPrincipal(data: ParoquiaFormData) {
    return this.repository.salvarPrincipal(paroquiaSchema.parse(data));
  }
}
