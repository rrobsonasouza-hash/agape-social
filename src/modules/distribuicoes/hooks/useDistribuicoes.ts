"use client";
import { useCallback } from "react";
import { DistribuicaoService } from "../services/distribuicao.service";
import { DistribuicaoData, StatusDistribuicao } from "../schemas/distribuicao.schema";
const service = new DistribuicaoService();
export function useDistribuicoes() {
  return {
    listarPorData: useCallback((data: string) => service.listarPorData(data), []),
    agendar: useCallback((data: DistribuicaoData) => service.agendar(data), []),
    agendarTodas: useCallback((data: string, campanhaId: string) => service.agendarTodas(data, campanhaId), []),
    marcar: useCallback((id: string, status: Exclude<StatusDistribuicao, "AGENDADA">) => service.marcar(id, status), []),
  };
}
