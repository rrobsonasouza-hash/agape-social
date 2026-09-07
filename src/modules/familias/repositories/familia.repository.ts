import { obterTokenAcesso } from "@/lib/auth/client-session";
import { FamiliaFormData } from "../schemas/familia.schema";
import { FamiliaDocumento } from "../types/familia-documento";

async function token() {
  const valor = await obterTokenAcesso();
  if (!valor) throw new Error("Sessão expirada.");
  return valor;
}

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}`, ...init?.headers },
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados as T;
}

export class FamiliaRepository {
  criar(data: FamiliaFormData) {
    return requisicao<{ id: string }>("/api/familias", { method: "POST", body: JSON.stringify(data) });
  }

  listar(): Promise<FamiliaDocumento[]> {
    return requisicao<FamiliaDocumento[]>("/api/familias");
  }

  buscarPorId(id: string): Promise<FamiliaDocumento | null> {
    return requisicao<FamiliaDocumento | null>(`/api/familias/${encodeURIComponent(id)}`);
  }

  buscarPorCpf(cpf: string): Promise<FamiliaDocumento | null> {
    return requisicao<FamiliaDocumento | null>(`/api/familias?cpf=${encodeURIComponent(cpf)}`);
  }

  atualizar(id: string, data: FamiliaFormData) {
    return requisicao<{ id: string }>(`/api/familias/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) });
  }

  alterarStatus(id: string, status: "ATIVA" | "INATIVA") {
    return requisicao<{ id: string }>(`/api/familias/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
  }

  avaliarBeneficio(id: string, decisao: "RESTABELECER" | "MANTER_BLOQUEIO", parecer: string) {
    return requisicao<{ id: string; decisao: "RESTABELECER" | "MANTER_BLOQUEIO"; avaliadoEm: string }>(`/api/familias/${encodeURIComponent(id)}/beneficio`, {
      method: "POST",
      body: JSON.stringify({ decisao, parecer }),
    });
  }

  mesclarDuplicado(manterId: string, removerId: string) {
    return requisicao<{ id: string; transferidos: Record<string, number> }>("/api/familias/mesclar", {
      method: "POST",
      body: JSON.stringify({ manterId, removerId, confirmacao: "MESCLAR_DUPLICADO" }),
    });
  }
}
