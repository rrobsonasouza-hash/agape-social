import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { exigirPermissaoServidor } from "@/lib/auth/server-permissions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
import { eccDocumentoSchema } from "@/modules/ecc/schemas/ecc.schema";

const BUCKET = "agape-documentos";
const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];
const TIPOS = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
]);

export async function POST(request: NextRequest) {
  try {
    const usuario = await exigirUsuarioAtivo(request);
    const tenant = await resolverParoquiaDaRequisicao(request, usuario);
    await exigirPermissaoServidor(tenant.supabase, tenant.paroquiaId, usuario.role, "/ecc", PERFIS);
    const formulario = await request.formData();
    const arquivo = formulario.get("arquivo");
    if (!(arquivo instanceof File)) throw new Error("Selecione um arquivo para enviar.");
    if (!TIPOS.has(arquivo.type) || arquivo.size > 10 * 1024 * 1024)
      throw new Error("Utilize PDF, Word, Excel, JPG ou PNG de até 10 MB.");

    const dados = eccDocumentoSchema.parse({
      encontroId: String(formulario.get("encontroId") ?? ""),
      titulo: String(formulario.get("titulo") ?? ""),
      categoria: String(formulario.get("categoria") ?? "OUTRO"),
      observacoes: String(formulario.get("observacoes") ?? ""),
      status: String(formulario.get("status") ?? "DISPONIVEL"),
      url: "",
    });
    const admin = supabaseAdmin();
    const encontro = await admin.from("ecc_encontros").select("id").eq("id", dados.encontroId).eq("paroquia_id", tenant.paroquiaId).maybeSingle();
    if (encontro.error || !encontro.data) throw new Error("Edição do ECC não encontrada nesta paróquia.");

    const extensao = arquivo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const caminho = `${tenant.paroquiaId}/ecc/${dados.encontroId}/${randomUUID()}.${extensao}`;
    const envio = await admin.storage.from(BUCKET).upload(caminho, Buffer.from(await arquivo.arrayBuffer()), { contentType: arquivo.type, upsert: false });
    if (envio.error) throw envio.error;
    const registro = await admin.from("ecc_documentos").insert({
      paroquia_id: tenant.paroquiaId,
      encontro_id: dados.encontroId,
      titulo: dados.titulo,
      categoria: dados.categoria,
      url: "",
      caminho_storage: caminho,
      nome_arquivo: arquivo.name,
      tipo_arquivo: arquivo.type,
      tamanho_bytes: arquivo.size,
      observacoes: dados.observacoes,
      status: dados.status,
      criado_por: usuario.uid,
    }).select("id").single();
    if (registro.error) {
      await admin.storage.from(BUCKET).remove([caminho]);
      throw registro.error;
    }
    return NextResponse.json({ id: registro.data.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ erro: error instanceof Error ? error.message : "Não foi possível enviar o documento." }, { status: 400 });
  }
}
