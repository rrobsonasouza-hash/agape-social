import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

const schema = z.object({ nome: z.string().trim().min(2), categoriaId: z.uuid(), preco: z.coerce.number().min(0), estoque: z.coerce.number().int().min(0) });
const permitidos = ["admin_plataforma", "admin_paroquia", "atendente_secretaria"];
function respostaErro(error: unknown) { const mensagem = error instanceof Error ? error.message : "Erro interno."; return NextResponse.json({ erro: mensagem }, { status: mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400 }); }

export async function GET(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); if (!permitidos.includes(usuario.role)) throw new Error("FORBIDDEN"); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const { data, error } = await supabase.from("secretaria_produtos").select("id,nome,categoria,categoria_id,preco,estoque,ativo").eq("paroquia_id", paroquiaId).order("nome"); if (error) throw error; return NextResponse.json((data ?? []).map((item) => ({ ...item, categoriaId: item.categoria_id, preco: Number(item.preco) }))); }
  catch (error) { return respostaErro(error); }
}

export async function POST(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); if (!["admin_plataforma", "admin_paroquia"].includes(usuario.role)) throw new Error("FORBIDDEN"); const dados = schema.parse(await request.json()); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const categoria = await supabase.from("secretaria_categorias_produtos").select("id,nome").eq("id", dados.categoriaId).eq("paroquia_id", paroquiaId).eq("ativa", true).single(); if (categoria.error) throw new Error("Selecione uma categoria ativa."); const { data, error } = await supabase.from("secretaria_produtos").insert({ paroquia_id: paroquiaId, nome: dados.nome, categoria_id: categoria.data.id, categoria: categoria.data.nome, preco: dados.preco, estoque: dados.estoque }).select("id").single(); if (error) throw error; return NextResponse.json({ id: data.id }, { status: 201 }); }
  catch (error) { return respostaErro(error); }
}
