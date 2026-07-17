import { NextRequest, NextResponse } from "next/server";
import { contextoOperacional, respostaErroOperacional } from "@/lib/supabase/operational-api";
const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];
export async function GET(request: NextRequest) {
  try { const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS); const id = `cestaPadrao:${paroquiaId}`; const { data, error } = await supabase.from("configuracoes").select("dados").eq("id", id).eq("paroquia_id", paroquiaId).maybeSingle(); if (error) throw error; return NextResponse.json((data?.dados as { itens?: unknown[] } | null)?.itens ?? []); }
  catch (error) { return respostaErroOperacional(error); }
}
export async function PUT(request: NextRequest) {
  try { const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS, true); const id = `cestaPadrao:${paroquiaId}`; const itens = await request.json(); const { error } = await supabase.from("configuracoes").upsert({ id, paroquia_id: paroquiaId, dados: { itens }, updated_at: new Date().toISOString() }, { onConflict: "id" }); if (error) throw error; return NextResponse.json({ id }); }
  catch (error) { return respostaErroOperacional(error); }
}
