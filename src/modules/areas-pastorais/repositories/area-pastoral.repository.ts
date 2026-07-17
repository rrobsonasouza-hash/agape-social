import { auth } from "@/lib/firebase/auth";
import { AreaPastoralFormData } from "../schemas/area-pastoral.schema";
import { AreaPastoralDocumento } from "../types/area-pastoral-documento";

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sessão expirada.");
  const resposta = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers } });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados as T;
}

export class AreaPastoralRepository {
  async criar(data: AreaPastoralFormData): Promise<string> {
    return (await requisicao<{ id: string }>("/api/areas-pastorais", { method: "POST", body: JSON.stringify(data) })).id;
  }
  listar(): Promise<AreaPastoralDocumento[]> { return requisicao<AreaPastoralDocumento[]>("/api/areas-pastorais"); }
  async remover(id: string): Promise<void> {
    await requisicao(`/api/areas-pastorais/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
}
