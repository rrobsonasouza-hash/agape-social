"use client";
import { useCallback } from "react";
import { EccService } from "../services/ecc.service";
import type {
  EccCasalFormData,
  EccEncontroFormData,
  EccEquipeFormData,
  EccEquipePresencaFormData,
  EccParticipacaoFormData,
  EccProgramacaoFormData,
  EccTarefaFormData,
  EccVinculoCasalFormData,
  EccNovoVoluntarioFormData,
  EccVisitaFormData,
  EccComunicacaoFormData,
  EccDocumentoFormData,
  EccCredenciamentoFormData,
  EccPresencaDiaFormData,
  EccArrecadacaoFormData,
  EccNecessidadeFormData,
  EccDespesaFormData,
} from "../schemas/ecc.schema";
import type { EccComunicacaoStatus, EccDocumentoStatus, EccProgramacaoStatus, EccTarefaStatus } from "../types/ecc.types";

const service = new EccService();
export function useEcc() {
  return {
    listar: useCallback(() => service.listar(), []),
    criarEncontro: useCallback((dados: EccEncontroFormData) => service.criarEncontro(dados), []),
    atualizarEncontro: useCallback((id: string, dados: EccEncontroFormData) => service.atualizarEncontro(id, dados), []),
    reabrirEncontro: useCallback((id: string) => service.reabrirEncontro(id), []),
    criarCasal: useCallback((dados: EccCasalFormData) => service.criarCasal(dados), []),
    atualizarCasal: useCallback((id: string, dados: EccCasalFormData) => service.atualizarCasal(id, dados), []),
    vincularCasal: useCallback((dados: EccVinculoCasalFormData) => service.vincularCasal(dados), []),
    adicionarEquipe: useCallback((dados: EccEquipeFormData) => service.adicionarEquipe(dados), []),
    atualizarEquipe: useCallback((id: string, dados: EccEquipeFormData) => service.atualizarEquipe(id, dados), []),
    registrarPresencaEquipe: useCallback((dados: EccEquipePresencaFormData) => service.registrarPresencaEquipe(dados), []),
    criarProgramacao: useCallback((dados: EccProgramacaoFormData) => service.criarProgramacao(dados), []),
    criarTarefa: useCallback((dados: EccTarefaFormData) => service.criarTarefa(dados), []),
    cadastrarConjugeComoVoluntario: useCallback((dados: EccNovoVoluntarioFormData) => service.cadastrarConjugeComoVoluntario(dados), []),
    criarVisita: useCallback((dados: EccVisitaFormData) => service.criarVisita(dados), []),
    criarComunicacao: useCallback((dados: EccComunicacaoFormData) => service.criarComunicacao(dados), []),
    criarDocumento: useCallback((dados: EccDocumentoFormData) => service.criarDocumento(dados), []),
    enviarDocumento: useCallback((dados: EccDocumentoFormData, arquivo: File) => service.enviarDocumento(dados, arquivo), []),
    abrirDocumento: useCallback((id: string) => service.abrirDocumento(id), []),
    excluirDocumento: useCallback((id: string) => service.excluirDocumento(id), []),
    registrarCredenciamento: useCallback((dados: EccCredenciamentoFormData) => service.registrarCredenciamento(dados), []),
    registrarPresencaDia: useCallback((dados: EccPresencaDiaFormData) => service.registrarPresencaDia(dados), []),
    criarArrecadacao: useCallback((dados: EccArrecadacaoFormData) => service.criarArrecadacao(dados), []),
    atualizarArrecadacao: useCallback((id: string, dados: EccArrecadacaoFormData) => service.atualizarArrecadacao(id, dados), []),
    criarNecessidade: useCallback((dados: EccNecessidadeFormData) => service.criarNecessidade(dados), []),
    atualizarNecessidade: useCallback((id: string, dados: EccNecessidadeFormData) => service.atualizarNecessidade(id, dados), []),
    criarDespesa: useCallback((dados: EccDespesaFormData) => service.criarDespesa(dados), []),
    atualizarDespesa: useCallback((id: string, dados: EccDespesaFormData) => service.atualizarDespesa(id, dados), []),
    encerrarEdicao: useCallback((encontroId: string) => service.encerrarEdicao(encontroId), []),
    atualizarVisita: useCallback((id: string, dados: EccVisitaFormData) => service.atualizarVisita(id, dados), []),
    atualizarParticipacao: useCallback((id: string, dados: EccParticipacaoFormData) => service.atualizarParticipacao(id, dados), []),
    registrarConvite: useCallback((id: string) => service.registrarConvite(id), []),
    atualizarTarefa: useCallback((id: string, status: EccTarefaStatus) => service.atualizarTarefa(id, status), []),
    atualizarProgramacao: useCallback((id: string, status: EccProgramacaoStatus) => service.atualizarProgramacao(id, status), []),
    atualizarComunicacao: useCallback((id: string, status: EccComunicacaoStatus) => service.atualizarComunicacao(id, status), []),
    atualizarDocumento: useCallback((id: string, status: EccDocumentoStatus) => service.atualizarDocumento(id, status), []),
  };
}
