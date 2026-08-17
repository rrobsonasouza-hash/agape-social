import { NextRequest, NextResponse } from "next/server";

import { exigirAdministrador } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

function erro(error: unknown) {
  const mensagem = error instanceof Error ? error.message : "Erro interno.";
  if (mensagem === "UNAUTHENTICATED") return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  if (mensagem === "FORBIDDEN") return NextResponse.json({ erro: "Sem permissão para consultar a auditoria." }, { status: 403 });
  console.error("Erro na auditoria:", error);
  return NextResponse.json({ erro: "Não foi possível concluir a operação." }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const usuario = await exigirAdministrador(request);
    const limite = Math.min(Math.max(Number(new URL(request.url).searchParams.get("limite")) || 200, 1), 500);
    const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario);
    const { data, error } = await supabase.from("auditoria").select("id,dados,created_at").eq("paroquia_id", paroquiaId).order("created_at", { ascending: false }).limit(limite);
    if (error) throw error;
    return NextResponse.json((data ?? []).map((item) => ({ id: item.id, ...(item.dados as Record<string, unknown>), data: (item.dados as { data?: string })?.data ?? item.created_at })));
  } catch (error) { return erro(error); }
}

export async function POST(request: NextRequest) {
  void request;
  return NextResponse.json(
    { erro: "Registros de auditoria só podem ser criados internamente pelo servidor." },
    { status: 405, headers: { Allow: "GET" } },
  );
}
