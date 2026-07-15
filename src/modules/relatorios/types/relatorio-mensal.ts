export interface DesempenhoCampanha {
  id: string;
  nome: string;
  meta: number;
  cestasProduzidas: number;
  cestasEntregues: number;
  percentual: number;
}

export interface RelatorioMensal {
  familiasAtendidas: number;
  cestasEntregues: number;
  ausencias: number;
  familiasBloqueadas: number;
  visitasRealizadas: number;
  investimentoParoquia: number;
  entradasPorDoacao: number;
  campanhas: DesempenhoCampanha[];
  familiasComAusencias: Array<{ familiaId: string; nome: string; quantidade: number }>;
  familiasBloqueadasDetalhes: Array<{ id: string; nome: string; faltas: number }>;
}
