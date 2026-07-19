import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

const schema = z.object({ produtoId: z.uuid(), tipo: z.enum(["ENTRADA", "SAIDA"]).default("ENTRADA"), quantidade: z.coerce.number().int().positive(), motivo: z.string().trim().min(3).max(160) });
function erro(error: unknown) { const mensagem = error instanceof Error ? error.message : "Erro interno."; return NextResponse.json({ erro: mensagem }, { status: mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400 }); }

export async function POST(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); if (!["admin_plataforma", "admin_paroquia"].includes(usuario.role)) throw new Error("FORBIDDEN"); const dados = schema.parse(await request.json()); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const { data, error } = await supabase.rpc("registrar_movimentacao_estoque_secretaria", { p_paroquia_id: paroquiaId, p_produto_id: dados.produtoId, p_tipo: dados.tipo, p_quantidade: dados.quantidade, p_motivo: dados.motivo, p_criado_por: usuario.uid }); if (error) throw error; return NextResponse.json({ estoque: Number(data) }); }
  catch (error) { return erro(error); }
}
