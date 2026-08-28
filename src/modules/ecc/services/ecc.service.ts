import { EccRepository } from "../repositories/ecc.repository";
import {
  eccCasalSchema,
  eccEncontroSchema,
  eccEquipeSchema,
  eccParticipacaoSchema,
  eccProgramacaoSchema,
  eccTarefaSchema,
  eccVinculoCasalSchema,
  eccNovoVoluntarioSchema,
  eccVisitaSchema,
  eccComunicacaoSchema,
  eccDocumentoSchema,
  eccCredenciamentoSchema,
  type EccCasalFormData,
  type EccEncontroFormData,
  type EccEquipeFormData,
  type EccParticipacaoFormData,
  type EccProgramacaoFormData,
  type EccTarefaFormData,
  type EccVinculoCasalFormData,
  type EccNovoVoluntarioFormData,
  type EccVisitaFormData,
  type EccComunicacaoFormData,
  type EccDocumentoFormData,
  type EccCredenciamentoFormData,
} from "../schemas/ecc.schema";
import type { EccComunicacaoStatus, EccDocumentoStatus, EccProgramacaoStatus, EccTarefaStatus } from "../types/ecc.types";

export class EccService {
  constructor(private readonly repository = new EccRepository()) {}
  listar() { return this.repository.listar(); }
  criarEncontro(dados: EccEncontroFormData) { return this.repository.criarEncontro(eccEncontroSchema.parse(dados)); }
  criarCasal(dados: EccCasalFormData) { return this.repository.criarCasal(eccCasalSchema.parse(dados)); }
  atualizarCasal(id: string, dados: EccCasalFormData) { return this.repository.atualizarCasal(id, eccCasalSchema.parse(dados)); }
  vincularCasal(dados: EccVinculoCasalFormData) { return this.repository.vincularCasal(eccVinculoCasalSchema.parse(dados)); }
  adicionarEquipe(dados: EccEquipeFormData) { return this.repository.adicionarEquipe(eccEquipeSchema.parse(dados)); }
  criarProgramacao(dados: EccProgramacaoFormData) { return this.repository.criarProgramacao(eccProgramacaoSchema.parse(dados)); }
  criarTarefa(dados: EccTarefaFormData) { return this.repository.criarTarefa(eccTarefaSchema.parse(dados)); }
  cadastrarConjugeComoVoluntario(dados: EccNovoVoluntarioFormData) { return this.repository.cadastrarConjugeComoVoluntario(eccNovoVoluntarioSchema.parse(dados)); }
  criarVisita(dados: EccVisitaFormData) { return this.repository.criarVisita(eccVisitaSchema.parse(dados)); }
  criarComunicacao(dados: EccComunicacaoFormData) { return this.repository.criarComunicacao(eccComunicacaoSchema.parse(dados)); }
  criarDocumento(dados: EccDocumentoFormData) { return this.repository.criarDocumento(eccDocumentoSchema.parse(dados)); }
  enviarDocumento(dados: EccDocumentoFormData, arquivo: File) { return this.repository.enviarDocumento(eccDocumentoSchema.parse(dados), arquivo); }
  abrirDocumento(id: string) { return this.repository.abrirDocumento(id); }
  excluirDocumento(id: string) { return this.repository.excluirDocumento(id); }
  registrarCredenciamento(dados: EccCredenciamentoFormData) { return this.repository.registrarCredenciamento(eccCredenciamentoSchema.parse(dados)); }
  atualizarVisita(id: string, dados: EccVisitaFormData) { return this.repository.atualizarVisita(id, eccVisitaSchema.parse(dados)); }
  atualizarParticipacao(id: string, dados: EccParticipacaoFormData) { return this.repository.atualizarParticipacao(id, eccParticipacaoSchema.parse(dados)); }
  atualizarTarefa(id: string, status: EccTarefaStatus) { return this.repository.atualizarTarefa(id, status); }
  atualizarProgramacao(id: string, status: EccProgramacaoStatus) { return this.repository.atualizarProgramacao(id, status); }
  atualizarComunicacao(id: string, status: EccComunicacaoStatus) { return this.repository.atualizarComunicacao(id, status); }
  atualizarDocumento(id: string, status: EccDocumentoStatus) { return this.repository.atualizarDocumento(id, status); }
}
