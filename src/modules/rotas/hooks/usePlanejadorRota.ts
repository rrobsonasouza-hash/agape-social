"use client";

import { useCallback } from "react";

import { FamiliaDocumento } from "@/modules/familias/types/familia-documento";
import { VisitaDocumento } from "@/modules/visitas/types/visita-documento";
import { PlanejadorRotaService } from "../services/planejador-rota.service";
import { PontoRota } from "../types/rota-planejada";

const service = new PlanejadorRotaService();

export function usePlanejadorRota() {
  const planejar = useCallback(
    (visitas: VisitaDocumento[], familias: FamiliaDocumento[], origem: PontoRota) =>
      service.planejar(visitas, familias, origem),
    []
  );

  return { planejar };
}
