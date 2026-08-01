export interface UltimaFamilia {
  id: string;
  nomeResponsavel: string;
  cidade: string;
  status: "ATIVA" | "INATIVA";
  createdAt: Date | null;
}

export interface CampanhaPainel {
  id: string;
  nome: string;
  metaCestas: number;
  recebidas: number;
  distribuidas: number;
  saldo: number;
  dataLimite: string;
}

export interface MesDistribuicao {
  rotulo: string;
  entregues: number;
  ausentes: number;
}

export interface DashboardResumo {
  familiasAtivas: number;
  familiasInativas: number;
  totalFamilias: number;
  familiasCadastradasMes: number;
  cadastrosIncompletos: number;

  voluntariosAtivos: number;
  voluntariosInativos: number;
  totalVoluntarios: number;

  cestasDisponiveis: number;
  campanhasAtivas: number;
  distribuicoesAgendadas: number;
  proximasDistribuicoes: number;
  proximaDataDistribuicao: string | null;
  distribuicoesEntreguesMes: number;
  distribuicoesAusentesMes: number;
  campanhas: CampanhaPainel[];
  distribuicoesPorMes: MesDistribuicao[];

  ultimasFamilias: UltimaFamilia[];
}
