export interface UltimaFamilia {
  id: string;
  nomeResponsavel: string;
  cidade: string;
  status: "ATIVA" | "INATIVA";
  createdAt: Date | null;
}

export interface DashboardResumo {
  familiasAtivas: number;
  familiasInativas: number;
  totalFamilias: number;
  familiasCadastradasMes: number;
  ultimasFamilias: UltimaFamilia[];
}