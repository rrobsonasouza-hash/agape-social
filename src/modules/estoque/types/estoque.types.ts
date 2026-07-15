import { MovimentacaoCestas } from "@/modules/cestas/types/cestas.types";

export interface SaldoItemEstoque {
  id: string;
  nome: string;
  unidade: string;
  saldo: number;
  necessarioPorCesta: number;
  coberturaCestas: number;
  limitante: boolean;
}

export interface ResumoEstoque {
  itens: SaldoItemEstoque[];
  cestasProntas: number;
  cestasMontaveis: number;
  totalDisponivel: number;
  investimentoAcumulado: number;
  movimentos: MovimentacaoCestas[];
}
