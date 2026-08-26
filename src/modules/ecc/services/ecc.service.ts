import { EccRepository } from "../repositories/ecc.repository";
import { eccCasalSchema, eccEncontroSchema, eccEquipeSchema, type EccCasalFormData, type EccEncontroFormData, type EccEquipeFormData } from "../schemas/ecc.schema";

export class EccService {
  constructor(private readonly repository = new EccRepository()) {}
  listar() { return this.repository.listar(); }
  criarEncontro(dados:EccEncontroFormData) { return this.repository.criarEncontro(eccEncontroSchema.parse(dados)); }
  criarCasal(dados:EccCasalFormData) { return this.repository.criarCasal(eccCasalSchema.parse(dados)); }
  adicionarEquipe(dados:EccEquipeFormData) { return this.repository.adicionarEquipe(eccEquipeSchema.parse(dados)); }
}
