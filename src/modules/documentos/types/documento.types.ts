export type TipoDocumento =
  | "RG"
  | "CPF"
  | "COMPROVANTE_RESIDENCIA"
  | "LAUDO_MEDICO"
  | "RECEITA_MEDICA"
  | "CERTIDAO"
  | "ENCAMINHAMENTO"
  | "FOTO_RESIDENCIA"
  | "OUTRO";

export type EntidadeDocumento =
  | "FAMILIA"
  | "VOLUNTARIO"
  | "DOADOR"
  | "VISITA"
  | "PAROQUIA";

export interface Documento {
  id?: string;

  paroquiaId: string;

  entidadeTipo: EntidadeDocumento;

  entidadeId: string;

  tipo: TipoDocumento;

  nomeArquivo: string;

  nomeOriginal: string;

  caminhoStorage: string;

  mimeType: string;

  tamanhoBytes: number;

  observacao?: string;

  criadoPor?: string;

  criadoEm?: Date;

  atualizadoEm?: Date;
}

export interface NovoDocumento {
  paroquiaId: string;

  entidadeTipo: EntidadeDocumento;

  entidadeId: string;

  tipo: TipoDocumento;

  arquivo: File;

  observacao?: string;

  criadoPor?: string;
}