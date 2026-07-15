export interface AuditoriaDocumento {
  id: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  descricao: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioEmail: string;
  paroquiaId: string;
  data?: { toDate?: () => Date } | Date | null;
}

export type AuditoriaEntrada = Omit<AuditoriaDocumento, "id" | "data">;
