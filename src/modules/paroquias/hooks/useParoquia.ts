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
    setParoquia((atual) => ({ id: atual?.id || "principal", ...data }));
  }, []);

  const listar = useCallback(() => service.listar(), []);
  const criar = useCallback((data: ParoquiaFormData) => service.criar(data), []);
  const alterarStatus = useCallback((id: string, ativa: boolean) => service.alterarStatus(id, ativa), []);
  const selecionar = useCallback((id: string) => service.selecionar(id), []);
  const buscarContexto = useCallback(() => service.buscarContexto(), []);
  const limparContexto = useCallback(() => service.limparContexto(), []);

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
    listar,
    criar,
    alterarStatus,
    selecionar,
    buscarContexto,
    limparContexto,
  };
}
