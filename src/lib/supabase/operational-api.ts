import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

export async function contextoOperacional(request: NextRequest, perfisEscrita: string[], escrita = false) {
  const usuario = await exigirUsuarioAtivo(request);
  if (escrita && !perfisEscrita.includes(usuario.role)) throw new Error("FORBIDDEN");
  const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario);
  return { usuario, supabase, paroquiaId };
}

export function respostaErroOperacional(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { erro: error.issues[0]?.message ?? "Dados inválidos.", detalhes: error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const mensagem = error instanceof Error ? error.message : "Erro interno.";
  if (mensagem === "UNAUTHENTICATED") return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  if (mensagem === "FORBIDDEN") return NextResponse.json({ erro: "Sem permissão para esta operação." }, { status: 403 });
  if (mensagem === "PARISH_REQUIRED") return NextResponse.json({ erro: "Selecione uma paróquia na Central de Administração." }, { status: 409 });
  return NextResponse.json({ erro: mensagem }, { status: 500 });
}

export async function listarRegistros(request: NextRequest, tabela: string, perfis: string[], campoBusca?: string) {
  const { supabase, paroquiaId } = await contextoOperacional(request, perfis);
  const busca = new URL(request.url).searchParams.get("busca");
  let consulta = supabase.from(tabela).select("id,dados").eq("paroquia_id", paroquiaId).order("created_at", { ascending: false });
  if (busca && campoBusca) consulta = consulta.eq(`dados->>${campoBusca}`, busca).limit(1);
  const { data, error } = await consulta;
  if (error) throw error;
  const registros = (data ?? []).map((item) => ({ id: item.id, ...(item.dados as Record<string, unknown>) }));
  return busca ? registros[0] ?? null : registros;
}

export async function criarRegistro(request: NextRequest, tabela: string, perfis: string[], schema?: ZodType) {
  const { supabase, paroquiaId } = await contextoOperacional(request, perfis, true);
  const id = randomUUID();
  const entrada = await request.json();
  const dados = (schema ? schema.parse(entrada) : entrada) as Record<string, unknown>;
  const { error } = await supabase.from(tabela).insert({ id, paroquia_id: paroquiaId, dados });
  if (error) throw error;
  return { id };
}

export async function buscarRegistro(request: NextRequest, tabela: string, perfis: string[], id: string) {
  const { supabase, paroquiaId } = await contextoOperacional(request, perfis);
  const { data, error } = await supabase.from(tabela).select("id,dados").eq("id", id).eq("paroquia_id", paroquiaId).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, ...(data.dados as Record<string, unknown>) } : null;
}

export async function atualizarRegistro(request: NextRequest, tabela: string, perfis: string[], id: string, schema?: ZodType) {
  const { supabase, paroquiaId } = await contextoOperacional(request, perfis, true);
  const alteracoes = await request.json();
  const atual = await supabase.from(tabela).select("dados").eq("id", id).eq("paroquia_id", paroquiaId).maybeSingle();
  if (atual.error) throw atual.error;
  if (!atual.data) return null;
  const combinados = { ...(atual.data.dados as Record<string, unknown>), ...alteracoes };
  const dados = (schema ? schema.parse(combinados) : combinados) as Record<string, unknown>;
  const { error } = await supabase.from(tabela).update({ dados, updated_at: new Date().toISOString() }).eq("id", id).eq("paroquia_id", paroquiaId);
  if (error) throw error;
  return { id };
}

export async function removerRegistro(request: NextRequest, tabela: string, perfis: string[], id: string) {
  const { supabase, paroquiaId } = await contextoOperacional(request, perfis, true);
  const { error } = await supabase.from(tabela).delete().eq("id", id).eq("paroquia_id", paroquiaId);
  if (error) throw error;
  return { id };
}
