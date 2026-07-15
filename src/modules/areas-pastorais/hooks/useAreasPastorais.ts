"use client";

import { useCallback } from "react";

import { AreaPastoralService } from "../services/area-pastoral.service";
import { AreaPastoralFormData } from "../schemas/area-pastoral.schema";

const service = new AreaPastoralService();

export function useAreasPastorais() {
  const listar = useCallback(() => service.listar(), []);
  const criar = useCallback(
    (data: AreaPastoralFormData) => service.criar(data),
    []
  );
  const remover = useCallback((id: string) => service.remover(id), []);

  return { listar, criar, remover };
}
