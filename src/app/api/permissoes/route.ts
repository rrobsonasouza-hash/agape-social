import { NextRequest, NextResponse } from "next/server";
import { exigirAdministrador, exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { permissoesPadrao, modulosConfiguraveis, PermissoesPorPerfil } from "@/config/permissions";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

export async function GET(request: NextRequest) {
  try { const usuario = await exigirUsuarioAtivo(request); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const id = `permissoes:${paroquiaId}`; const { data, error } = await supabase.from("configuracoes").select("dados").eq("id", id).eq("paroquia_id", paroquiaId).maybeSingle(); if (error) throw error; return NextResponse.json((data?.dados as { perfis?: PermissoesPorPerfil } | null)?.perfis ?? permissoesPadrao); }
  catch (error) { return NextResponse.json({ erro: error instanceof Error ? error.message : "Erro interno." }, { status: 400 }); }
}

export async function PUT(request: NextRequest) {
  try { const usuario = await exigirAdministrador(request); const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario); const entrada = await request.json() as PermissoesPorPerfil; const rotasValidas = new Set(modulosConfiguraveis.map((item) => item.rota)); const perfis: PermissoesPorPerfil = { coordenador: [], operador: [], voluntario: [], leitor: [] }; (Object.keys(perfis) as Array<keyof PermissoesPorPerfil>).forEach((perfil) => { perfis[perfil] = Array.isArray(entrada[perfil]) ? [...new Set(entrada[perfil].filter((rota) => rotasValidas.has(rota as never)))] : []; }); const id = `permissoes:${paroquiaId}`; const { error } = await supabase.from("configuracoes").upsert({ id, paroquia_id: paroquiaId, dados: { perfis }, updated_at: new Date().toISOString() }, { onConflict: "id" }); if (error) throw error; return NextResponse.json(perfis); }
  catch (error) { return NextResponse.json({ erro: error instanceof Error ? error.message : "Erro interno." }, { status: 400 }); }
}
