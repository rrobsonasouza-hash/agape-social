import { auth } from "@/lib/firebase/auth";
import { CampanhaCestasData, MovimentacaoCestasData } from "../schemas/cestas.schema";
import { CampanhaCestas, ItemCestaPadrao, MovimentacaoCestas } from "../types/cestas.types";
async function requisicao<T>(url: string, init?: RequestInit): Promise<T> { const token = await auth.currentUser?.getIdToken(); if (!token) throw new Error("Sessão expirada."); const resposta = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers } }); const dados = await resposta.json(); if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação."); return dados as T; }
export class CestasRepository {
  salvarComposicao(itens: ItemCestaPadrao[]) { return requisicao("/api/cestas/configuracao", { method: "PUT", body: JSON.stringify(itens) }); }
  buscarComposicao(): Promise<ItemCestaPadrao[]> { return requisicao("/api/cestas/configuracao"); }
  criarCampanha(data: CampanhaCestasData) { return requisicao<{ id: string }>("/api/cestas/campanhas", { method: "POST", body: JSON.stringify(data) }); }
  listarCampanhas(): Promise<CampanhaCestas[]> { return requisicao("/api/cestas/campanhas"); }
  criarMovimentacao(data: MovimentacaoCestasData) { return requisicao<{ id: string }>("/api/cestas/movimentacoes", { method: "POST", body: JSON.stringify(data) }); }
  listarMovimentacoes(): Promise<MovimentacaoCestas[]> { return requisicao("/api/cestas/movimentacoes"); }
  criarMovimentacoes(data: MovimentacaoCestasData[]) { return requisicao("/api/cestas/movimentacoes", { method: "POST", body: JSON.stringify(data) }); }
}
