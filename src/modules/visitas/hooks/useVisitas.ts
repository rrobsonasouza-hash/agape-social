"use client";

import { useCallback } from "react";

import { VisitaService } from "../services/visita.service";
import { StatusVisita, VisitaFormData } from "../schemas/visita.schema";

const service = new VisitaService();

export function useVisitas() {
  const criar = useCallback((data: VisitaFormData) => service.criar(data), []);
  const listar = useCallback(() => service.listar(), []);
  const listarPorFamilia = useCallback(
    (familiaId: string) => service.listarPorFamilia(familiaId),
    []
  );
  const alterarStatus = useCallback(
    (id: string, status: StatusVisita) => service.alterarStatus(id, status),
    []
  );

  return { criar, listar, listarPorFamilia, alterarStatus };
}
