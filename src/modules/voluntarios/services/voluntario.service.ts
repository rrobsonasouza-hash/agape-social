import { VoluntarioRepository } from "../repositories/voluntario.repository";
import { VoluntarioFormData } from "../schemas/voluntario.schema";

export class VoluntarioService {
  private repository = new VoluntarioRepository();

  async criar(data: VoluntarioFormData) {
    return this.repository.criar(data);
  }

  async listar() {
    return this.repository.listar();
  }

  async buscarPorId(id: string) {
    return this.repository.buscarPorId(id);
  }

  async atualizar(
    id: string,
    data: Partial<VoluntarioFormData>
  ) {
    return this.repository.atualizar(id, data);
  }

  async alterarStatus(
    id: string,
    status: "ATIVO" | "INATIVO"
  ) {
    return this.repository.alterarStatus(id, status);
  }
}