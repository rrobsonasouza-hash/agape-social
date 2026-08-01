import { obterTokenAcesso } from "@/lib/auth/client-session";
import { DashboardResumo } from "../types/dashboard.types";

type ResumoApi = Omit<
  DashboardResumo,
  | "ultimasFamilias"
  | "cadastrosIncompletos"
  | "cestasDisponiveis"
  | "campanhasAtivas"
  | "distribuicoesAgendadas"
  | "proximasDistribuicoes"
  | "proximaDataDistribuicao"
  | "distribuicoesEntreguesMes"
  | "distribuicoesAusentesMes"
  | "campanhas"
  | "distribuicoesPorMes"
> & {
  ultimasFamilias: Array<
    Omit<DashboardResumo["ultimasFamilias"][number], "createdAt"> & {
      createdAt: string | null;
    }
  >;
};
type ResumoOperacional = Pick<
  DashboardResumo,
  | "cadastrosIncompletos"
  | "cestasDisponiveis"
  | "campanhasAtivas"
  | "distribuicoesAgendadas"
  | "proximasDistribuicoes"
  | "proximaDataDistribuicao"
  | "distribuicoesEntreguesMes"
  | "distribuicoesAusentesMes"
  | "campanhas"
  | "distribuicoesPorMes"
>;

export class DashboardRepository {
  async buscarResumo(): Promise<DashboardResumo> {
    const token = await obterTokenAcesso();
    const headers = { Authorization: `Bearer ${token}` };
    const [resposta, respostaOperacional] = await Promise.all([
      fetch("/api/dashboard", { headers }),
      fetch("/api/dashboard/operacional", { headers }),
    ]);
    const [dados, dadosOperacionais] = await Promise.all([
      resposta.json(),
      respostaOperacional.json(),
    ]);
    if (!respostaOperacional.ok) {
      throw new Error(
        dadosOperacionais.erro ||
          "Não foi possível carregar os indicadores operacionais.",
      );
    }
    if (!resposta.ok)
      throw new Error(
        dados.erro || "Não foi possível carregar os indicadores.",
      );
    const resumo = dados as ResumoApi;
    const operacional = dadosOperacionais as ResumoOperacional;
    return {
      ...resumo,
      ...operacional,
      ultimasFamilias: resumo.ultimasFamilias.map((item) => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt) : null,
      })),
    };
  }
}
