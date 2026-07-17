import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { contextoOperacional, listarRegistros, respostaErroOperacional } from "@/lib/supabase/operational-api";
const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];
export async function GET(request: NextRequest) { try { return NextResponse.json(await listarRegistros(request, "movimentacoes_cestas", PERFIS)); } catch (error) { return respostaErroOperacional(error); } }
export async function POST(request: NextRequest) {
  try { const { supabase, paroquiaId } = await contextoOperacional(request, PERFIS, true); const corpo = await request.json(); const movimentos = Array.isArray(corpo) ? corpo : [corpo]; const linhas = movimentos.map((dados) => ({ id: randomUUID(), paroquia_id: paroquiaId, dados })); const { error } = await supabase.from("movimentacoes_cestas").insert(linhas); if (error) throw error; return NextResponse.json({ ids: linhas.map((item) => item.id), id: linhas[0]?.id }, { status: 201 }); }
  catch (error) { return respostaErroOperacional(error); }
}
