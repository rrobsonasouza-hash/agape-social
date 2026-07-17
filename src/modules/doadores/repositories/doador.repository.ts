import { auth } from "@/lib/firebase/auth";
import { DoadorFormData } from "../schemas/doador.schema";
import { DoadorDocumento } from "../types/doador-documento";

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sessão expirada.");
  const resposta = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers } });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados as T;
}

export class DoadorRepository {
  criar(data: DoadorFormData) { return requisicao<{ id: string }>("/api/doadores", { method: "POST", body: JSON.stringify(data) }); }
  listar(): Promise<DoadorDocumento[]> { return requisicao<DoadorDocumento[]>("/api/doadores"); }
  buscarPorId(id: string): Promise<DoadorDocumento | null> { return requisicao<DoadorDocumento | null>(`/api/doadores/${encodeURIComponent(id)}`); }
  buscarPorDocumento(documento: string): Promise<DoadorDocumento | null> { return requisicao<DoadorDocumento | null>(`/api/doadores?busca=${encodeURIComponent(documento)}`); }
  atualizar(id: string, data: DoadorFormData) { return requisicao<{ id: string }>(`/api/doadores/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }); }
  alterarStatus(id: string, status: "ATIVO" | "INATIVO") { return requisicao<{ id: string }>(`/api/doadores/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) }); }
}
