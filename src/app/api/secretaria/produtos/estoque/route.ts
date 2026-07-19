import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

const schema = z.object({ produtoId: z.uuid(), tipo: z.enum(["ENTRADA", "SAIDA"]).default("ENTRADA"), quantidade: z.coerce.number().int().positive(), motivo: z.string().trim().min(3).max(160) });
const permitidos = ["admin_plataforma", "admin_paroquia", "atendente_secretaria"];
function erro(error: unknown) { const mensagem = error instanceof Error ? error.message : "Erro interno."; return NextResponse.json({ erro: mensagem }, { status: mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400 }); }

export async function GET(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); if (!permitidos.includes(usuario.role)) throw new Error("FORBIDDEN"); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const url = new URL(request.url); let consulta = supabase.from("secretaria_movimentacoes_estoque").select("id,produto_id,tipo,quantidade,estoque_anterior,estoque_posterior,motivo,criado_por,created_at,secretaria_produtos(nome)").eq("paroquia_id", paroquiaId).order("created_at", { ascending: false }).limit(300); const produtoId = url.searchParams.get("produtoId"); const tipo = url.searchParams.get("tipo"); const inicio = url.searchParams.get("inicio"); const fim = url.searchParams.get("fim"); if (produtoId) consulta = consulta.eq("produto_id", produtoId); if (tipo === "ENTRADA" || tipo === "SAIDA") consulta = consulta.eq("tipo", tipo); if (inicio) consulta = consulta.gte("created_at", `${inicio}T00:00:00`); if (fim) consulta = consulta.lte("created_at", `${fim}T23:59:59.999`); const { data, error } = await consulta; if (error) throw error; const ids = [...new Set((data ?? []).map(item => item.criado_por).filter(Boolean))]; const perfis = ids.length ? await supabase.from("perfis").select("id,nome").in("id", ids) : { data: [], error: null }; if (perfis.error) throw perfis.error; const nomes = new Map((perfis.data ?? []).map(item => [item.id, item.nome])); return NextResponse.json((data ?? []).map(item => { const relacao=item.secretaria_produtos as unknown as {nome:string}|Array<{nome:string}>|null;return { id: item.id, produtoId: item.produto_id, produtoNome: Array.isArray(relacao) ? relacao[0]?.nome : relacao?.nome, tipo: item.tipo, quantidade: Math.abs(Number(item.quantidade)), estoqueAnterior: item.estoque_anterior, estoquePosterior: item.estoque_posterior, motivo: item.motivo, responsavel: nomes.get(item.criado_por) || "Usuário do sistema", createdAt: item.created_at };})); }
  catch (error) { return erro(error); }
}

export async function POST(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); if (!["admin_plataforma", "admin_paroquia"].includes(usuario.role)) throw new Error("FORBIDDEN"); const dados = schema.parse(await request.json()); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const { data, error } = await supabase.rpc("registrar_movimentacao_estoque_secretaria", { p_paroquia_id: paroquiaId, p_produto_id: dados.produtoId, p_tipo: dados.tipo, p_quantidade: dados.quantidade, p_motivo: dados.motivo, p_criado_por: usuario.uid }); if (error) throw error; return NextResponse.json({ estoque: Number(data) }); }
  catch (error) { return erro(error); }
}
