import { randomUUID } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { NextRequest, NextResponse } from "next/server";

import { exigirAdministrador } from "@/lib/auth/admin-request";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
import { GET as gerarBackup } from "../route";

const BUCKET = "backups-paroquiais";
const LIMITE_BACKUPS = 30;
const LIMITE_ARQUIVO = 50 * 1024 * 1024;

function responderErro(error: unknown) {
  const mensagem = error instanceof Error ? error.message : "Não foi possível acessar os backups na nuvem.";
  const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : mensagem === "PARISH_REQUIRED" ? 409 : 500;
  return NextResponse.json({ erro: mensagem }, { status });
}

async function contexto(request: NextRequest) {
  const administrador = await exigirAdministrador(request);
  const tenant = await resolverParoquiaDaRequisicao(request, administrador);
  return { administrador, ...tenant };
}

async function garantirBucket() {
  const supabase = supabaseAdmin();
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: LIMITE_ARQUIVO,
      allowedMimeTypes: ["application/json", "application/gzip"],
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  } else if (data.file_size_limit !== LIMITE_ARQUIVO || !data.allowed_mime_types?.includes("application/gzip")) {
    const { error } = await supabase.storage.updateBucket(BUCKET, {
      public: false,
      fileSizeLimit: LIMITE_ARQUIVO,
      allowedMimeTypes: ["application/json", "application/gzip"],
    });
    if (error) throw error;
  }
  return supabase;
}

function nomeSeguro(nome: string) {
  if (!nome || nome.includes("/") || nome.includes("\\") || (!nome.endsWith(".json") && !nome.endsWith(".json.gz"))) throw new Error("Arquivo de backup inválido.");
  return nome;
}

export async function GET(request: NextRequest) {
  try {
    const { paroquiaId } = await contexto(request);
    const supabase = await garantirBucket();
    const nome = request.nextUrl.searchParams.get("arquivo");
    if (nome) {
      const arquivo = nomeSeguro(nome);
      const { data, error } = await supabase.storage.from(BUCKET).download(`${paroquiaId}/${arquivo}`);
      if (error) throw error;
      const armazenado = Buffer.from(await data.arrayBuffer());
      const conteudo = arquivo.endsWith(".gz") ? gunzipSync(armazenado) : armazenado;
      const nomeDownload = arquivo.replace(/\.gz$/, "");
      return new NextResponse(conteudo, {
        headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${nomeDownload}"`, "Cache-Control": "no-store" },
      });
    }
    const { data, error } = await supabase.storage.from(BUCKET).list(paroquiaId, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw error;
    const arquivos = (data ?? []).filter((item) => item.name.startsWith("backup-agape-") && (item.name.endsWith(".json") || item.name.endsWith(".json.gz"))).map((item) => ({
      nome: item.name,
      tamanhoBytes: Number(item.metadata?.size ?? 0),
      criadoEm: item.created_at,
    }));
    const statusArquivo = await supabase.storage.from(BUCKET).download(`${paroquiaId}/.status-backup-diario.json`);
    let statusAutomatico: Record<string, unknown> | null = null;
    if (statusArquivo.data) { try { statusAutomatico = JSON.parse(await statusArquivo.data.text()); } catch { statusAutomatico = null; } }
    const agoraBrasil = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    agoraBrasil.setDate(agoraBrasil.getDate() + 1);
    const proximaExecucao = new Date(Date.UTC(agoraBrasil.getFullYear(), agoraBrasil.getMonth(), agoraBrasil.getDate(), 3)).toISOString();
    return NextResponse.json({ arquivos, totalBytes: arquivos.reduce((total, item) => total + item.tamanhoBytes, 0), limite: LIMITE_BACKUPS, statusAutomatico, proximaExecucao });
  } catch (error) { return responderErro(error); }
}

export async function POST(request: NextRequest) {
  try {
    const { administrador, supabase, paroquiaId } = await contexto(request);
    const resposta = await gerarBackup(request);
    if (!resposta.ok) return resposta;
    const conteudo = await resposta.text();
    const nomeBase = resposta.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "backup-agape.json";
    const nome = nomeBase.replace(/\.json$/, `-${new Date().toISOString().replace(/[:.]/g, "-")}.json.gz`);
    const compactado = gzipSync(Buffer.from(conteudo, "utf8"), { level: 9 });
    if (compactado.byteLength > LIMITE_ARQUIVO) throw new Error("Mesmo compactado, o backup excede 50 MB. Reduza o período de auditoria antes de tentar novamente.");
    const storage = await garantirBucket();
    const { error } = await storage.storage.from(BUCKET).upload(`${paroquiaId}/${nome}`, compactado, { contentType: "application/gzip", upsert: false });
    if (error) throw error;

    const { data: existentes } = await storage.storage.from(BUCKET).list(paroquiaId, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    const excedentes = (existentes ?? []).filter((item) => item.name.startsWith("backup-agape-") && (item.name.endsWith(".json") || item.name.endsWith(".json.gz"))).slice(LIMITE_BACKUPS).map((item) => `${paroquiaId}/${item.name}`);
    if (excedentes.length) await storage.storage.from(BUCKET).remove(excedentes);

    await supabase.from("auditoria").insert({ id: randomUUID(), paroquia_id: paroquiaId, dados: { acao: "ARMAZENAMENTO", entidade: "BACKUP", entidadeId: paroquiaId, descricao: `Backup salvo no cofre privado: ${nome}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome, usuarioEmail: administrador.email, paroquiaId, data: new Date().toISOString() } });
    return NextResponse.json({ nome, tamanhoBytes: compactado.byteLength, tamanhoOriginalBytes: Buffer.byteLength(conteudo), removidosPorRetencao: excedentes.length });
  } catch (error) { return responderErro(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const { administrador, supabase, paroquiaId } = await contexto(request);
    const nome = nomeSeguro(request.nextUrl.searchParams.get("arquivo") ?? "");
    const storage = await garantirBucket();
    const { error } = await storage.storage.from(BUCKET).remove([`${paroquiaId}/${nome}`]);
    if (error) throw error;
    await supabase.from("auditoria").insert({ id: randomUUID(), paroquia_id: paroquiaId, dados: { acao: "EXCLUSÃO", entidade: "BACKUP", entidadeId: paroquiaId, descricao: `Backup removido do cofre privado: ${nome}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome, usuarioEmail: administrador.email, paroquiaId, data: new Date().toISOString() } });
    return NextResponse.json({ sucesso: true });
  } catch (error) { return responderErro(error); }
}
