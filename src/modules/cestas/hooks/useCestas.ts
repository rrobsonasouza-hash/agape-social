"use client";
import { useCallback } from "react";
import { CestasService } from "../services/cestas.service";
import { CampanhaCestasData, MovimentacaoCestasData } from "../schemas/cestas.schema";
import { ItemCestaPadrao, MovimentacaoCestas } from "../types/cestas.types";
const service = new CestasService();
export function useCestas() {
  return {
    buscarComposicao: useCallback(() => service.buscarComposicao(), []),
    listarCampanhas: useCallback(() => service.listarCampanhas(), []),
    listarMovimentacoes: useCallback(() => service.listarMovimentacoes(), []),
    salvarComposicao: useCallback((itens: ItemCestaPadrao[]) => service.salvarComposicao(itens), []),
    criarCampanha: useCallback((data: CampanhaCestasData) => service.criarCampanha(data), []),
    criarMovimentacao: useCallback((data: MovimentacaoCestasData) => service.criarMovimentacao(data), []),
    calcular: useCallback((itens: ItemCestaPadrao[], movimentos: MovimentacaoCestas[], meta: number) => service.calcular(itens, movimentos, meta), []),
    montarCestas: useCallback((campanhaId: string, quantidade: number) => service.montarCestas(campanhaId, quantidade), []),
    entregarCestas: useCallback((campanhaId: string, quantidade: number, familiaId: string, familiaNome: string) => service.entregarCestas(campanhaId, quantidade, familiaId, familiaNome), []),
  };
}
