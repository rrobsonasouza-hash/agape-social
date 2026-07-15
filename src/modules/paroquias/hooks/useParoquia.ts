"use client";

import { useCallback, useEffect, useState } from "react";

import { ParoquiaService } from "../services/paroquia.service";
import { ParoquiaFormData } from "../schemas/paroquia.schema";
import { ParoquiaDocumento } from "../types/paroquia-documento";

const service = new ParoquiaService();

export function useParoquia(carregarAutomaticamente = true) {
  const [paroquia, setParoquia] = useState<ParoquiaDocumento | null>(null);
  const [carregandoParoquia, setCarregandoParoquia] = useState(
    carregarAutomaticamente
  );

  const buscarPrincipal = useCallback(async () => {
    return service.buscarPrincipal();
  }, []);

  const salvarPrincipal = useCallback(async (data: ParoquiaFormData) => {
    await service.salvarPrincipal(data);
    setParoquia({ id: "principal", ...data });
  }, []);

  useEffect(() => {
    if (!carregarAutomaticamente) return;

    buscarPrincipal()
      .then(setParoquia)
      .finally(() => setCarregandoParoquia(false));
  }, [buscarPrincipal, carregarAutomaticamente]);

  return {
    paroquia,
    carregandoParoquia,
    buscarPrincipal,
    salvarPrincipal,
  };
}
