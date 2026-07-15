"use client";

import { useCallback } from "react";

import { VoluntarioService } from "../services/voluntario.service";
import { VoluntarioFormData } from "../schemas/voluntario.schema";

const service = new VoluntarioService();

export function useVoluntarios() {
  const criar = useCallback(
    async (data: VoluntarioFormData) => {
      return service.criar(data);
    },
    []
  );

  const listar = useCallback(async () => {
    return service.listar();
  }, []);

  const buscarPorId = useCallback(
    async (id: string) => {
      return service.buscarPorId(id);
    },
    []
  );

  const atualizar = useCallback(
    async (
      id: string,
      data: Partial<VoluntarioFormData>
    ) => {
      return service.atualizar(id, data);
    },
    []
  );

  const alterarStatus = useCallback(
    async (
      id: string,
      status: "ATIVO" | "INATIVO"
    ) => {
      return service.alterarStatus(id, status);
    },
    []
  );

  return {
    criar,
    listar,
    buscarPorId,
    atualizar,
    alterarStatus,
  };
}