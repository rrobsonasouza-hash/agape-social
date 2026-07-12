"use client";

import { useCallback } from "react";

import { DocumentoService } from "../services/documento.service";

import {
  Documento,
  EntidadeDocumento,
  NovoDocumento,
} from "../types/documento.types";

const service = new DocumentoService();

export function useDocumentos() {
  const criar = useCallback(
    async (
      novoDocumento: NovoDocumento
    ): Promise<string> => {
      return service.criar(novoDocumento);
    },
    []
  );

  const listarPorEntidade = useCallback(
    async (
      entidadeTipo: EntidadeDocumento,
      entidadeId: string
    ): Promise<Documento[]> => {
      return service.listarPorEntidade(
        entidadeTipo,
        entidadeId
      );
    },
    []
  );

  const obterUrlVisualizacao = useCallback(
    async (
      caminhoStorage: string
    ): Promise<string> => {
      return service.obterUrlVisualizacao(
        caminhoStorage
      );
    },
    []
  );

  const remover = useCallback(
    async (
      documento: Documento
    ): Promise<void> => {
      return service.remover(documento);
    },
    []
  );

  return {
    criar,
    listarPorEntidade,
    obterUrlVisualizacao,
    remover,
  };
}