"use client";

import { useCallback } from "react";

import { FamiliaService } from "../services/familia.service";
import { FamiliaFormData } from "../schemas/familia.schema";

const service = new FamiliaService();

export function useFamilias() {
  const listar = useCallback(async () => {
    return service.listar();
  }, []);

  const criar = useCallback(async (data: FamiliaFormData) => {
    return service.criar(data);
  }, []);

  const buscarPorId = useCallback(async (id: string) => {
    return service.buscarPorId(id);
  }, []);

  const atualizar = useCallback(
    async (id: string, data: FamiliaFormData) => {
      return service.atualizar(id, data);
    },
    []
  );

  const alterarStatus = useCallback(
    async (
      id: string,
      status: "ATIVA" | "INATIVA"
    ) => {
      return service.alterarStatus(id, status);
    },
    []
  );

  return {
    listar,
    criar,
    buscarPorId,
    atualizar,
    alterarStatus,
  };
}