"use client";
import { useCallback } from "react";
import { EccService } from "../services/ecc.service";
import type {
  EccCasalFormData,
  EccEncontroFormData,
  EccEquipeFormData,
  EccParticipacaoFormData,
  EccProgramacaoFormData,
  EccTarefaFormData,
  EccVinculoCasalFormData,
  EccNovoVoluntarioFormData,
  EccVisitaFormData,
  EccComunicacaoFormData,
  EccDocumentoFormData,
  EccCredenciamentoFormData,
  EccArrecadacaoFormData,
} from "../schemas/ecc.schema";
import type { EccComunicacaoStatus, EccDocumentoStatus, EccProgramacaoStatus, EccTarefaStatus } from "../types/ecc.types";

const service = new EccService();
export function useEcc() {
  return {
    listar: useCallback(() => service.listar(), []),
    criarEncontro: useCallback((dados: EccEncontroFormData) => service.criarEncontro(dados), []),
    criarCasal: useCallback((dados: EccCasalFormData) => service.criarCasal(dados), []),
    atualizarCasal: useCallback((id: string, dados: EccCasalFormData) => service.atualizarCasal(id, dados), []),
    vincularCasal: useCallback((dados: EccVinculoCasalFormData) => service.vincularCasal(dados), []),
    adicionarEquipe: useCallback((dados: EccEquipeFormData) => service.adicionarEquipe(dados), []),
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
    criarArrecadacao: useCallback((dados: EccArrecadacaoFormData) => service.criarArrecadacao(dados), []),
    atualizarArrecadacao: useCallback((id: string, dados: EccArrecadacaoFormData) => service.atualizarArrecadacao(id, dados), []),
    atualizarVisita: useCallback((id: string, dados: EccVisitaFormData) => service.atualizarVisita(id, dados), []),
    atualizarParticipacao: useCallback((id: string, dados: EccParticipacaoFormData) => service.atualizarParticipacao(id, dados), []),
    atualizarTarefa: useCallback((id: string, status: EccTarefaStatus) => service.atualizarTarefa(id, status), []),
    atualizarProgramacao: useCallback((id: string, status: EccProgramacaoStatus) => service.atualizarProgramacao(id, status), []),
    atualizarComunicacao: useCallback((id: string, status: EccComunicacaoStatus) => service.atualizarComunicacao(id, status), []),
    atualizarDocumento: useCallback((id: string, status: EccDocumentoStatus) => service.atualizarDocumento(id, status), []),
  };
}
