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

  listar() { return this.repository.listar(); }
  criar(data: ParoquiaFormData) { return this.repository.criar(paroquiaSchema.parse(data)); }
  alterarStatus(id: string, ativa: boolean) { return this.repository.alterarStatus(id, ativa); }
}
