import { FamiliaRepository } from "../repositories/familia.repository";
import {
  familiaSchema,
  FamiliaFormData,
} from "../schemas/familia.schema";

export class FamiliaService {
  private repository = new FamiliaRepository();

  async criar(data: FamiliaFormData) {
    const dadosValidados = familiaSchema.parse(data);
    const familiaExistente = dadosValidados.cpf
      ? await this.repository.buscarPorCpf(dadosValidados.cpf)
      : null;

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
    const familiaExistente = dadosValidados.cpf
      ? await this.repository.buscarPorCpf(dadosValidados.cpf)
      : null;

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

  async avaliarBeneficio(id: string, decisao: "RESTABELECER" | "MANTER_BLOQUEIO", parecer: string) {
    if (!id) throw new Error("Identificador da família não informado.");
    if (parecer.trim().length < 10)
      throw new Error("Informe um parecer com pelo menos 10 caracteres.");
    return this.repository.avaliarBeneficio(id, decisao, parecer.trim());
  }

  async mesclarDuplicado(manterId: string, removerId: string) {
    if (!manterId || !removerId || manterId === removerId) throw new Error("Informe dois cadastros diferentes.");
    return this.repository.mesclarDuplicado(manterId, removerId);
  }
}
