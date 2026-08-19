import { obterTokenAcesso } from "@/lib/auth/client-session";
import {
  DistribuicaoData,
  StatusDistribuicao,
} from "../schemas/distribuicao.schema";
import {
  DistribuicaoDocumento,
  ResumoDataDistribuicao,
} from "../types/distribuicao-documento";
async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await obterTokenAcesso();
  const resposta = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const dados = await resposta.json();
  if (!resposta.ok)
    throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados as T;
}
export class DistribuicaoRepository {
  agendar(data: DistribuicaoData) {
    return requisicao<{ id: string }>("/api/distribuicoes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  buscarPorId(id: string): Promise<DistribuicaoDocumento | null> {
    return requisicao(`/api/distribuicoes/${encodeURIComponent(id)}`);
  }
  listarPorData(data: string): Promise<DistribuicaoDocumento[]> {
    return requisicao(`/api/distribuicoes?data=${encodeURIComponent(data)}`);
  }
  listarDatas(): Promise<ResumoDataDistribuicao[]> {
    return requisicao("/api/distribuicoes?resumo=datas");
  }
  alterarStatus(id: string, status: StatusDistribuicao) {
    return requisicao(`/api/distribuicoes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }
  alterarData(id: string, data: string) {
    return requisicao(`/api/distribuicoes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ data }),
    });
  }
  agendarMuitas(registros: DistribuicaoData[]) {
    return registros.length
      ? requisicao("/api/distribuicoes", {
          method: "POST",
          body: JSON.stringify(registros),
        })
      : Promise.resolve();
  }
  excluirAgendadas(ids: string[]) {
    return requisicao<{ removidas: number }>("/api/distribuicoes", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  }
  marcarAusentes(ids: string[]) {
    return requisicao<{ atualizadas: number }>("/api/distribuicoes", {
      method: "PATCH",
      body: JSON.stringify({ ids, status: "AUSENTE" }),
    });
  }
}
