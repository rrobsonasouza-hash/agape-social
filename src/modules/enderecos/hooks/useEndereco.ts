"use client";

import { useCallback, useState } from "react";

import { EnderecoService } from "../services/endereco.service";

const service = new EnderecoService();

export function useEndereco() {
  const [consultandoCep, setConsultandoCep] = useState(false);

  const buscarPorCep = useCallback(async (cep: string) => {
    try {
      setConsultandoCep(true);
      return await service.buscarPorCep(cep);
    } finally {
      setConsultandoCep(false);
    }
  }, []);

  return { buscarPorCep, consultandoCep };
}
