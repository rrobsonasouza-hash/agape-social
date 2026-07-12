import { FamiliaRepository } from "../repositories/familia.repository";
import { FamiliaFormData } from "../schemas/familia.schema";

export class FamiliaService {
  private repository = new FamiliaRepository();

  async criar(data: FamiliaFormData) {
    return this.repository.criar(data);
  }

  async listar() {
    return this.repository.listar();
  }

  async buscarPorId(id: string) {
    if (!id) {
      throw new Error("Identificador da família não informado.");
    }

    return this.repository.buscarPorId(id);
  }

  async atualizar(id: string, data: FamiliaFormData) {
    if (!id) {
      throw new Error("Identificador da família não informado.");
    }

    return this.repository.atualizar(id, data);
  }

  async alterarStatus(
    id: string,
    status: "ATIVA" | "INATIVA"
  ) {
    if (!id) {
      throw new Error("Identificador da família não informado.");
    }

    return this.repository.alterarStatus(id, status);
  }
}