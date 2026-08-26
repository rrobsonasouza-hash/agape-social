import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { exigirPermissaoServidor } from "@/lib/auth/server-permissions";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
import { eccCasalSchema, eccEncontroSchema, eccEquipeSchema } from "@/modules/ecc/schemas/ecc.schema";

const PERFIS_ESCRITA = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];
const PERFIS_LEITURA = [...PERFIS_ESCRITA, "voluntario", "leitor"];

async function contexto(request: NextRequest, escrita = false) {
  const usuario = await exigirUsuarioAtivo(request);
  const tenant = await resolverParoquiaDaRequisicao(request, usuario);
  await exigirPermissaoServidor(tenant.supabase, tenant.paroquiaId, usuario.role, "/ecc", escrita ? PERFIS_ESCRITA : PERFIS_LEITURA);
  return { ...tenant, usuario };
}

function erro(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ erro: error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const mensagem = error instanceof Error ? error.message : "Erro interno.";
  const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : /duplicate|unique/i.test(mensagem) ? 409 : 500;
  return NextResponse.json({ erro: status === 409 ? "Este registro já existe no ECC selecionado." : mensagem }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contexto(request);
    const [encontros, casais, equipes, voluntarios] = await Promise.all([
      supabase.from("ecc_encontros").select("*").eq("paroquia_id", paroquiaId).order("data_inicio", { ascending: false }),
      supabase.from("ecc_casais").select("*").eq("paroquia_id", paroquiaId).order("conjuge_um_nome"),
      supabase.from("ecc_equipes").select("*").eq("paroquia_id", paroquiaId).order("equipe").order("funcao"),
      supabase.from("voluntarios").select("id,dados").eq("paroquia_id", paroquiaId).order("created_at", { ascending: false }),
    ]);
    for (const resultado of [encontros, casais, equipes, voluntarios]) if (resultado.error) throw resultado.error;
    const nomes = new Map((voluntarios.data ?? []).map((item) => [item.id, String((item.dados as { nome?: string }).nome ?? "Voluntário")]));
    return NextResponse.json({
      encontros: (encontros.data ?? []).map((item) => ({ id:item.id, numero:item.numero, nome:item.nome, tema:item.tema, lema:item.lema, dataInicio:item.data_inicio, dataFim:item.data_fim, prazoInscricao:item.prazo_inscricao ?? "", local:item.local, capacidadeCasais:item.capacidade_casais, status:item.status, observacoes:item.observacoes })),
      casais: (casais.data ?? []).map((item) => ({ id:item.id, conjugeUmNome:item.conjuge_um_nome, conjugeDoisNome:item.conjuge_dois_nome, telefone:item.telefone, email:item.email, dataCasamento:item.data_casamento ?? "", voluntarioUmId:item.voluntario_um_id ?? "", voluntarioDoisId:item.voluntario_dois_id ?? "", situacao:item.situacao, observacoes:item.observacoes })),
      equipe: (equipes.data ?? []).map((item) => ({ id:item.id, encontroId:item.encontro_id, voluntarioId:item.voluntario_id, voluntarioNome:nomes.get(item.voluntario_id) ?? "Voluntário", equipe:item.equipe, funcao:item.funcao, coordenador:item.coordenador, status:item.status, observacoes:item.observacoes })),
      voluntarios: (voluntarios.data ?? []).map((item) => ({ id:item.id, nome:nomes.get(item.id) ?? "Voluntário" })).sort((a,b) => a.nome.localeCompare(b.nome, "pt-BR")),
    });
  } catch (error) { return erro(error); }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, paroquiaId, usuario } = await contexto(request, true);
    const entrada = await request.json() as { tipo?: string; dados?: unknown };
    if (entrada.tipo === "encontro") {
      const dados = eccEncontroSchema.parse(entrada.dados);
      const { data, error } = await supabase.from("ecc_encontros").insert({ paroquia_id:paroquiaId, numero:dados.numero, nome:dados.nome, tema:dados.tema, lema:dados.lema, data_inicio:dados.dataInicio, data_fim:dados.dataFim, prazo_inscricao:dados.prazoInscricao || null, local:dados.local, capacidade_casais:dados.capacidadeCasais, status:dados.status, observacoes:dados.observacoes, criado_por:usuario.uid }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id:data.id }, { status:201 });
    }
    if (entrada.tipo === "casal") {
      const dados = eccCasalSchema.parse(entrada.dados);
      if (dados.encontroId) {
        const encontro = await supabase.from("ecc_encontros").select("id").eq("id", dados.encontroId).eq("paroquia_id", paroquiaId).maybeSingle();
        if (encontro.error || !encontro.data) throw encontro.error ?? new Error("Encontro não encontrado nesta paróquia.");
      }
      const { data, error } = await supabase.from("ecc_casais").insert({ paroquia_id:paroquiaId, conjuge_um_nome:dados.conjugeUmNome, conjuge_dois_nome:dados.conjugeDoisNome, telefone:dados.telefone, email:dados.email, data_casamento:dados.dataCasamento || null, voluntario_um_id:dados.voluntarioUmId || null, voluntario_dois_id:dados.voluntarioDoisId || null, situacao:dados.situacao, observacoes:dados.observacoes }).select("id").single();
      if (error) throw error;
      if (dados.encontroId) {
        const situacao = dados.situacao === "ELEGIVEL" ? "INSCRITO" : dados.situacao;
        const vinculo = await supabase.from("ecc_encontro_casais").insert({ paroquia_id:paroquiaId, encontro_id:dados.encontroId, casal_id:data.id, situacao });
        if (vinculo.error) throw vinculo.error;
      }
      return NextResponse.json({ id:data.id }, { status:201 });
    }
    if (entrada.tipo === "equipe") {
      const dados = eccEquipeSchema.parse(entrada.dados);
      const [encontro, voluntario] = await Promise.all([
        supabase.from("ecc_encontros").select("id").eq("id", dados.encontroId).eq("paroquia_id", paroquiaId).maybeSingle(),
        supabase.from("voluntarios").select("id").eq("id", dados.voluntarioId).eq("paroquia_id", paroquiaId).maybeSingle(),
      ]);
      if (encontro.error || !encontro.data) throw encontro.error ?? new Error("Encontro não encontrado nesta paróquia.");
      if (voluntario.error || !voluntario.data) throw voluntario.error ?? new Error("Voluntário não encontrado nesta paróquia.");
      const { data, error } = await supabase.from("ecc_equipes").insert({ paroquia_id:paroquiaId, encontro_id:dados.encontroId, voluntario_id:dados.voluntarioId, equipe:dados.equipe, funcao:dados.funcao, coordenador:dados.coordenador, status:dados.status, observacoes:dados.observacoes }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id:data.id }, { status:201 });
    }
    return NextResponse.json({ erro:"Tipo de registro do ECC inválido." }, { status:400 });
  } catch (error) { return erro(error); }
}
