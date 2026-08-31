import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { exigirPermissaoServidor } from "@/lib/auth/server-permissions";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
import { assinarEncontro } from "@/modules/ecc/server/checkin-token";

export async function GET(request: NextRequest) {
  try {
    const usuario = await exigirUsuarioAtivo(request);
    const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario);
    await exigirPermissaoServidor(supabase, paroquiaId, usuario.role, "/ecc", ["admin_plataforma", "admin_paroquia", "coordenador", "operador"]);
    const encontroId = request.nextUrl.searchParams.get("encontro") ?? "";
    const encontro = await supabase.from("ecc_encontros").select("id").eq("id", encontroId).eq("paroquia_id", paroquiaId).maybeSingle();
    if (encontro.error || !encontro.data) return NextResponse.json({ erro: "Edição não encontrada." }, { status: 404 });
    return NextResponse.json({ token: assinarEncontro(encontroId) });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Não foi possível gerar o check-in.";
    return NextResponse.json({ erro: mensagem }, { status: mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400 });
  }
}
