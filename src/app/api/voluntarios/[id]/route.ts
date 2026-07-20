import { NextRequest, NextResponse } from "next/server";

import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
import { voluntarioSchema } from "@/modules/voluntarios/schemas/voluntario.schema";
import { ZodError } from "zod";

const PERFIS_ESCRITA = ["admin_plataforma", "admin_paroquia", "coordenador"];

async function contexto(request: NextRequest, escrita = false) {
  const usuario = await exigirUsuarioAtivo(request);
  if (escrita && !PERFIS_ESCRITA.includes(usuario.role)) throw new Error("FORBIDDEN");
  return resolverParoquiaDaRequisicao(request, usuario);
}

function respostaErro(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ erro: error.issues[0]?.message ?? "Dados inválidos.", detalhes: error.flatten().fieldErrors }, { status: 400 });
  const mensagem = error instanceof Error ? error.message : "Erro interno.";
  if (mensagem === "UNAUTHENTICATED") return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  if (mensagem === "FORBIDDEN") return NextResponse.json({ erro: "Sem permissão para esta operação." }, { status: 403 });
  return NextResponse.json({ erro: mensagem }, { status: 500 });
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, paroquiaId } = await contexto(request);
    const { id } = await context.params;
    const { data, error } = await supabase.from("voluntarios").select("id,dados").eq("id", id).eq("paroquia_id", paroquiaId).maybeSingle();
    if (error) throw error;
    return NextResponse.json(data ? { id: data.id, ...(data.dados as Record<string, unknown>) } : null);
  } catch (error) {
    return respostaErro(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, paroquiaId } = await contexto(request, true);
    const { id } = await context.params;
    const alteracoes = await request.json();
    const atual = await supabase.from("voluntarios").select("dados").eq("id", id).eq("paroquia_id", paroquiaId).maybeSingle();
    if (atual.error) throw atual.error;
    if (!atual.data) return NextResponse.json({ erro: "Voluntário não encontrado." }, { status: 404 });
    const dados = voluntarioSchema.parse({ ...(atual.data.dados as Record<string, unknown>), ...alteracoes });
    const { error } = await supabase.from("voluntarios").update({ dados, updated_at: new Date().toISOString() }).eq("id", id).eq("paroquia_id", paroquiaId);
    if (error) throw error;
    return NextResponse.json({ id });
  } catch (error) {
    return respostaErro(error);
  }
}
