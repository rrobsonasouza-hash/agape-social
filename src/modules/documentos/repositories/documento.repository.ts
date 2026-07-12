import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { db } from "@/lib/firebase/firestore";
import { storage } from "@/lib/firebase/storage";

import {
  Documento,
  EntidadeDocumento,
  NovoDocumento,
} from "../types/documento.types";

function normalizarNomeArquivo(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function criarNomeArquivoUnico(nomeOriginal: string): string {
  const nomeNormalizado = normalizarNomeArquivo(nomeOriginal);
  const identificador = crypto.randomUUID();

  return `${identificador}-${nomeNormalizado}`;
}

function criarCaminhoStorage(
  documento: NovoDocumento,
  nomeArquivo: string
): string {
  return [
    "paroquias",
    documento.paroquiaId,
    documento.entidadeTipo.toLowerCase(),
    documento.entidadeId,
    "documentos",
    documento.tipo.toLowerCase(),
    nomeArquivo,
  ].join("/");
}

export class DocumentoRepository {
  async criar(
    novoDocumento: NovoDocumento
  ): Promise<string> {
    const nomeArquivo = criarNomeArquivoUnico(
      novoDocumento.arquivo.name
    );

    const caminhoStorage = criarCaminhoStorage(
      novoDocumento,
      nomeArquivo
    );

    const referenciaStorage = ref(
      storage,
      caminhoStorage
    );

    try {
      await uploadBytes(
        referenciaStorage,
        novoDocumento.arquivo,
        {
          contentType: novoDocumento.arquivo.type,
          customMetadata: {
            paroquiaId: novoDocumento.paroquiaId,
            entidadeTipo: novoDocumento.entidadeTipo,
            entidadeId: novoDocumento.entidadeId,
            tipoDocumento: novoDocumento.tipo,
          },
        }
      );

      const registro = await addDoc(
        collection(db, "documentos"),
        {
          paroquiaId: novoDocumento.paroquiaId,
          entidadeTipo: novoDocumento.entidadeTipo,
          entidadeId: novoDocumento.entidadeId,
          tipo: novoDocumento.tipo,

          nomeArquivo,
          nomeOriginal: novoDocumento.arquivo.name,
          caminhoStorage,

          mimeType: novoDocumento.arquivo.type,
          tamanhoBytes: novoDocumento.arquivo.size,

          observacao:
            novoDocumento.observacao?.trim() || "",

          criadoPor: novoDocumento.criadoPor || "",

          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        }
      );

      return registro.id;
    } catch (error) {
      /*
       * Caso o upload tenha sido concluído, mas o registro no
       * Firestore falhe, tentamos remover o arquivo para evitar
       * documentos órfãos no Storage.
       */
      try {
        await deleteObject(referenciaStorage);
      } catch {
        // Não substitui o erro original.
      }

      throw error;
    }
  }

  async listarPorEntidade(
    entidadeTipo: EntidadeDocumento,
    entidadeId: string
  ): Promise<Documento[]> {
    const consulta = query(
      collection(db, "documentos"),
      where("entidadeTipo", "==", entidadeTipo),
      where("entidadeId", "==", entidadeId)
    );

    const snapshot = await getDocs(consulta);

    return snapshot.docs.map((documento) => {
      const dados = documento.data();

      return {
        id: documento.id,

        paroquiaId: dados.paroquiaId,
        entidadeTipo: dados.entidadeTipo,
        entidadeId: dados.entidadeId,
        tipo: dados.tipo,

        nomeArquivo: dados.nomeArquivo,
        nomeOriginal: dados.nomeOriginal,
        caminhoStorage: dados.caminhoStorage,

        mimeType: dados.mimeType,
        tamanhoBytes: dados.tamanhoBytes,

        observacao: dados.observacao || "",
        criadoPor: dados.criadoPor || "",

        criadoEm:
          dados.criadoEm instanceof Timestamp
            ? dados.criadoEm.toDate()
            : undefined,

        atualizadoEm:
          dados.atualizadoEm instanceof Timestamp
            ? dados.atualizadoEm.toDate()
            : undefined,
      } as Documento;
    });
  }

  async obterUrlVisualizacao(
    caminhoStorage: string
  ): Promise<string> {
    if (!caminhoStorage) {
      throw new Error(
        "Caminho do documento não informado."
      );
    }

    const referenciaStorage = ref(
      storage,
      caminhoStorage
    );

    return getDownloadURL(referenciaStorage);
  }

  async remover(documento: Documento): Promise<void> {
    if (!documento.id) {
      throw new Error(
        "Identificador do documento não informado."
      );
    }

    if (!documento.caminhoStorage) {
      throw new Error(
        "Caminho do documento não informado."
      );
    }

    const referenciaStorage = ref(
      storage,
      documento.caminhoStorage
    );

    await deleteObject(referenciaStorage);

    await deleteDoc(
      doc(db, "documentos", documento.id)
    );
  }
}