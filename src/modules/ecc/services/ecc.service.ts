import { EccRepository } from "../repositories/ecc.repository";
import {
  eccCasalSchema,
  eccEncontroSchema,
  eccEquipeSchema,
  eccParticipacaoSchema,
  eccProgramacaoSchema,
  eccTarefaSchema,
  eccVinculoCasalSchema,
  type EccCasalFormData,
  type EccEncontroFormData,
  type EccEquipeFormData,
  type EccParticipacaoFormData,
  type EccProgramacaoFormData,
  type EccTarefaFormData,
  type EccVinculoCasalFormData,
} from "../schemas/ecc.schema";
import type { EccProgramacaoStatus, EccTarefaStatus } from "../types/ecc.types";

export class EccService {
  constructor(private readonly repository = new EccRepository()) {}
  listar() { return this.repository.listar(); }
  criarEncontro(dados: EccEncontroFormData) { return this.repository.criarEncontro(eccEncontroSchema.parse(dados)); }
  criarCasal(dados: EccCasalFormData) { return this.repository.criarCasal(eccCasalSchema.parse(dados)); }
  vincularCasal(dados: EccVinculoCasalFormData) { return this.repository.vincularCasal(eccVinculoCasalSchema.parse(dados)); }
  adicionarEquipe(dados: EccEquipeFormData) { return this.repository.adicionarEquipe(eccEquipeSchema.parse(dados)); }
  criarProgramacao(dados: EccProgramacaoFormData) { return this.repository.criarProgramacao(eccProgramacaoSchema.parse(dados)); }
  criarTarefa(dados: EccTarefaFormData) { return this.repository.criarTarefa(eccTarefaSchema.parse(dados)); }
  atualizarParticipacao(id: string, dados: EccParticipacaoFormData) { return this.repository.atualizarParticipacao(id, eccParticipacaoSchema.parse(dados)); }
  atualizarTarefa(id: string, status: EccTarefaStatus) { return this.repository.atualizarTarefa(id, status); }
  atualizarProgramacao(id: string, status: EccProgramacaoStatus) { return this.repository.atualizarProgramacao(id, status); }
}
