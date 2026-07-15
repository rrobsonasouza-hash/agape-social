"use client";
import { useCallback } from "react";
import { ParceiroService } from "../services/parceiro.service";
import { ParceiroFormData } from "../schemas/parceiro.schema";
const service = new ParceiroService();
export function useParceiros() { return {
  listar: useCallback(() => service.listar(), []),
  buscarPorId: useCallback((id: string) => service.buscarPorId(id), []),
  criar: useCallback((data: ParceiroFormData) => service.criar(data), []),
  atualizar: useCallback((id: string, data: ParceiroFormData) => service.atualizar(id, data), []),
  alterarStatus: useCallback((id: string, status: "ATIVO" | "INATIVO") => service.alterarStatus(id, status), []),
}; }
