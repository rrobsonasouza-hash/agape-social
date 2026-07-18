import { obterTokenAcesso } from "@/lib/auth/client-session";
import { Documento, EntidadeDocumento, NovoDocumento } from "../types/documento.types";

async function token() { return obterTokenAcesso(); }
async function respostaJson(resposta: Response) { const dados = await resposta.json(); if (!resposta.ok) throw new Error(dados.erro || "Operação não concluída."); return dados; }

export class DocumentoRepository {
  async criar(novo: NovoDocumento): Promise<string> {
    const formulario = new FormData(); formulario.append("arquivo", novo.arquivo); formulario.append("entidadeTipo", novo.entidadeTipo); formulario.append("entidadeId", novo.entidadeId); formulario.append("tipo", novo.tipo); formulario.append("observacao", novo.observacao || "");
    const resposta = await fetch("/api/documentos", { method: "POST", headers: { Authorization: `Bearer ${await token()}` }, body: formulario });
    return (await respostaJson(resposta)).id;
  }
  async listarPorEntidade(entidadeTipo: EntidadeDocumento, entidadeId: string): Promise<Documento[]> {
    const parametros = new URLSearchParams({ entidadeTipo, entidadeId }); const resposta = await fetch(`/api/documentos?${parametros}`, { headers: { Authorization: `Bearer ${await token()}` } }); const dados = await respostaJson(resposta);
    return dados.map((item: Record<string, unknown>) => ({ id: item.id, paroquiaId: item.paroquia_id, entidadeTipo: item.entidade_tipo, entidadeId: item.entidade_id, tipo: item.tipo, nomeArquivo: String(item.caminho_storage).split("/").pop() || "", nomeOriginal: item.nome_original, caminhoStorage: item.caminho_storage, mimeType: item.mime_type, tamanhoBytes: item.tamanho_bytes, observacao: item.observacao, criadoPor: item.criado_por, criadoEm: item.created_at ? new Date(String(item.created_at)) : undefined, atualizadoEm: item.updated_at ? new Date(String(item.updated_at)) : undefined } as Documento));
  }
  async obterUrlVisualizacao(caminhoStorage: string): Promise<string> { const resposta = await fetch(`/api/documentos/url?caminho=${encodeURIComponent(caminhoStorage)}`, { headers: { Authorization: `Bearer ${await token()}` } }); return (await respostaJson(resposta)).url; }
  async remover(documento: Documento): Promise<void> { if (!documento.id) throw new Error("Documento não informado."); const resposta = await fetch(`/api/documentos/${documento.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${await token()}` } }); await respostaJson(resposta); }
}
