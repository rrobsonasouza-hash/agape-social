import { auth } from "@/lib/firebase/auth";
import { AuditoriaDocumento, AuditoriaEntrada } from "../types/auditoria-documento";

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sessão expirada.");
  const resposta = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers } });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados as T;
}

export class AuditoriaRepository {
  registrar(entrada: AuditoriaEntrada) { return requisicao<{ id: string }>("/api/auditoria", { method: "POST", body: JSON.stringify(entrada) }); }
  listar(limite = 200): Promise<AuditoriaDocumento[]> { return requisicao(`/api/auditoria?limite=${limite}`); }
}
