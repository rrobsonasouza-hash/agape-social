import { NextRequest, NextResponse } from "next/server";
import { removerRegistro, respostaErroOperacional } from "@/lib/supabase/operational-api";

const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador"];

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try { return NextResponse.json(await removerRegistro(request, "areas_pastorais", PERFIS, (await context.params).id)); }
  catch (error) { return respostaErroOperacional(error); }
}
