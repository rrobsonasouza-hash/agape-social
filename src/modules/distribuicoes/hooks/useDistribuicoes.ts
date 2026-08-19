"use client";
import { useCallback } from "react";
import { DistribuicaoService } from "../services/distribuicao.service";
import {
  DistribuicaoData,
  StatusDistribuicao,
} from "../schemas/distribuicao.schema";
const service = new DistribuicaoService();
export function useDistribuicoes() {
  return {
    listarPorData: useCallback(
      (data: string) => service.listarPorData(data),
      [],
    ),
    listarDatas: useCallback(() => service.listarDatas(), []),
    agendar: useCallback((data: DistribuicaoData) => service.agendar(data), []),
    agendarTodas: useCallback(
      (data: string, campanhaId: string) =>
        service.agendarTodas(data, campanhaId),
      [],
    ),
    remarcarTodas: useCallback(
      (ids: string[], data: string) => service.remarcarTodas(ids, data),
      [],
    ),
    excluirAgendadas: useCallback(
      (ids: string[]) => service.excluirAgendadas(ids),
      [],
    ),
    marcarAusentes: useCallback((ids: string[]) => service.marcarAusentes(ids), []),
    marcar: useCallback(
      (id: string, status: Exclude<StatusDistribuicao, "AGENDADA">) =>
        service.marcar(id, status),
      [],
    ),
    desfazerBaixa: useCallback((id: string) => service.desfazerBaixa(id), []),
  };
}
