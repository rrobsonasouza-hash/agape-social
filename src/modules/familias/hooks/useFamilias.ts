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

  return {
    listar,
    criar,
  };
}