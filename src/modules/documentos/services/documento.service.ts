import { DocumentoRepository } from "../repositories/documento.repository";

import {
  documentoSchema,
} from "../schemas/documento.schema";

import {
  Documento,
  EntidadeDocumento,
  NovoDocumento,
} from "../types/documento.types";

export class DocumentoService {
  private repository = new DocumentoRepository();

  async criar(
    novoDocumento: NovoDocumento
  ): Promise<string> {
    if (!novoDocumento.paroquiaId) {
      throw new Error(
        "A paróquia do documento não foi informada."
      );
    }

    if (!novoDocumento.entidadeId) {
      throw new Error(
        "O registro relacionado ao documento não foi informado."
      );
    }

    const validacao = documentoSchema.safeParse({
      tipo: novoDocumento.tipo,
      observacao: novoDocumento.observacao,
      arquivo: novoDocumento.arquivo,
    });

    if (!validacao.success) {
      const mensagem =
        validacao.error.issues[0]?.message ||
        "Documento inválido.";

      throw new Error(mensagem);
    }

    return this.repository.criar(novoDocumento);
  }

  async listarPorEntidade(
    entidadeTipo: EntidadeDocumento,
    entidadeId: string
  ): Promise<Documento[]> {
    if (!entidadeId) {
      throw new Error(
        "O registro relacionado aos documentos não foi informado."
      );
    }

    return this.repository.listarPorEntidade(
      entidadeTipo,
      entidadeId
    );
  }

  async obterUrlVisualizacao(
    caminhoStorage: string
  ): Promise<string> {
    return this.repository.obterUrlVisualizacao(
      caminhoStorage
    );
  }

  async remover(
    documento: Documento
  ): Promise<void> {
    return this.repository.remover(documento);
  }
}