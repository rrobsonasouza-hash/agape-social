import { EccRepository } from "../repositories/ecc.repository";
import {
  eccCasalSchema,
  eccEncontroSchema,
  eccEquipeSchema,
  eccEquipePresencaSchema,
  eccParticipacaoSchema,
  eccProgramacaoSchema,
  eccTarefaSchema,
  eccVinculoCasalSchema,
  eccNovoVoluntarioSchema,
  eccVisitaSchema,
  eccComunicacaoSchema,
  eccDocumentoSchema,
  eccCredenciamentoSchema,
  eccPresencaDiaSchema,
  eccArrecadacaoSchema,
  eccNecessidadeSchema,
  eccDespesaSchema,
  eccEncerramentoSchema,
  type EccCasalFormData,
  type EccEncontroFormData,
  type EccEquipeFormData,
  type EccEquipePresencaFormData,
  type EccParticipacaoFormData,
  type EccProgramacaoFormData,
  type EccTarefaFormData,
  type EccVinculoCasalFormData,
  type EccNovoVoluntarioFormData,
  type EccVisitaFormData,
  type EccComunicacaoFormData,
  type EccDocumentoFormData,
  type EccCredenciamentoFormData,
  type EccPresencaDiaFormData,
  type EccArrecadacaoFormData,
  type EccNecessidadeFormData,
  type EccDespesaFormData,
} from "../schemas/ecc.schema";
import type { EccComunicacaoStatus, EccDocumentoStatus, EccProgramacaoStatus, EccTarefaStatus } from "../types/ecc.types";

export class EccService {
  constructor(private readonly repository = new EccRepository()) {}
  listar() { return this.repository.listar(); }
  criarEncontro(dados: EccEncontroFormData) { return this.repository.criarEncontro(eccEncontroSchema.parse(dados)); }
  atualizarEncontro(id: string, dados: EccEncontroFormData) { return this.repository.atualizarEncontro(id, eccEncontroSchema.parse(dados)); }
  reabrirEncontro(id: string) { return this.repository.reabrirEncontro(id); }
  criarCasal(dados: EccCasalFormData) { return this.repository.criarCasal(eccCasalSchema.parse(dados)); }
  atualizarCasal(id: string, dados: EccCasalFormData) { return this.repository.atualizarCasal(id, eccCasalSchema.parse(dados)); }
  vincularCasal(dados: EccVinculoCasalFormData) { return this.repository.vincularCasal(eccVinculoCasalSchema.parse(dados)); }
  adicionarEquipe(dados: EccEquipeFormData) { return this.repository.adicionarEquipe(eccEquipeSchema.parse(dados)); }
  atualizarEquipe(id: string, dados: EccEquipeFormData) { return this.repository.atualizarEquipe(id, eccEquipeSchema.parse(dados)); }
  registrarPresencaEquipe(dados: EccEquipePresencaFormData) { return this.repository.registrarPresencaEquipe(eccEquipePresencaSchema.parse(dados)); }
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
  registrarPresencaDia(dados: EccPresencaDiaFormData) { return this.repository.registrarPresencaDia(eccPresencaDiaSchema.parse(dados)); }
  criarArrecadacao(dados: EccArrecadacaoFormData) { return this.repository.criarArrecadacao(eccArrecadacaoSchema.parse(dados)); }
  atualizarArrecadacao(id: string, dados: EccArrecadacaoFormData) { return this.repository.atualizarArrecadacao(id, eccArrecadacaoSchema.parse(dados)); }
  criarNecessidade(dados: EccNecessidadeFormData) { return this.repository.criarNecessidade(eccNecessidadeSchema.parse(dados)); }
  atualizarNecessidade(id: string, dados: EccNecessidadeFormData) { return this.repository.atualizarNecessidade(id, eccNecessidadeSchema.parse(dados)); }
  criarDespesa(dados: EccDespesaFormData) { return this.repository.criarDespesa(eccDespesaSchema.parse(dados)); }
  atualizarDespesa(id: string, dados: EccDespesaFormData) { return this.repository.atualizarDespesa(id, eccDespesaSchema.parse(dados)); }
  encerrarEdicao(encontroId: string) { return this.repository.encerrarEdicao(eccEncerramentoSchema.parse({ encontroId }).encontroId); }
  atualizarVisita(id: string, dados: EccVisitaFormData) { return this.repository.atualizarVisita(id, eccVisitaSchema.parse(dados)); }
  atualizarParticipacao(id: string, dados: EccParticipacaoFormData) { return this.repository.atualizarParticipacao(id, eccParticipacaoSchema.parse(dados)); }
  registrarConvite(id: string) { return this.repository.registrarConvite(id); }
  atualizarTarefa(id: string, status: EccTarefaStatus) { return this.repository.atualizarTarefa(id, status); }
  atualizarProgramacao(id: string, status: EccProgramacaoStatus) { return this.repository.atualizarProgramacao(id, status); }
  atualizarComunicacao(id: string, status: EccComunicacaoStatus) { return this.repository.atualizarComunicacao(id, status); }
  atualizarDocumento(id: string, status: EccDocumentoStatus) { return this.repository.atualizarDocumento(id, status); }
}
