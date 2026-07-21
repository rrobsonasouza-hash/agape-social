import { NextRequest, NextResponse } from "next/server";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

type Contexto = { params: Promise<{ id: string }> };
const perfis = ["admin_plataforma", "admin_paroquia", "atendente_secretaria", "tesoureiro"];

export async function GET(req: NextRequest, ctx: Contexto) {
  try {
    const usuario = await exigirUsuarioAtivo(req);
    if (!perfis.includes(usuario.role)) throw new Error("FORBIDDEN");
    const { supabase, paroquiaId, paroquia } = await resolverParoquiaDaRequisicao(req, usuario);
    const id = (await ctx.params).id;
    const ano = Number(req.nextUrl.searchParams.get("ano") || new Date().getFullYear());
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) throw new Error("Ano inválido.");

    const [dizimista, pagamentos] = await Promise.all([
      supabase.from("secretaria_dizimistas").select("id,titular_nome,conjuge_nome,cpf,telefone,email").eq("id", id).eq("paroquia_id", paroquiaId).single(),
      supabase.from("secretaria_dizimos_pagamentos").select("id,competencia,data_pagamento,valor,forma_pagamento,status").eq("dizimista_id", id).eq("paroquia_id", paroquiaId).gte("competencia", `${ano}-01-01`).lte("competencia", `${ano}-12-01`).order("competencia"),
    ]);
    if (dizimista.error) throw new Error("Dizimista não encontrado.");
    if (pagamentos.error) throw pagamentos.error;

    let logoUrl: string | null = null;
    if (paroquia.logo_caminho) {
      const assinatura = await supabase.storage.from("agape-documentos").createSignedUrl(paroquia.logo_caminho, 3600);
      if (!assinatura.error) logoUrl = assinatura.data.signedUrl;
    }
    const d = dizimista.data;
    return NextResponse.json({
      paroquia: { nome: paroquia.nome, endereco: paroquia.endereco, logoUrl },
      dizimista: { id: d.id, nome: [d.titular_nome, d.conjuge_nome].filter(Boolean).join(" e "), cpf: d.cpf, telefone: d.telefone, email: d.email },
      ano,
      pagamentos: (pagamentos.data ?? []).map((p) => ({ id: p.id, competencia: p.competencia, dataPagamento: p.data_pagamento, valor: Number(p.valor), formaPagamento: p.forma_pagamento, status: p.status })),
    });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Não foi possível gerar o extrato.";
    return NextResponse.json({ erro: mensagem }, { status: mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400 });
  }
}
