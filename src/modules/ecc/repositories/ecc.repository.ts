import { obterTokenAcesso } from "@/lib/auth/client-session";
import type {
  EccCasalFormData,
  EccEncontroFormData,
  EccEquipeFormData,
  EccParticipacaoFormData,
  EccProgramacaoFormData,
  EccTarefaFormData,
  EccVinculoCasalFormData,
  EccNovoVoluntarioFormData,
  EccVisitaFormData,
  EccComunicacaoFormData,
  EccDocumentoFormData,
  EccCredenciamentoFormData,
  EccArrecadacaoFormData,
} from "../schemas/ecc.schema";
import type { EccComunicacaoStatus, EccDocumentoStatus, EccPainel, EccProgramacaoStatus, EccTarefaStatus } from "../types/ecc.types";

async function requisicao<T>(init?: RequestInit): Promise<T> {
  const token = await obterTokenAcesso();
  if (!token) throw new Error("Sessão expirada.");
  const resposta = await fetch("/api/ecc", {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const dados = await resposta.json();
  if (!resposta.ok)
    throw new Error(dados.erro || "Não foi possível concluir a operação do ECC.");
  return dados as T;
}

async function requisicaoDocumento<T>(caminho: string, init?: RequestInit): Promise<T> {
  const token = await obterTokenAcesso();
  if (!token) throw new Error("Sessão expirada.");
  const resposta = await fetch(caminho, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init?.headers },
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação com o documento.");
  return dados as T;
}

export class EccRepository {
  listar() { return requisicao<EccPainel>(); }
  criarEncontro(dados: EccEncontroFormData) { return requisicao<{ id: string }>({ method: "POST", body: JSON.stringify({ tipo: "encontro", dados }) }); }
  criarCasal(dados: EccCasalFormData) { return requisicao<{ id: string }>({ method: "POST", body: JSON.stringify({ tipo: "casal", dados }) }); }
  atualizarCasal(id: string, dados: EccCasalFormData) { return requisicao<{ id: string }>({ method: "PATCH", body: JSON.stringify({ tipo: "casal", id, dados }) }); }
  vincularCasal(dados: EccVinculoCasalFormData) { return requisicao<{ id: string }>({ method: "POST", body: JSON.stringify({ tipo: "participacao", dados }) }); }
  adicionarEquipe(dados: EccEquipeFormData) { return requisicao<{ id: string }>({ method: "POST", body: JSON.stringify({ tipo: "equipe", dados }) }); }
  criarProgramacao(dados: EccProgramacaoFormData) { return requisicao<{ id: string }>({ method: "POST", body: JSON.stringify({ tipo: "programacao", dados }) }); }
  criarTarefa(dados: EccTarefaFormData) { return requisicao<{ id: string }>({ method: "POST", body: JSON.stringify({ tipo: "tarefa", dados }) }); }
  cadastrarConjugeComoVoluntario(dados: EccNovoVoluntarioFormData) { return requisicao<{ id: string }>({ method: "POST", body: JSON.stringify({ tipo: "voluntario", dados }) }); }
  criarVisita(dados: EccVisitaFormData) { return requisicao<{ id: string }>({ method: "POST", body: JSON.stringify({ tipo: "visita", dados }) }); }
  criarComunicacao(dados: EccComunicacaoFormData) { return requisicao<{ id: string }>({ method: "POST", body: JSON.stringify({ tipo: "comunicacao", dados }) }); }
  criarDocumento(dados: EccDocumentoFormData) { return requisicao<{ id: string }>({ method: "POST", body: JSON.stringify({ tipo: "documento", dados }) }); }
  enviarDocumento(dados: EccDocumentoFormData, arquivo: File) {
    const formulario = new FormData();
    formulario.set("arquivo", arquivo);
    formulario.set("encontroId", dados.encontroId);
    formulario.set("titulo", dados.titulo);
    formulario.set("categoria", dados.categoria);
    formulario.set("observacoes", dados.observacoes);
    formulario.set("status", dados.status);
    return requisicaoDocumento<{ id: string }>("/api/ecc/documentos", { method: "POST", body: formulario });
  }
  abrirDocumento(id: string) { return requisicaoDocumento<{ url: string }>(`/api/ecc/documentos/${id}`); }
  excluirDocumento(id: string) { return requisicaoDocumento<{ id: string }>(`/api/ecc/documentos/${id}`, { method: "DELETE" }); }
  registrarCredenciamento(dados: EccCredenciamentoFormData) { return requisicao<{ id: string }>({ method: "POST", body: JSON.stringify({ tipo: "credenciamento", dados }) }); }
  criarArrecadacao(dados: EccArrecadacaoFormData) { return requisicao<{ id: string }>({ method: "POST", body: JSON.stringify({ tipo: "arrecadacao", dados }) }); }
  atualizarArrecadacao(id: string, dados: EccArrecadacaoFormData) { return requisicao<{ id: string }>({ method: "PATCH", body: JSON.stringify({ tipo: "arrecadacao", id, dados }) }); }
  atualizarVisita(id: string, dados: EccVisitaFormData) { return requisicao<{ id: string }>({ method: "PATCH", body: JSON.stringify({ tipo: "visita", id, dados }) }); }
  atualizarParticipacao(id: string, dados: EccParticipacaoFormData) { return requisicao<{ id: string }>({ method: "PATCH", body: JSON.stringify({ tipo: "participacao", id, dados }) }); }
  atualizarTarefa(id: string, status: EccTarefaStatus) { return requisicao<{ id: string }>({ method: "PATCH", body: JSON.stringify({ tipo: "tarefa", id, dados: { status } }) }); }
  atualizarProgramacao(id: string, status: EccProgramacaoStatus) { return requisicao<{ id: string }>({ method: "PATCH", body: JSON.stringify({ tipo: "programacao", id, dados: { status } }) }); }
  atualizarComunicacao(id: string, status: EccComunicacaoStatus) { return requisicao<{ id: string }>({ method: "PATCH", body: JSON.stringify({ tipo: "comunicacao", id, dados: { status } }) }); }
  atualizarDocumento(id: string, status: EccDocumentoStatus) { return requisicao<{ id: string }>({ method: "PATCH", body: JSON.stringify({ tipo: "documento", id, dados: { status } }) }); }
}
