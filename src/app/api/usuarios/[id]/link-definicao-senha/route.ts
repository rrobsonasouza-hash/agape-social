import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

function erro(error: unknown) {
  const mensagem = error instanceof Error ? error.message : "Erro interno.";
  const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400;
  return NextResponse.json({ erro: mensagem }, { status });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const administrador = await exigirAdministrador(request);
    const { id } = await context.params;
    const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, administrador);
    const { data: usuario, error } = await supabase
      .from("perfis")
      .select("id,nome,email")
      .eq("id", id)
      .eq("paroquia_id", paroquiaId)
      .neq("perfil", "admin_plataforma")
      .maybeSingle();

    if (error) throw error;
    if (!usuario?.email) throw new Error("Usuário não encontrado.");

    const link = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: usuario.email,
      options: { redirectTo: `${request.nextUrl.origin}/definir-senha` },
    });
    if (link.error) throw link.error;

    await supabase.from("auditoria").insert({
      id: randomUUID(),
      paroquia_id: paroquiaId,
      dados: {
        acao: "GERACAO_LINK_SENHA",
        entidade: "USUARIOS",
        entidadeId: id,
        descricao: `Link de definição de senha gerado para ${usuario.nome}.`,
        usuarioId: administrador.uid,
        usuarioNome: administrador.nome,
        usuarioEmail: administrador.email,
        data: new Date().toISOString(),
      },
    });

    return NextResponse.json({ linkDefinicaoSenha: link.data.properties.action_link, nome: usuario.nome });
  } catch (error) {
    return erro(error);
  }
}
