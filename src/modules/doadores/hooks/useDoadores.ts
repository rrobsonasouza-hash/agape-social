"use client";

import { useCallback } from "react";
import { DoadorService } from "../services/doador.service";
import { DoadorFormData } from "../schemas/doador.schema";

const service = new DoadorService();

export function useDoadores() {
  const listar = useCallback(() => service.listar(), []);
  const buscarPorId = useCallback((id: string) => service.buscarPorId(id), []);
  const criar = useCallback((data: DoadorFormData) => service.criar(data), []);
  const atualizar = useCallback((id: string, data: DoadorFormData) => service.atualizar(id, data), []);
  const alterarStatus = useCallback((id: string, status: "ATIVO" | "INATIVO") => service.alterarStatus(id, status), []);
  return { listar, buscarPorId, criar, atualizar, alterarStatus };
}
