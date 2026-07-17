import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { supabaseAdmin } from "@/lib/supabase/admin";
export async function GET(request: NextRequest) {
  try { await exigirUsuarioAtivo(request); const caminho = new URL(request.url).searchParams.get("caminho"); if (!caminho) throw new Error("Documento não informado."); const assinatura = await supabaseAdmin().storage.from("agape-documentos").createSignedUrl(caminho, 60); if (assinatura.error) throw assinatura.error; return NextResponse.json({ url: assinatura.data.signedUrl }); }
  catch (error) { return NextResponse.json({ erro: error instanceof Error ? error.message : "Erro ao abrir documento." }, { status: 400 }); }
}
