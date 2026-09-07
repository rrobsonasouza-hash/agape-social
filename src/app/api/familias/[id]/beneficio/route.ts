import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { exigirPermissaoServidor } from "@/lib/auth/server-permissions";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
import { familiaSchema } from "@/modules/familias/schemas/familia.schema";

const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador"];
const entradaSchema = z.object({
  decisao: z.enum(["RESTABELECER", "MANTER_BLOQUEIO"]),
  parecer: z.string().trim().min(10, "Informe um parecer com pelo menos 10 caracteres.").max(1000, "O parecer deve ter no máximo 1.000 caracteres."),
});

function erro(error: unknown) {
  const mensagem = error instanceof Error ? error.message : "Erro interno.";
  if (mensagem === "UNAUTHENTICATED") return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  if (mensagem === "FORBIDDEN") return NextResponse.json({ erro: "Somente a coordenação ou administração pode restabelecer o benefício." }, { status: 403 });
  if (error instanceof z.ZodError) return NextResponse.json({ erro: error.issues[0]?.message ?? "Parecer inválido." }, { status: 400 });
  return NextResponse.json({ erro: mensagem }, { status: 500 });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await exigirUsuarioAtivo(request);
    const { supabase, paroquiaId } = await resolverParoquiaDaRequisicao(request, usuario);
    await exigirPermissaoServidor(supabase, paroquiaId, usuario.role, "/familias", PERFIS);
    if (!PERFIS.includes(usuario.role)) throw new Error("FORBIDDEN");

    const { id } = await context.params;
    const { decisao, parecer } = entradaSchema.parse(await request.json());
    const atual = await supabase.from("familias").select("dados").eq("id", id).eq("paroquia_id", paroquiaId).maybeSingle();
    if (atual.error) throw atual.error;
    if (!atual.data) return NextResponse.json({ erro: "Família não encontrada." }, { status: 404 });

    const dadosAnteriores = familiaSchema.parse(atual.data.dados);
    if (!dadosAnteriores.beneficioBloqueado)
      return NextResponse.json({ erro: "O benefício desta família não está bloqueado." }, { status: 409 });

    const restabelecidoEm = new Date().toISOString();
    const dadosAtualizados = {
      ...dadosAnteriores,
      beneficioBloqueado: false,
      faltasConsecutivas: 0,
      motivoBloqueio: "",
    };
    if (decisao === "RESTABELECER") {
      const atualizacao = await supabase.from("familias").update({ dados: dadosAtualizados, updated_at: restabelecidoEm }).eq("id", id).eq("paroquia_id", paroquiaId);
      if (atualizacao.error) throw atualizacao.error;
    }

    const auditoria = await supabase.from("auditoria").insert({
      id: randomUUID(),
      paroquia_id: paroquiaId,
      dados: {
        acao: decisao === "RESTABELECER" ? "RESTABELECIMENTO_BENEFICIO" : "MANUTENCAO_BLOQUEIO_BENEFICIO",
        entidade: "FAMILIAS",
        entidadeId: id,
        descricao: decisao === "RESTABELECER"
          ? `Benefício restabelecido para ${dadosAnteriores.nomeResponsavel}. Parecer: ${parecer}`
          : `Bloqueio mantido para ${dadosAnteriores.nomeResponsavel}. Parecer: ${parecer}`,
        decisao,
        parecer,
        faltasConsecutivasAnteriores: dadosAnteriores.faltasConsecutivas,
        motivoBloqueioAnterior: dadosAnteriores.motivoBloqueio,
        usuarioId: usuario.uid,
        usuarioNome: usuario.nome,
        usuarioEmail: usuario.email,
        paroquiaId,
        data: restabelecidoEm,
      },
    });
    if (auditoria.error && decisao === "RESTABELECER") {
      await supabase.from("familias").update({ dados: dadosAnteriores, updated_at: restabelecidoEm }).eq("id", id).eq("paroquia_id", paroquiaId);
      throw auditoria.error;
    }
    if (auditoria.error) throw auditoria.error;

    return NextResponse.json({ id, decisao, avaliadoEm: restabelecidoEm });
  } catch (error) {
    return erro(error);
  }
}
