import { NextRequest, NextResponse } from "next/server";

import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { exigirPermissaoServidor } from "@/lib/auth/server-permissions";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
import { familiaSchema } from "@/modules/familias/schemas/familia.schema";
import {
  encontrarDuplicidadeFamilia,
  ErroDuplicidadeFamilia,
} from "@/modules/familias/duplicidade";
import { ZodError } from "zod";

const PERFIS_ESCRITA = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];
const PERFIS_LEITURA = [...PERFIS_ESCRITA, "voluntario", "leitor"];

async function contexto(request: NextRequest, escrita = false) {
  const usuario = await exigirUsuarioAtivo(request);
  const contextoParoquia = await resolverParoquiaDaRequisicao(request, usuario);
  await exigirPermissaoServidor(contextoParoquia.supabase, contextoParoquia.paroquiaId, usuario.role, "/familias", escrita ? PERFIS_ESCRITA : PERFIS_LEITURA);
  return contextoParoquia;
}

function respostaErro(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ erro: error.issues[0]?.message ?? "Dados inválidos.", detalhes: error.flatten().fieldErrors }, { status: 400 });
  if (error instanceof ErroDuplicidadeFamilia)
    return NextResponse.json({ erro: error.message, cadastroExistenteId: error.duplicidade.id }, { status: 409 });
  const mensagem = error instanceof Error ? error.message : "Erro interno.";
  if (mensagem === "UNAUTHENTICATED") return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  if (mensagem === "FORBIDDEN") return NextResponse.json({ erro: "Sem permissão para esta operação." }, { status: 403 });
  return NextResponse.json({ erro: mensagem }, { status: 500 });
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, paroquiaId } = await contexto(request);
    const { id } = await context.params;
    const { data, error } = await supabase.from("familias").select("id,dados").eq("id", id).eq("paroquia_id", paroquiaId).maybeSingle();
    if (error) throw error;
    return NextResponse.json(data ? { id: data.id, ...(data.dados as Record<string, unknown>) } : null);
  } catch (error) {
    return respostaErro(error);
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, paroquiaId } = await contexto(request, true);
    const { id } = await context.params;
    const dados = familiaSchema.parse(await request.json());
    const existentes = await supabase.from("familias").select("id,dados").eq("paroquia_id", paroquiaId);
    if (existentes.error) throw existentes.error;
    const duplicidade = encontrarDuplicidadeFamilia(
      dados,
      (existentes.data ?? []).map((item) => ({ id: String(item.id), dados: item.dados as Record<string, unknown> })),
      id,
    );
    if (duplicidade) throw new ErroDuplicidadeFamilia(duplicidade);
    const { error } = await supabase.from("familias").update({ dados, updated_at: new Date().toISOString() }).eq("id", id).eq("paroquia_id", paroquiaId);
    if (error) throw error;
    return NextResponse.json({ id });
  } catch (error) {
    return respostaErro(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, paroquiaId } = await contexto(request, true);
    const { id } = await context.params;
    const alteracoes = await request.json();
    const atual = await supabase.from("familias").select("dados").eq("id", id).eq("paroquia_id", paroquiaId).maybeSingle();
    if (atual.error) throw atual.error;
    if (!atual.data) return NextResponse.json({ erro: "Família não encontrada." }, { status: 404 });
    const dados = familiaSchema.parse({ ...(atual.data.dados as Record<string, unknown>), ...alteracoes });
    const { error } = await supabase.from("familias").update({ dados, updated_at: new Date().toISOString() }).eq("id", id).eq("paroquia_id", paroquiaId);
    if (error) throw error;
    return NextResponse.json({ id });
  } catch (error) {
    return respostaErro(error);
  }
}
