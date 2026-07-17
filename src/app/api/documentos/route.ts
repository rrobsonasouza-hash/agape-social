import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

const tiposMime = ["application/pdf", "image/jpeg", "image/png"];
async function contexto(request: NextRequest, escrita = false) {
  const usuario = await exigirUsuarioAtivo(request);
  if (escrita && !["admin_plataforma", "admin_paroquia", "coordenador", "operador"].includes(usuario.role)) throw new Error("FORBIDDEN");
  const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario);
  return { usuario, supabase, paroquiaId };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contexto(request); const url = new URL(request.url); const entidadeTipo = url.searchParams.get("entidadeTipo"); const entidadeId = url.searchParams.get("entidadeId");
    if (!entidadeTipo || !entidadeId) throw new Error("Entidade não informada.");
    const { data, error } = await supabase.from("documentos").select("*").eq("paroquia_id", paroquiaId).eq("entidade_tipo", entidadeTipo).eq("entidade_id", entidadeId).order("created_at", { ascending: false });
    if (error) throw error; return NextResponse.json(data ?? []);
  } catch (error) { return NextResponse.json({ erro: error instanceof Error ? error.message : "Erro ao listar documentos." }, { status: 400 }); }
}

export async function POST(request: NextRequest) {
  try {
    const { usuario, supabase, paroquiaId } = await contexto(request, true); const formulario = await request.formData(); const arquivo = formulario.get("arquivo");
    if (!(arquivo instanceof File)) throw new Error("Selecione um arquivo.");
    if (!tiposMime.includes(arquivo.type) || arquivo.size > 5 * 1024 * 1024) throw new Error("Utilize PDF, JPG ou PNG de até 5 MB.");
    const entidadeTipo = String(formulario.get("entidadeTipo") || ""); const entidadeId = String(formulario.get("entidadeId") || ""); const tipo = String(formulario.get("tipo") || "OUTRO");
    const extensao = arquivo.name.split(".").pop()?.toLowerCase() || "bin"; const caminho = `${paroquiaId}/${entidadeTipo.toLowerCase()}/${entidadeId}/${randomUUID()}.${extensao}`;
    const bytes = Buffer.from(await arquivo.arrayBuffer()); const envio = await supabase.storage.from("agape-documentos").upload(caminho, bytes, { contentType: arquivo.type });
    if (envio.error) throw envio.error;
    const registro = await supabase.from("documentos").insert({ paroquia_id: paroquiaId, entidade_tipo: entidadeTipo, entidade_id: entidadeId, tipo, nome_original: arquivo.name, caminho_storage: caminho, mime_type: arquivo.type, tamanho_bytes: arquivo.size, observacao: String(formulario.get("observacao") || ""), criado_por: null }).select("id").single();
    if (registro.error) { await supabase.storage.from("agape-documentos").remove([caminho]); throw registro.error; }
    return NextResponse.json({ id: registro.data.id, criadoPor: usuario.uid }, { status: 201 });
  } catch (error) { return NextResponse.json({ erro: error instanceof Error ? error.message : "Erro ao enviar documento." }, { status: 400 }); }
}
