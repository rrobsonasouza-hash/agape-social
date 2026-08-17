import { obterTokenAcesso } from "@/lib/auth/client-session";
import { AuditoriaDocumento } from "../types/auditoria-documento";

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await obterTokenAcesso();
  if (!token) throw new Error("Sessão expirada.");
  const resposta = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers } });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados as T;
}

export class AuditoriaRepository {
  listar(limite = 200): Promise<AuditoriaDocumento[]> { return requisicao(`/api/auditoria?limite=${limite}`); }
}
