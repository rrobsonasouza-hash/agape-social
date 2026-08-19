export interface DesempenhoCampanha {
  id: string;
  nome: string;
  meta: number;
  cestasProduzidas: number;
  cestasEntregues: number;
  percentual: number;
}

export interface RelatorioMensal {
  dataCorte: string;
  familiasAtendidas: number;
  cestasEntregues: number;
  ausencias: number;
  faltasAcumuladas: number;
  taxaComparecimento: number;
  familiasEmAlerta: number;
  familiasProximasBloqueio: number;
  pendenciasDeBaixa: number;
  familiasBloqueadas: number;
  visitasRealizadas: number;
  investimentoParoquia: number;
  entradasPorDoacao: number;
  campanhas: DesempenhoCampanha[];
  familiasComAusencias: Array<{
    familiaId: string;
    nome: string;
    quantidadeNoMes: number;
    totalAteCorte: number;
    consecutivas: number;
    ultimaAusencia: string;
  }>;
  familiasBloqueadasDetalhes: Array<{ id: string; nome: string; faltas: number }>;
}
