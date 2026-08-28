import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { exigirPermissaoServidor } from "@/lib/auth/server-permissions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

const BUCKET = "agape-documentos";
const LEITURA = ["admin_plataforma", "admin_paroquia", "coordenador", "operador", "voluntario", "leitor"];
const ESCRITA = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];
type Contexto = { params: Promise<{ id: string }> };

async function contexto(request: NextRequest, perfis: string[]) {
  const usuario = await exigirUsuarioAtivo(request);
  const tenant = await resolverParoquiaDaRequisicao(request, usuario);
  await exigirPermissaoServidor(tenant.supabase, tenant.paroquiaId, usuario.role, "/ecc", perfis);
  return tenant;
}

export async function GET(request: NextRequest, context: Contexto) {
  try {
    const tenant = await contexto(request, LEITURA);
    const { id } = await context.params;
    const admin = supabaseAdmin();
    const registro = await admin.from("ecc_documentos").select("caminho_storage,url").eq("id", id).eq("paroquia_id", tenant.paroquiaId).single();
    if (registro.error) throw registro.error;
    if (!registro.data.caminho_storage) {
      if (!registro.data.url) throw new Error("Este documento não possui arquivo disponível.");
      return NextResponse.json({ url: registro.data.url });
    }
    const assinatura = await admin.storage.from(BUCKET).createSignedUrl(registro.data.caminho_storage, 60);
    if (assinatura.error) throw assinatura.error;
    return NextResponse.json({ url: assinatura.data.signedUrl });
  } catch (error) {
    return NextResponse.json({ erro: error instanceof Error ? error.message : "Não foi possível abrir o documento." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: Contexto) {
  try {
    const tenant = await contexto(request, ESCRITA);
    const { id } = await context.params;
    const admin = supabaseAdmin();
    const registro = await admin.from("ecc_documentos").select("caminho_storage").eq("id", id).eq("paroquia_id", tenant.paroquiaId).single();
    if (registro.error) throw registro.error;
    if (registro.data.caminho_storage) {
      const remocao = await admin.storage.from(BUCKET).remove([registro.data.caminho_storage]);
      if (remocao.error) throw remocao.error;
    }
    const exclusao = await admin.from("ecc_documentos").delete().eq("id", id).eq("paroquia_id", tenant.paroquiaId);
    if (exclusao.error) throw exclusao.error;
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ erro: error instanceof Error ? error.message : "Não foi possível excluir o documento." }, { status: 400 });
  }
}
