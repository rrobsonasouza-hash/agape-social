"use client";
import { useCallback } from "react";
import { EstoqueService } from "../services/estoque.service";
const service = new EstoqueService();
export function useEstoque() {
  const obterResumo = useCallback(() => service.obterResumo(), []);
  return { obterResumo };
}
