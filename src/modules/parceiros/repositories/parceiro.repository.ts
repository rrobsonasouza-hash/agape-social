import { obterTokenAcesso } from "@/lib/auth/client-session";
import { ParceiroFormData } from "../schemas/parceiro.schema";
import { ParceiroDocumento } from "../types/parceiro-documento";

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await obterTokenAcesso();
  if (!token) throw new Error("Sessão expirada.");
  const resposta = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers } });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados as T;
}

export class ParceiroRepository {
  criar(data: ParceiroFormData) { return requisicao<{ id: string }>("/api/parceiros", { method: "POST", body: JSON.stringify(data) }); }
  listar(): Promise<ParceiroDocumento[]> { return requisicao<ParceiroDocumento[]>("/api/parceiros"); }
  buscarPorId(id: string): Promise<ParceiroDocumento | null> { return requisicao<ParceiroDocumento | null>(`/api/parceiros/${encodeURIComponent(id)}`); }
  buscarPorCnpj(cnpj: string): Promise<ParceiroDocumento | null> { return requisicao<ParceiroDocumento | null>(`/api/parceiros?busca=${encodeURIComponent(cnpj)}`); }
  atualizar(id: string, data: ParceiroFormData) { return requisicao<{ id: string }>(`/api/parceiros/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }); }
  alterarStatus(id: string, status: "ATIVO" | "INATIVO") { return requisicao<{ id: string }>(`/api/parceiros/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) }); }
}
