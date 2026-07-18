import { obterTokenAcesso } from "@/lib/auth/client-session";
import { DashboardResumo } from "../types/dashboard.types";

type ResumoApi = Omit<DashboardResumo, "ultimasFamilias"> & { ultimasFamilias: Array<Omit<DashboardResumo["ultimasFamilias"][number], "createdAt"> & { createdAt: string | null }> };

export class DashboardRepository {
  async buscarResumo(): Promise<DashboardResumo> {
    const token = await obterTokenAcesso();
    const resposta = await fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar os indicadores.");
    const resumo = dados as ResumoApi;
    return { ...resumo, ultimasFamilias: resumo.ultimasFamilias.map((item) => ({ ...item, createdAt: item.createdAt ? new Date(item.createdAt) : null })) };
  }
}
