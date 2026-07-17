import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { exigirAdministrador, exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquia } from "@/lib/supabase/tenant";

function erro(error: unknown) {
  const mensagem = error instanceof Error ? error.message : "Erro interno.";
  if (mensagem === "UNAUTHENTICATED") return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  if (mensagem === "FORBIDDEN") return NextResponse.json({ erro: "Sem permissão para consultar a auditoria." }, { status: 403 });
  return NextResponse.json({ erro: mensagem }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const usuario = await exigirAdministrador(request);
    const limite = Math.min(Math.max(Number(new URL(request.url).searchParams.get("limite")) || 200, 1), 500);
    const { supabase, paroquiaId } = await resolverParoquia(usuario.paroquiaId);
    const { data, error } = await supabase.from("auditoria").select("id,dados,created_at").eq("paroquia_id", paroquiaId).order("created_at", { ascending: false }).limit(limite);
    if (error) throw error;
    return NextResponse.json((data ?? []).map((item) => ({ id: item.id, ...(item.dados as Record<string, unknown>), data: (item.dados as { data?: string })?.data ?? item.created_at })));
  } catch (error) { return erro(error); }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await exigirUsuarioAtivo(request);
    const entrada = await request.json();
    const { supabase, paroquiaId } = await resolverParoquia(usuario.paroquiaId);
    const dados = { ...entrada, usuarioId: usuario.uid, usuarioNome: usuario.nome, usuarioEmail: usuario.email, paroquiaId: usuario.paroquiaId, data: new Date().toISOString() };
    const id = randomUUID();
    const { error } = await supabase.from("auditoria").insert({ id, paroquia_id: paroquiaId, dados });
    if (error) throw error;
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) { return erro(error); }
}
