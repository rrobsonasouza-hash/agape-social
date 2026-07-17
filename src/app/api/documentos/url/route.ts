import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
export async function GET(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); const { paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const caminho = new URL(request.url).searchParams.get("caminho"); if (!caminho || caminho.split("/")[0] !== paroquiaId) throw new Error("Documento não informado ou sem permissão."); const assinatura = await supabaseAdmin().storage.from("agape-documentos").createSignedUrl(caminho, 60); if (assinatura.error) throw assinatura.error; return NextResponse.json({ url: assinatura.data.signedUrl }); }
  catch (error) { return NextResponse.json({ erro: error instanceof Error ? error.message : "Erro ao abrir documento." }, { status: 400 }); }
}
