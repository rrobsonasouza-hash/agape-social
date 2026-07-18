import { obterTokenAcesso } from "@/lib/auth/client-session";
import { VoluntarioFormData } from "../schemas/voluntario.schema";
import { VoluntarioDocumento } from "../types/voluntario-documento";

async function token() {
  const valor = await obterTokenAcesso();
  if (!valor) throw new Error("Sessão expirada.");
  return valor;
}

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}`, ...init?.headers } });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados as T;
}

export class VoluntarioRepository {
  async criar(data: VoluntarioFormData) {
    const resultado = await requisicao<{ id: string }>("/api/voluntarios", { method: "POST", body: JSON.stringify(data) });
    return resultado.id;
  }

  listar(): Promise<VoluntarioDocumento[]> {
    return requisicao<VoluntarioDocumento[]>("/api/voluntarios");
  }

  buscarPorId(id: string): Promise<VoluntarioDocumento | null> {
    return requisicao<VoluntarioDocumento | null>(`/api/voluntarios/${encodeURIComponent(id)}`);
  }

  atualizar(id: string, data: Partial<VoluntarioFormData>) {
    return requisicao<{ id: string }>(`/api/voluntarios/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });
  }

  alterarStatus(id: string, status: "ATIVO" | "INATIVO") {
    return this.atualizar(id, { status });
  }
}
