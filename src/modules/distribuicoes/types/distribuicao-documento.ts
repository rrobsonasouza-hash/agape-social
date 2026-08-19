import { DistribuicaoData } from "../schemas/distribuicao.schema";
export type DistribuicaoDocumento = DistribuicaoData & { id: string };

export type ResumoDataDistribuicao = {
  data: string;
  total: number;
  agendadas: number;
  recebidas: number;
  ausentes: number;
};
