import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { roleLabels } from "@/config/roles";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

const conviteSchema = z.object({
  role: z.enum(["admin_paroquia", "coordenador", "operador", "voluntario", "leitor", "atendente_secretaria", "tesoureiro"]),
  validadeDias: z.coerce.number().int().min(1).max(30).default(7),
});

function erro(error: unknown) {
  const mensagem = error instanceof Error ? error.message : "Erro interno.";
  const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400;
  return NextResponse.json({ erro: mensagem === "PARISH_REQUIRED" ? "Selecione uma paróquia antes de gerenciar convites." : mensagem }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const administrador = await exigirAdministrador(request);
    const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, administrador);
    const { data, error } = await supabase
      .from("convites_usuarios")
      .select("id,perfil,expires_at,used_at,revoked_at,created_at")
      .eq("paroquia_id", paroquiaId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) { return erro(error); }
}

export async function POST(request: NextRequest) {
  try {
    const administrador = await exigirAdministrador(request);
    const dados = conviteSchema.parse(await request.json());
    const { supabase, paroquiaId, paroquia } = await resolverParoquiaDaRequisicao(request, administrador);
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + dados.validadeDias * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("convites_usuarios")
      .insert({ paroquia_id: paroquiaId, perfil: dados.role, token_hash: tokenHash, expires_at: expiresAt, created_by: administrador.uid })
      .select("id,perfil,expires_at,used_at,revoked_at,created_at")
      .single();
    if (error) throw error;

    await supabase.from("auditoria").insert({
      id: randomUUID(), paroquia_id: paroquiaId,
      dados: { acao: "CONVITE_CRIADO", entidade: "CONVITES_USUARIOS", entidadeId: data.id, descricao: `Convite criado para ${roleLabels[dados.role]} na ${paroquia.nome}.`, usuarioId: administrador.uid, usuarioNome: administrador.nome, usuarioEmail: administrador.email, data: new Date().toISOString() },
    });

    return NextResponse.json({ convite: data, link: `${request.nextUrl.origin}/convite?token=${token}` }, { status: 201 });
  } catch (error) { return erro(error); }
}
