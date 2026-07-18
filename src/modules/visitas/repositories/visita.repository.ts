import { obterTokenAcesso } from "@/lib/auth/client-session";
import { StatusVisita, VisitaFormData } from "../schemas/visita.schema";
import { VisitaDocumento } from "../types/visita-documento";

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await obterTokenAcesso();
  if (!token) throw new Error("Sessão expirada.");
  const resposta = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers } });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados as T;
}

export class VisitaRepository {
  async criar(data: VisitaFormData): Promise<string> {
    return (await requisicao<{ id: string }>("/api/visitas", { method: "POST", body: JSON.stringify(data) })).id;
  }
  listar(): Promise<VisitaDocumento[]> { return requisicao<VisitaDocumento[]>("/api/visitas"); }
  listarPorFamilia(familiaId: string): Promise<VisitaDocumento[]> { return requisicao<VisitaDocumento[]>(`/api/visitas?familiaId=${encodeURIComponent(familiaId)}`); }
  async alterarStatus(id: string, status: StatusVisita): Promise<void> {
    await requisicao(`/api/visitas/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
  }
}
