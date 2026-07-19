import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

const criarSchema = z.object({ nome: z.string().trim().min(2).max(80) });
const editarSchema = z.object({ id: z.uuid(), nome: z.string().trim().min(2).max(80).optional(), ativa: z.boolean().optional() }).refine((d) => d.nome !== undefined || d.ativa !== undefined);
const permitidos = ["admin_plataforma", "admin_paroquia", "atendente_secretaria"];
function erro(error: unknown) { const mensagem = error instanceof Error ? error.message : "Erro interno."; return NextResponse.json({ erro: mensagem }, { status: mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400 }); }

export async function GET(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); if (!permitidos.includes(usuario.role)) throw new Error("FORBIDDEN"); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const { data, error } = await supabase.from("secretaria_categorias_produtos").select("id,nome,ativa").eq("paroquia_id", paroquiaId).order("nome"); if (error) throw error; return NextResponse.json(data ?? []); }
  catch (error) { return erro(error); }
}

export async function POST(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); if (!["admin_plataforma", "admin_paroquia"].includes(usuario.role)) throw new Error("FORBIDDEN"); const dados = criarSchema.parse(await request.json()); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const { data, error } = await supabase.from("secretaria_categorias_produtos").insert({ paroquia_id: paroquiaId, nome: dados.nome }).select("id").single(); if (error?.code === "23505") throw new Error("Essa categoria já está cadastrada."); if (error) throw error; return NextResponse.json({ id: data.id }, { status: 201 }); }
  catch (error) { return erro(error); }
}

export async function PATCH(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); if (!["admin_plataforma", "admin_paroquia"].includes(usuario.role)) throw new Error("FORBIDDEN"); const dados = editarSchema.parse(await request.json()); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const alteracoes = { ...(dados.nome !== undefined ? { nome: dados.nome } : {}), ...(dados.ativa !== undefined ? { ativa: dados.ativa } : {}), updated_at: new Date().toISOString() }; const { data, error } = await supabase.from("secretaria_categorias_produtos").update(alteracoes).eq("id", dados.id).eq("paroquia_id", paroquiaId).select("id,nome,ativa").single(); if (error?.code === "23505") throw new Error("Essa categoria já está cadastrada."); if (error) throw error; if (dados.nome) { const atualizacao = await supabase.from("secretaria_produtos").update({ categoria: dados.nome, updated_at: new Date().toISOString() }).eq("paroquia_id", paroquiaId).eq("categoria_id", dados.id); if (atualizacao.error) throw atualizacao.error; } return NextResponse.json(data); }
  catch (error) { return erro(error); }
}
