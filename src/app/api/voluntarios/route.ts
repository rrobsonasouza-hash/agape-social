import { randomUUID } from "node:crypto";
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

export async function GET(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contexto(request);
    const { data, error } = await supabase.from("voluntarios").select("id,dados").eq("paroquia_id", paroquiaId).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json((data ?? []).map((item) => ({ id: item.id, ...(item.dados as Record<string, unknown>) })));
  } catch (error) {
    return respostaErro(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contexto(request, true);
    const dados = voluntarioSchema.parse(await request.json());
    const id = randomUUID();
    const { error } = await supabase.from("voluntarios").insert({ id, paroquia_id: paroquiaId, dados });
    if (error) throw error;
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return respostaErro(error);
  }
}
