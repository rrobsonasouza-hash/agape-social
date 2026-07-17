import { auth } from "@/lib/firebase/auth";
import { ParoquiaFormData } from "../schemas/paroquia.schema";
import { ParoquiaDocumento } from "../types/paroquia-documento";

type LinhaParoquia = { id: string; nome: string; ativa?: boolean; endereco?: Record<string, string>; latitude: number; longitude: number; raio_atuacao_km: number };

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sessão expirada.");
  const resposta = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers } });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados as T;
}

function mapear(item: LinhaParoquia): ParoquiaDocumento {
  return { id: item.id, nome: item.nome, cep: item.endereco?.cep || "", logradouro: item.endereco?.logradouro || "", numero: item.endereco?.numero || "", complemento: item.endereco?.complemento || "", bairro: item.endereco?.bairro || "", cidade: item.endereco?.cidade || "", estado: item.endereco?.estado || "", latitude: Number(item.latitude), longitude: Number(item.longitude), raioAtendimentoKm: Number(item.raio_atuacao_km), ativa: item.ativa !== false };
}

export class ParoquiaRepository {
  async listar(): Promise<ParoquiaDocumento[]> { return (await requisicao<LinhaParoquia[]>("/api/paroquias")).map(mapear); }
  async buscarPrincipal(): Promise<ParoquiaDocumento | null> { return (await requisicao<LinhaParoquia[]>("/api/paroquias?atual=1")).map(mapear)[0] ?? null; }
  async salvarPrincipal(data: ParoquiaFormData): Promise<void> { const atual = await this.buscarPrincipal(); if (!atual) throw new Error("Paróquia não encontrada."); await requisicao(`/api/paroquias/${atual.id}`, { method: "PUT", body: JSON.stringify(data) }); }
  async criar(data: ParoquiaFormData): Promise<string> { return (await requisicao<{ id: string }>("/api/paroquias", { method: "POST", body: JSON.stringify(data) })).id; }
  async alterarStatus(id: string, ativa: boolean): Promise<void> { await requisicao(`/api/paroquias/${id}`, { method: "PATCH", body: JSON.stringify({ ativa }) }); }
  async selecionar(id: string): Promise<ParoquiaDocumento> { const resultado = await requisicao<{ paroquia: LinhaParoquia }>("/api/contexto-paroquia", { method: "POST", body: JSON.stringify({ paroquiaId: id }) }); return mapear(resultado.paroquia); }
  async buscarContexto(): Promise<ParoquiaDocumento | null> { const resultado = await requisicao<{ paroquia: LinhaParoquia | null }>("/api/contexto-paroquia"); return resultado.paroquia ? mapear(resultado.paroquia) : null; }
  async limparContexto(): Promise<void> { await requisicao("/api/contexto-paroquia", { method: "DELETE" }); }
}
