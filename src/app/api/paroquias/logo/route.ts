import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

const bucket = "agape-documentos";
const tipos = ["image/jpeg", "image/png"];
function respostaErro(error: unknown) { const mensagem = error instanceof Error ? error.message : "Erro interno."; return NextResponse.json({ erro: mensagem }, { status: mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400 }); }

export async function GET(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const { data, error } = await supabase.from("paroquias").select("logo_caminho").eq("id", paroquiaId).single(); if (error) throw error; if (!data.logo_caminho) return NextResponse.json({ url: null }); const assinatura = await supabase.storage.from(bucket).createSignedUrl(data.logo_caminho, 60 * 60); if (assinatura.error) throw assinatura.error; return NextResponse.json({ url: assinatura.data.signedUrl }); }
  catch (error) { return respostaErro(error); }
}

export async function POST(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); if (!["admin_plataforma", "admin_paroquia"].includes(usuario.role)) throw new Error("FORBIDDEN"); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const formulario = await request.formData(); const arquivo = formulario.get("logo"); if (!(arquivo instanceof File)) throw new Error("Selecione o logotipo."); if (!tipos.includes(arquivo.type)) throw new Error("Utilize uma imagem JPG ou PNG."); if (arquivo.size > 2 * 1024 * 1024) throw new Error("O logotipo deve ter no máximo 2 MB."); const extensao = arquivo.type === "image/png" ? "png" : "jpg"; const caminho = `${paroquiaId}/paroquia/logo-${randomUUID()}.${extensao}`; const atual = await supabase.from("paroquias").select("logo_caminho").eq("id", paroquiaId).single(); if (atual.error) throw atual.error; const envio = await supabase.storage.from(bucket).upload(caminho, Buffer.from(await arquivo.arrayBuffer()), { contentType: arquivo.type }); if (envio.error) throw envio.error; const atualizacao = await supabase.from("paroquias").update({ logo_caminho: caminho, updated_at: new Date().toISOString() }).eq("id", paroquiaId); if (atualizacao.error) { await supabase.storage.from(bucket).remove([caminho]); throw atualizacao.error; } if (atual.data.logo_caminho) await supabase.storage.from(bucket).remove([atual.data.logo_caminho]); const assinatura = await supabase.storage.from(bucket).createSignedUrl(caminho, 60 * 60); if (assinatura.error) throw assinatura.error; return NextResponse.json({ url: assinatura.data.signedUrl }); }
  catch (error) { return respostaErro(error); }
}

export async function DELETE(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); if (!["admin_plataforma", "admin_paroquia"].includes(usuario.role)) throw new Error("FORBIDDEN"); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const atual = await supabase.from("paroquias").select("logo_caminho").eq("id", paroquiaId).single(); if (atual.error) throw atual.error; const atualizacao = await supabase.from("paroquias").update({ logo_caminho: null, updated_at: new Date().toISOString() }).eq("id", paroquiaId); if (atualizacao.error) throw atualizacao.error; if (atual.data.logo_caminho) await supabase.storage.from(bucket).remove([atual.data.logo_caminho]); return NextResponse.json({ sucesso: true }); }
  catch (error) { return respostaErro(error); }
}
