import { FamiliaRepository } from "../repositories/familia.repository";
import {
  familiaSchema,
  FamiliaFormData,
} from "../schemas/familia.schema";

export class FamiliaService {
  private repository = new FamiliaRepository();

  async criar(data: FamiliaFormData) {
    const dadosValidados = familiaSchema.parse(data);
    const familiaExistente = await this.repository.buscarPorCpf(
      dadosValidados.cpf
    );

    if (familiaExistente) {
      throw new Error("Já existe uma família cadastrada com este CPF.");
    }

    return this.repository.criar(dadosValidados);
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

    const dadosValidados = familiaSchema.parse(data);
    const familiaExistente = await this.repository.buscarPorCpf(
      dadosValidados.cpf
    );

    if (familiaExistente && familiaExistente.id !== id) {
      throw new Error("Já existe uma família cadastrada com este CPF.");
    }

    return this.repository.atualizar(id, dadosValidados);
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
