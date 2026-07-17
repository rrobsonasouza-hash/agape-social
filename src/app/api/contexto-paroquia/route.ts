import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquia, resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

export async function GET(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); const { paroquia } = await resolverParoquiaDaRequisicao(request, usuario); return NextResponse.json({ paroquia }); }
  catch (error) { const mensagem = error instanceof Error ? error.message : "Erro interno."; if (mensagem === "PARISH_REQUIRED") return NextResponse.json({ paroquia: null }); return NextResponse.json({ erro: mensagem }, { status: 400 }); }
}

export async function POST(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); if (usuario.role !== "admin_plataforma") throw new Error("FORBIDDEN"); const { paroquiaId } = await request.json(); const { paroquia } = await resolverParoquia(paroquiaId); const resposta = NextResponse.json({ paroquia }); resposta.cookies.set("agape_paroquia", paroquia.id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 }); return resposta; }
  catch (error) { return NextResponse.json({ erro: error instanceof Error ? error.message : "Erro interno." }, { status: 403 }); }
}

export async function DELETE() {
  const resposta = NextResponse.json({ sucesso: true }); resposta.cookies.set("agape_paroquia", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 }); return resposta;
}
