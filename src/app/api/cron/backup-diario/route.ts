import { randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { calcularSha256, resumirColecoes, totalizarResumo } from "@/modules/backup/integridade";

const BUCKET = "backups-paroquiais";
const LIMITE_BACKUPS = 30;
const LIMITE_ARQUIVO = 50 * 1024 * 1024;
const tabelas = ["familias", "voluntarios", "doadores", "parceiros", "visitas", "areas_pastorais", "campanhas_cestas", "movimentacoes_cestas", "distribuicoes_cestas", "configuracoes", "auditoria", "secretaria_categorias_produtos", "secretaria_produtos", "secretaria_movimentacoes_estoque", "secretaria_vendas", "secretaria_servicos", "secretaria_horarios_celebracoes", "secretaria_eventos", "secretaria_dizimistas", "secretaria_dizimos_pagamentos", "secretaria_registros_sacramentais", "secretaria_registros_sacramentais_historico", "secretaria_documentos_emitidos", "secretaria_documentos_avulsos", "secretaria_solicitacoes", "secretaria_solicitacoes_historico", "tesouraria_contas", "tesouraria_categorias", "tesouraria_movimentacoes", "tesouraria_caixas", "tesouraria_caixa_operacoes"] as const;

function autorizado(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  return Boolean(segredo && request.headers.get("authorization") === `Bearer ${segredo}`);
}

function slug(nome: string) {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "paroquia";
}

async function garantirBucket() {
  const supabase = supabaseAdmin();
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: false, fileSizeLimit: LIMITE_ARQUIVO, allowedMimeTypes: ["application/json", "application/gzip"] });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  return supabase;
}

async function gravarStatus(paroquiaId: string, status: Record<string, unknown>) {
  const supabase = await garantirBucket();
  await supabase.storage.from(BUCKET).upload(`${paroquiaId}/.status-backup-diario.json`, JSON.stringify(status), { contentType: "application/json", upsert: true });
}

async function executarBackup(paroquia: Record<string, unknown>) {
  const supabase = await garantirBucket();
  const paroquiaId = String(paroquia.id);
  const consultas = await Promise.all(tabelas.map(async (tabela) => {
    const { data, error } = await supabase.from(tabela).select("*").eq("paroquia_id", paroquiaId).order("created_at", { ascending: true });
    if (error) throw error;
    return [tabela, data ?? []] as const;
  }));
  const [perfis, documentos] = await Promise.all([
    supabase.from("perfis").select("id,paroquia_id,nome,email,telefone,perfil,status,observacoes,created_at,updated_at").eq("paroquia_id", paroquiaId).order("nome"),
    supabase.from("documentos").select("id,paroquia_id,entidade_tipo,entidade_id,tipo,nome_original,caminho_storage,mime_type,tamanho_bytes,observacao,criado_por,created_at,updated_at").eq("paroquia_id", paroquiaId).order("created_at"),
  ]);
  if (perfis.error) throw perfis.error;
  if (documentos.error) throw documentos.error;
  const dados = { ...Object.fromEntries(consultas), perfis: perfis.data ?? [], documentos: documentos.data ?? [] };
  const resumo = resumirColecoes(dados);
  const geradoEm = new Date().toISOString();
  const conteudo = JSON.stringify({ formato: "agape-social-backup", versao: 3, geradoEm, geradoPor: { id: "sistema", nome: "Backup automático", email: "" }, paroquia, resumo, totalRegistros: totalizarResumo(resumo), integridade: { algoritmo: "SHA-256", dadosSha256: calcularSha256(dados) }, dados }, null, 2);
  const compactado = gzipSync(Buffer.from(conteudo), { level: 9 });
  if (compactado.byteLength > LIMITE_ARQUIVO) throw new Error("Backup compactado excede 50 MB.");
  const dataBrasil = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const nome = `backup-agape-${slug(String(paroquia.nome))}-automatico-${dataBrasil}.json.gz`;
  const { error } = await supabase.storage.from(BUCKET).upload(`${paroquiaId}/${nome}`, compactado, { contentType: "application/gzip", upsert: true });
  if (error) throw error;
  const { data: existentes } = await supabase.storage.from(BUCKET).list(paroquiaId, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
  const excedentes = (existentes ?? []).filter((item) => item.name.startsWith("backup-agape-") && (item.name.endsWith(".json") || item.name.endsWith(".json.gz"))).slice(LIMITE_BACKUPS).map((item) => `${paroquiaId}/${item.name}`);
  if (excedentes.length) await supabase.storage.from(BUCKET).remove(excedentes);
  await supabase.from("auditoria").insert({ id: randomUUID(), paroquia_id: paroquiaId, dados: { acao: "BACKUP_AUTOMATICO", entidade: "BACKUP", entidadeId: paroquiaId, descricao: `Backup automático diário salvo no cofre: ${nome}.`, usuarioId: "sistema", usuarioNome: "Sistema", usuarioEmail: "", paroquiaId, data: geradoEm } });
  const resultado = { paroquiaId, nome, tamanhoBytes: compactado.byteLength, totalRegistros: totalizarResumo(resumo), concluidoEm: new Date().toISOString() };
  await gravarStatus(paroquiaId, { status: "SUCESSO", ...resultado });
  return resultado;
}

export async function GET(request: NextRequest) {
  if (!autorizado(request)) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  try {
    const supabase = supabaseAdmin();
    const { data: paroquias, error } = await supabase.from("paroquias").select("*").eq("ativa", true).order("nome");
    if (error) throw error;
    const resultados = [];
    const falhas = [];
    for (const paroquia of paroquias ?? []) {
      try { resultados.push(await executarBackup(paroquia)); }
      catch (errorParoquia) {
        const falha = { paroquiaId: String(paroquia.id), erro: errorParoquia instanceof Error ? errorParoquia.message : "Falha desconhecida", concluidoEm: new Date().toISOString() };
        falhas.push(falha);
        await gravarStatus(String(paroquia.id), { status: "FALHA", ...falha }).catch(() => undefined);
      }
    }
    return NextResponse.json({ executadoEm: new Date().toISOString(), sucesso: resultados.length, falhas, resultados }, { status: falhas.length ? 207 : 200 });
  } catch (error) {
    return NextResponse.json({ erro: error instanceof Error ? error.message : "Não foi possível executar o backup diário." }, { status: 500 });
  }
}
