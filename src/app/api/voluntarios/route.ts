import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { exigirPermissaoServidor } from "@/lib/auth/server-permissions";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
import { normalizarAtuacoesVoluntario, voluntarioSchema } from "@/modules/voluntarios/schemas/voluntario.schema";
import { sincronizarCasalDoVoluntario } from "@/modules/ecc/server/sincronizar-casal-voluntario";
import { ZodError } from "zod";

const PERFIS_ESCRITA = ["admin_plataforma", "admin_paroquia", "coordenador"];
const PERFIS_LEITURA = [...PERFIS_ESCRITA, "operador", "voluntario", "leitor"];

async function contexto(request: NextRequest, escrita = false) {
  const usuario = await exigirUsuarioAtivo(request);
  const contextoParoquia = await resolverParoquiaDaRequisicao(request, usuario);
  await exigirPermissaoServidor(contextoParoquia.supabase, contextoParoquia.paroquiaId, usuario.role, "/voluntarios", escrita ? PERFIS_ESCRITA : PERFIS_LEITURA);
  return contextoParoquia;
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
    const dados = voluntarioSchema.parse(normalizarAtuacoesVoluntario(await request.json()));
    const id = randomUUID();
    const { error } = await supabase.from("voluntarios").insert({ id, paroquia_id: paroquiaId, dados });
    if (error) throw error;
    const casalEccId = await sincronizarCasalDoVoluntario(supabase, paroquiaId, id, dados);
    return NextResponse.json({ id, casalEccId }, { status: 201 });
  } catch (error) {
    return respostaErro(error);
  }
}
