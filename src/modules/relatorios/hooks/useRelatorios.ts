"use client";
import { useCallback } from "react";
import { RelatorioService } from "../services/relatorio.service";
const service = new RelatorioService();
export function useRelatorios() {
  const gerarMensal = useCallback((mes: string) => service.gerarMensal(mes), []);
  return { gerarMensal };
}
