import { DoadorRepository } from "../repositories/doador.repository";
import { doadorSchema, DoadorFormData } from "../schemas/doador.schema";

export class DoadorService {
  private repository = new DoadorRepository();

  listar() { return this.repository.listar(); }
  buscarPorId(id: string) { return this.repository.buscarPorId(id); }

  async criar(data: DoadorFormData) {
    const validado = doadorSchema.parse(data);
    if (await this.repository.buscarPorDocumento(validado.documento)) {
      throw new Error("Já existe um doador com este CPF ou CNPJ.");
    }
    return this.repository.criar(validado);
  }

  async atualizar(id: string, data: DoadorFormData) {
    const validado = doadorSchema.parse(data);
    const existente = await this.repository.buscarPorDocumento(validado.documento);
    if (existente && existente.id !== id) throw new Error("Já existe um doador com este CPF ou CNPJ.");
    return this.repository.atualizar(id, validado);
  }

  alterarStatus(id: string, status: "ATIVO" | "INATIVO") {
    return this.repository.alterarStatus(id, status);
  }
}
