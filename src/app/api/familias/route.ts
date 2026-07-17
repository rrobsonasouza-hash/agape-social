import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

const PERFIS_ESCRITA = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];

async function contexto(request: NextRequest, escrita = false) {
  const usuario = await exigirUsuarioAtivo(request);
  if (escrita && !PERFIS_ESCRITA.includes(usuario.role)) throw new Error("FORBIDDEN");

  return resolverParoquiaDaRequisicao(request, usuario);
}

function respostaErro(error: unknown) {
  const mensagem = error instanceof Error ? error.message : "Erro interno.";
  if (mensagem === "UNAUTHENTICATED") return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  if (mensagem === "FORBIDDEN") return NextResponse.json({ erro: "Sem permissão para esta operação." }, { status: 403 });
  return NextResponse.json({ erro: mensagem }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contexto(request);
    const url = new URL(request.url);
    const cpf = url.searchParams.get("cpf");

    let consulta = supabase
      .from("familias")
      .select("id,dados,created_at,updated_at")
      .eq("paroquia_id", paroquiaId)
      .order("created_at", { ascending: false });

    if (cpf) consulta = consulta.eq("dados->>cpf", cpf).limit(1);
    const { data, error } = await consulta;
    if (error) throw error;

    const familias = (data ?? []).map((item) => ({ id: item.id, ...(item.dados as Record<string, unknown>) }));
    return NextResponse.json(cpf ? familias[0] ?? null : familias);
  } catch (error) {
    return respostaErro(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contexto(request, true);
    const dados = await request.json();
    const id = randomUUID();
    const { error } = await supabase.from("familias").insert({ id, paroquia_id: paroquiaId, dados });
    if (error) throw error;
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return respostaErro(error);
  }
}
