import { ParceiroRepository } from "../repositories/parceiro.repository";
import { parceiroSchema, ParceiroFormData } from "../schemas/parceiro.schema";

export class ParceiroService {
  private repository = new ParceiroRepository();
  listar() { return this.repository.listar(); }
  buscarPorId(id: string) { return this.repository.buscarPorId(id); }
  async criar(data: ParceiroFormData) { const validado = parceiroSchema.parse(data); if (await this.repository.buscarPorCnpj(validado.cnpj)) throw new Error("Já existe um parceiro com este CNPJ."); return this.repository.criar(validado); }
  async atualizar(id: string, data: ParceiroFormData) { const validado = parceiroSchema.parse(data); const existente = await this.repository.buscarPorCnpj(validado.cnpj); if (existente && existente.id !== id) throw new Error("Já existe um parceiro com este CNPJ."); return this.repository.atualizar(id, validado); }
  alterarStatus(id: string, status: "ATIVO" | "INATIVO") { return this.repository.alterarStatus(id, status); }
}
