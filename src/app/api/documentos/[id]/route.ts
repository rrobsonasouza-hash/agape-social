import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolverParoquia } from "@/lib/supabase/tenant";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try { const usuario = await exigirUsuarioAtivo(request); const { paroquiaId } = await resolverParoquia(usuario.paroquiaId); const { id } = await context.params; const supabase = supabaseAdmin(); const registro = await supabase.from("documentos").select("caminho_storage").eq("id", id).eq("paroquia_id", paroquiaId).single(); if (registro.error) throw registro.error; const assinatura = await supabase.storage.from("agape-documentos").createSignedUrl(registro.data.caminho_storage, 60); if (assinatura.error) throw assinatura.error; return NextResponse.json({ url: assinatura.data.signedUrl }); }
  catch (error) { return NextResponse.json({ erro: error instanceof Error ? error.message : "Erro ao abrir documento." }, { status: 400 }); }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try { const usuario = await exigirUsuarioAtivo(request); if (!["admin_plataforma", "admin_paroquia", "coordenador", "operador"].includes(usuario.role)) throw new Error("FORBIDDEN"); const { paroquiaId } = await resolverParoquia(usuario.paroquiaId); const { id } = await context.params; const supabase = supabaseAdmin(); const registro = await supabase.from("documentos").select("caminho_storage").eq("id", id).eq("paroquia_id", paroquiaId).single(); if (registro.error) throw registro.error; const remocao = await supabase.storage.from("agape-documentos").remove([registro.data.caminho_storage]); if (remocao.error) throw remocao.error; const exclusao = await supabase.from("documentos").delete().eq("id", id).eq("paroquia_id", paroquiaId); if (exclusao.error) throw exclusao.error; return NextResponse.json({ id }); }
  catch (error) { return NextResponse.json({ erro: error instanceof Error ? error.message : "Erro ao remover documento." }, { status: 400 }); }
}
