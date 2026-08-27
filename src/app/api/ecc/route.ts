import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { exigirPermissaoServidor } from "@/lib/auth/server-permissions";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
import {
  eccCasalSchema,
  eccEncontroSchema,
  eccEquipeSchema,
  eccParticipacaoSchema,
  eccProgramacaoSchema,
  eccProgramacaoStatusSchema,
  eccTarefaSchema,
  eccTarefaStatusSchema,
  eccVinculoCasalSchema,
  eccNovoVoluntarioSchema,
  eccVisitaSchema,
} from "@/modules/ecc/schemas/ecc.schema";
import { voluntarioAtuaNoEcc } from "@/modules/ecc/server/sincronizar-casal-voluntario";

const PERFIS_ESCRITA = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];
const PERFIS_LEITURA = [...PERFIS_ESCRITA, "voluntario", "leitor"];

async function contexto(request: NextRequest, escrita = false) {
  const usuario = await exigirUsuarioAtivo(request);
  const tenant = await resolverParoquiaDaRequisicao(request, usuario);
  await exigirPermissaoServidor(
    tenant.supabase,
    tenant.paroquiaId,
    usuario.role,
    "/ecc",
    escrita ? PERFIS_ESCRITA : PERFIS_LEITURA,
  );
  return { ...tenant, usuario };
}

function erro(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { erro: error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  const mensagem = error instanceof Error ? error.message : "Erro interno.";
  const status =
    mensagem === "UNAUTHENTICATED"
      ? 401
      : mensagem === "FORBIDDEN"
        ? 403
        : /duplicate|unique/i.test(mensagem)
          ? 409
          : 500;
  return NextResponse.json(
    {
      erro:
        status === 409
          ? "Este registro já existe no ECC selecionado."
          : mensagem,
    },
    { status },
  );
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, paroquiaId, paroquia, usuario } = await contexto(request);
    const [encontros, casais, participacoes, equipes, programacao, tarefas, visitas, voluntarios] =
      await Promise.all([
        supabase.from("ecc_encontros").select("*").eq("paroquia_id", paroquiaId).order("data_inicio", { ascending: false }),
        supabase.from("ecc_casais").select("*").eq("paroquia_id", paroquiaId).order("conjuge_um_nome"),
        supabase.from("ecc_encontro_casais").select("*").eq("paroquia_id", paroquiaId).order("inscrito_em"),
        supabase.from("ecc_equipes").select("*").eq("paroquia_id", paroquiaId).order("equipe").order("funcao"),
        supabase.from("ecc_programacao").select("*").eq("paroquia_id", paroquiaId).order("data").order("hora_inicio"),
        supabase.from("ecc_tarefas").select("*").eq("paroquia_id", paroquiaId).order("prazo", { ascending: true, nullsFirst: false }),
        supabase.from("ecc_visitas").select("*").eq("paroquia_id", paroquiaId).order("data_agendada", { ascending: false }),
        supabase.from("voluntarios").select("id,dados").eq("paroquia_id", paroquiaId).order("created_at", { ascending: false }),
      ]);
    for (const resultado of [encontros, casais, participacoes, equipes, programacao, tarefas, visitas, voluntarios])
      if (resultado.error) throw resultado.error;

    const nomesVoluntarios = new Map(
      (voluntarios.data ?? []).map((item) => [
        item.id,
        String((item.dados as { nome?: string }).nome ?? "Voluntário"),
      ]),
    );
    const nomesCasais = new Map(
      (casais.data ?? []).map((item) => [
        item.id,
        `${item.conjuge_um_nome} e ${item.conjuge_dois_nome}`,
      ]),
    );

    return NextResponse.json({
      encontros: (encontros.data ?? []).map((item) => ({
        id: item.id, numero: item.numero, nome: item.nome, tema: item.tema, lema: item.lema,
        dataInicio: item.data_inicio, dataFim: item.data_fim, prazoInscricao: item.prazo_inscricao ?? "",
        local: item.local, capacidadeCasais: item.capacidade_casais, status: item.status, observacoes: item.observacoes,
      })),
      casais: (casais.data ?? []).map((item) => ({
        id: item.id, conjugeUmNome: item.conjuge_um_nome, conjugeDoisNome: item.conjuge_dois_nome,
        telefone: item.telefone, email: item.email, dataCasamento: item.data_casamento ?? "",
        voluntarioUmId: item.voluntario_um_id ?? "", voluntarioDoisId: item.voluntario_dois_id ?? "",
        cep: item.cep ?? "", logradouro: item.logradouro ?? "", numero: item.numero ?? "",
        complemento: item.complemento ?? "", bairro: item.bairro ?? "", cidade: item.cidade ?? "",
        estado: item.estado ?? "", latitude: item.latitude === null ? null : Number(item.latitude),
        longitude: item.longitude === null ? null : Number(item.longitude),
        situacao: item.situacao, observacoes: item.observacoes,
      })),
      participacoes: (participacoes.data ?? []).map((item) => ({
        id: item.id, encontroId: item.encontro_id, casalId: item.casal_id,
        casalNome: nomesCasais.get(item.casal_id) ?? "Casal não encontrado", situacao: item.situacao,
        classificacao: item.classificacao ?? "INDICADO",
        inscritoEm: item.inscrito_em, observacoes: item.observacoes,
      })),
      equipe: (equipes.data ?? []).map((item) => ({
        id: item.id, encontroId: item.encontro_id, voluntarioId: item.voluntario_id,
        voluntarioNome: nomesVoluntarios.get(item.voluntario_id) ?? "Voluntário",
        equipe: item.equipe, funcao: item.funcao, coordenador: item.coordenador,
        status: item.status, observacoes: item.observacoes,
      })),
      programacao: (programacao.data ?? []).map((item) => ({
        id: item.id, encontroId: item.encontro_id, titulo: item.titulo, descricao: item.descricao,
        data: item.data, horaInicio: String(item.hora_inicio).slice(0, 5), horaFim: item.hora_fim ? String(item.hora_fim).slice(0, 5) : "",
        ambiente: item.ambiente, equipe: item.equipe, responsavelVoluntarioId: item.responsavel_voluntario_id ?? "",
        responsavelNome: nomesVoluntarios.get(item.responsavel_voluntario_id) ?? "Não definido",
        status: item.status, observacoes: item.observacoes,
      })),
      tarefas: (tarefas.data ?? []).map((item) => ({
        id: item.id, encontroId: item.encontro_id, titulo: item.titulo, descricao: item.descricao,
        equipe: item.equipe, responsavelVoluntarioId: item.responsavel_voluntario_id ?? "",
        responsavelNome: nomesVoluntarios.get(item.responsavel_voluntario_id) ?? "Não definido",
        prazo: item.prazo ?? "", prioridade: item.prioridade, status: item.status, observacoes: item.observacoes,
      })),
      visitas: (PERFIS_ESCRITA.includes(usuario.role) ? visitas.data ?? [] : []).map((item) => ({
        id: item.id, encontroId: item.encontro_id, casalId: item.casal_id,
        casalNome: nomesCasais.get(item.casal_id) ?? "Casal não encontrado",
        visitadorVoluntarioId: item.visitador_voluntario_id ?? "",
        visitadorNome: nomesVoluntarios.get(item.visitador_voluntario_id) ?? "Não definido",
        dataAgendada: item.data_agendada, horaAgendada: item.hora_agendada ? String(item.hora_agendada).slice(0, 5) : "",
        dataRealizada: item.data_realizada ?? "", retornoData: item.retorno_data ?? "",
        status: item.status, questionario: {
          motivoParticipacao: String(item.questionario?.motivoParticipacao ?? ""),
          expectativas: String(item.questionario?.expectativas ?? ""),
          participacaoParoquial: String(item.questionario?.participacaoParoquial ?? ""),
          filhosCuidados: String(item.questionario?.filhosCuidados ?? ""),
          restricoesAlimentares: String(item.questionario?.restricoesAlimentares ?? ""),
          necessidadesAcessibilidade: String(item.questionario?.necessidadesAcessibilidade ?? ""),
          contatoEmergencia: String(item.questionario?.contatoEmergencia ?? ""),
          observacoesPastorais: String(item.questionario?.observacoesPastorais ?? ""),
          consentimentoInformacoes: item.questionario?.consentimentoInformacoes === true,
        }, observacoes: item.observacoes ?? "",
      })),
      voluntarios: (voluntarios.data ?? [])
        .map((item) => {
          const dados = item.dados as Record<string, unknown>;
          return {
            id: item.id, nome: nomesVoluntarios.get(item.id) ?? "Voluntário",
            telefone: String(dados.telefone ?? ""), email: String(dados.email ?? ""),
            conjugeNome: String(dados.conjugeNome ?? ""), cep: String(dados.cep ?? ""),
            logradouro: String(dados.logradouro ?? ""), numero: String(dados.numero ?? ""),
            complemento: String(dados.complemento ?? ""), bairro: String(dados.bairro ?? ""),
            cidade: String(dados.cidade ?? ""), estado: String(dados.estado ?? ""),
            latitude: typeof dados.latitude === "number" ? dados.latitude : null,
            longitude: typeof dados.longitude === "number" ? dados.longitude : null,
            funcaoEcc: String(dados.funcaoEcc ?? (voluntarioAtuaNoEcc(dados) ? dados.funcao ?? "Voluntário" : "")),
            atuaEcc: voluntarioAtuaNoEcc(dados), status: String(dados.status ?? "ATIVO"),
          };
        })
        .filter((item) => item.atuaEcc && item.status === "ATIVO")
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
      paroquia: {
        nome: String(paroquia.nome),
        latitude: paroquia.latitude === null ? null : Number(paroquia.latitude),
        longitude: paroquia.longitude === null ? null : Number(paroquia.longitude),
      },
      podeGerenciarVisitas: PERFIS_ESCRITA.includes(usuario.role),
    });
  } catch (error) {
    return erro(error);
  }
}

async function validarEncontro(
  supabase: Awaited<ReturnType<typeof resolverParoquiaDaRequisicao>>["supabase"],
  paroquiaId: string,
  encontroId: string,
) {
  const encontro = await supabase
    .from("ecc_encontros")
    .select("id")
    .eq("id", encontroId)
    .eq("paroquia_id", paroquiaId)
    .maybeSingle();
  if (encontro.error || !encontro.data)
    throw encontro.error ?? new Error("Encontro não encontrado nesta paróquia.");
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, paroquiaId, usuario } = await contexto(request, true);
    const entrada = (await request.json()) as { tipo?: string; dados?: unknown };
    if (entrada.tipo === "encontro") {
      const dados = eccEncontroSchema.parse(entrada.dados);
      const { data, error } = await supabase.from("ecc_encontros").insert({
        paroquia_id: paroquiaId, numero: dados.numero, nome: dados.nome, tema: dados.tema, lema: dados.lema,
        data_inicio: dados.dataInicio, data_fim: dados.dataFim, prazo_inscricao: dados.prazoInscricao || null,
        local: dados.local, capacidade_casais: dados.capacidadeCasais, status: dados.status,
        observacoes: dados.observacoes, criado_por: usuario.uid,
      }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id: data.id }, { status: 201 });
    }
    if (entrada.tipo === "casal") {
      const dados = eccCasalSchema.parse(entrada.dados);
      if (dados.encontroId) await validarEncontro(supabase, paroquiaId, dados.encontroId);
      const { data, error } = await supabase.from("ecc_casais").insert({
        paroquia_id: paroquiaId, conjuge_um_nome: dados.conjugeUmNome, conjuge_dois_nome: dados.conjugeDoisNome,
        telefone: dados.telefone, email: dados.email, data_casamento: dados.dataCasamento || null,
        cep: dados.cep.replace(/\D/g, ""), logradouro: dados.logradouro, numero: dados.numero,
        complemento: dados.complemento, bairro: dados.bairro, cidade: dados.cidade,
        estado: dados.estado.toUpperCase(), latitude: dados.latitude, longitude: dados.longitude,
        voluntario_um_id: dados.voluntarioUmId || null, voluntario_dois_id: dados.voluntarioDoisId || null,
        situacao: dados.situacao, observacoes: dados.observacoes,
      }).select("id").single();
      if (error) throw error;
      if (dados.encontroId) {
        const situacao = dados.situacao === "ELEGIVEL" ? "INSCRITO" : dados.situacao;
        const vinculo = await supabase.from("ecc_encontro_casais").insert({
          paroquia_id: paroquiaId, encontro_id: dados.encontroId, casal_id: data.id, situacao,
        });
        if (vinculo.error) throw vinculo.error;
      }
      return NextResponse.json({ id: data.id }, { status: 201 });
    }
    if (entrada.tipo === "voluntario") {
      if (!["admin_plataforma", "admin_paroquia", "coordenador"].includes(usuario.role)) throw new Error("FORBIDDEN");
      const dados = eccNovoVoluntarioSchema.parse(entrada.dados);
      const casal = await supabase.from("ecc_casais").select("*").eq("id", dados.casalId).eq("paroquia_id", paroquiaId).maybeSingle();
      if (casal.error || !casal.data) throw casal.error ?? new Error("Casal não encontrado nesta paróquia.");
      const coluna = dados.posicao === "UM" ? "voluntario_um_id" : "voluntario_dois_id";
      if (casal.data[coluna]) throw new Error("Este cônjuge já está vinculado a um voluntário.");
      const cpf = dados.cpf.replace(/\D/g, "");
      const existentes = await supabase.from("voluntarios").select("id,dados").eq("paroquia_id", paroquiaId);
      if (existentes.error) throw existentes.error;
      if ((existentes.data ?? []).some((item) => String((item.dados as Record<string, unknown>).cpf ?? "").replace(/\D/g, "") === cpf))
        throw new Error("Já existe um voluntário com este CPF nesta paróquia.");
      const nome = dados.posicao === "UM" ? casal.data.conjuge_um_nome : casal.data.conjuge_dois_nome;
      const conjugeNome = dados.posicao === "UM" ? casal.data.conjuge_dois_nome : casal.data.conjuge_um_nome;
      const id = randomUUID();
      const registro = {
        nome, cpf, telefone: dados.telefone, email: dados.email, dataNascimento: "", conjugeNome,
        cep: casal.data.cep ?? "", logradouro: casal.data.logradouro ?? "", numero: casal.data.numero ?? "",
        complemento: casal.data.complemento ?? "", bairro: casal.data.bairro ?? "", cidade: casal.data.cidade ?? "",
        estado: casal.data.estado ?? "", latitude: casal.data.latitude === null ? null : Number(casal.data.latitude),
        longitude: casal.data.longitude === null ? null : Number(casal.data.longitude), pastoral: "ECC",
        funcao: dados.funcao, atuaPromocaoHumana: false, funcaoPromocaoHumana: "",
        atuaEcc: true, funcaoEcc: dados.funcao, dataIngresso: dados.dataIngresso,
        disponibilidade: { segunda: false, terca: false, quarta: false, quinta: false, sexta: false, sabado: false, domingo: false },
        observacoes: "Cadastro originado pelo vínculo de casal no ECC.", status: "ATIVO",
      };
      const inclusao = await supabase.from("voluntarios").insert({ id, paroquia_id: paroquiaId, dados: registro });
      if (inclusao.error) throw inclusao.error;
      const vinculo = await supabase.from("ecc_casais").update({ [coluna]: id, updated_at: new Date().toISOString() }).eq("id", dados.casalId).eq("paroquia_id", paroquiaId);
      if (vinculo.error) {
        await supabase.from("voluntarios").delete().eq("id", id).eq("paroquia_id", paroquiaId);
        throw vinculo.error;
      }
      return NextResponse.json({ id }, { status: 201 });
    }
    if (entrada.tipo === "visita") {
      const dados = eccVisitaSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      const [participacao, visitador] = await Promise.all([
        supabase.from("ecc_encontro_casais").select("id").eq("encontro_id", dados.encontroId).eq("casal_id", dados.casalId).eq("paroquia_id", paroquiaId).maybeSingle(),
        supabase.from("voluntarios").select("id").eq("id", dados.visitadorVoluntarioId).eq("paroquia_id", paroquiaId).maybeSingle(),
      ]);
      if (participacao.error || !participacao.data) throw participacao.error ?? new Error("O casal não pertence à edição selecionada.");
      if (visitador.error || !visitador.data) throw visitador.error ?? new Error("Responsável pela visita não encontrado nesta paróquia.");
      const { data, error } = await supabase.from("ecc_visitas").insert({
        paroquia_id: paroquiaId, encontro_id: dados.encontroId, casal_id: dados.casalId,
        visitador_voluntario_id: dados.visitadorVoluntarioId, data_agendada: dados.dataAgendada,
        hora_agendada: dados.horaAgendada || null, data_realizada: dados.dataRealizada || null,
        retorno_data: dados.retornoData || null, status: dados.status,
        questionario: dados.questionario, observacoes: dados.observacoes,
      }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id: data.id }, { status: 201 });
    }
    if (entrada.tipo === "participacao") {
      const dados = eccVinculoCasalSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      const casal = await supabase.from("ecc_casais").select("id").eq("id", dados.casalId).eq("paroquia_id", paroquiaId).maybeSingle();
      if (casal.error || !casal.data) throw casal.error ?? new Error("Casal não encontrado nesta paróquia.");
      const { data, error } = await supabase.from("ecc_encontro_casais").insert({
        paroquia_id: paroquiaId, encontro_id: dados.encontroId, casal_id: dados.casalId,
        situacao: dados.situacao, classificacao: dados.classificacao ?? "INDICADO", observacoes: dados.observacoes,
      }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id: data.id }, { status: 201 });
    }
    if (entrada.tipo === "equipe") {
      const dados = eccEquipeSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      const voluntario = await supabase.from("voluntarios").select("id").eq("id", dados.voluntarioId).eq("paroquia_id", paroquiaId).maybeSingle();
      if (voluntario.error || !voluntario.data) throw voluntario.error ?? new Error("Voluntário não encontrado nesta paróquia.");
      const { data, error } = await supabase.from("ecc_equipes").insert({
        paroquia_id: paroquiaId, encontro_id: dados.encontroId, voluntario_id: dados.voluntarioId,
        equipe: dados.equipe, funcao: dados.funcao, coordenador: dados.coordenador,
        status: dados.status, observacoes: dados.observacoes,
      }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id: data.id }, { status: 201 });
    }
    if (entrada.tipo === "programacao") {
      const dados = eccProgramacaoSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      const { data, error } = await supabase.from("ecc_programacao").insert({
        paroquia_id: paroquiaId, encontro_id: dados.encontroId, titulo: dados.titulo,
        descricao: dados.descricao, data: dados.data, hora_inicio: dados.horaInicio,
        hora_fim: dados.horaFim || null, ambiente: dados.ambiente, equipe: dados.equipe,
        responsavel_voluntario_id: dados.responsavelVoluntarioId || null,
        status: dados.status, observacoes: dados.observacoes,
      }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id: data.id }, { status: 201 });
    }
    if (entrada.tipo === "tarefa") {
      const dados = eccTarefaSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      const { data, error } = await supabase.from("ecc_tarefas").insert({
        paroquia_id: paroquiaId, encontro_id: dados.encontroId, titulo: dados.titulo,
        descricao: dados.descricao, equipe: dados.equipe,
        responsavel_voluntario_id: dados.responsavelVoluntarioId || null,
        prazo: dados.prazo || null, prioridade: dados.prioridade, status: dados.status,
        observacoes: dados.observacoes,
      }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id: data.id }, { status: 201 });
    }
    return NextResponse.json({ erro: "Tipo de registro do ECC inválido." }, { status: 400 });
  } catch (error) {
    return erro(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, paroquiaId } = await contexto(request, true);
    const entrada = (await request.json()) as { tipo?: string; id?: string; dados?: unknown };
    if (!entrada.id) return NextResponse.json({ erro: "Informe o registro." }, { status: 400 });
    let tabela = "";
    let alteracoes: Record<string, unknown> = {};
    if (entrada.tipo === "casal") {
      const dados = eccCasalSchema.parse(entrada.dados);
      tabela = "ecc_casais";
      alteracoes = {
        conjuge_um_nome: dados.conjugeUmNome, conjuge_dois_nome: dados.conjugeDoisNome,
        telefone: dados.telefone, email: dados.email, data_casamento: dados.dataCasamento || null,
        voluntario_um_id: dados.voluntarioUmId || null, voluntario_dois_id: dados.voluntarioDoisId || null,
        cep: dados.cep.replace(/\D/g, ""), logradouro: dados.logradouro, numero: dados.numero,
        complemento: dados.complemento, bairro: dados.bairro, cidade: dados.cidade,
        estado: dados.estado.toUpperCase(), latitude: dados.latitude, longitude: dados.longitude,
        situacao: dados.situacao, observacoes: dados.observacoes,
      };
    } else if (entrada.tipo === "visita") {
      const dados = eccVisitaSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      const [participacao, visitador] = await Promise.all([
        supabase.from("ecc_encontro_casais").select("id").eq("encontro_id", dados.encontroId).eq("casal_id", dados.casalId).eq("paroquia_id", paroquiaId).maybeSingle(),
        supabase.from("voluntarios").select("id").eq("id", dados.visitadorVoluntarioId).eq("paroquia_id", paroquiaId).maybeSingle(),
      ]);
      if (participacao.error || !participacao.data) throw participacao.error ?? new Error("O casal não pertence à edição selecionada.");
      if (visitador.error || !visitador.data) throw visitador.error ?? new Error("Responsável pela visita não encontrado nesta paróquia.");
      tabela = "ecc_visitas";
      alteracoes = {
        encontro_id: dados.encontroId, casal_id: dados.casalId,
        visitador_voluntario_id: dados.visitadorVoluntarioId, data_agendada: dados.dataAgendada,
        hora_agendada: dados.horaAgendada || null, data_realizada: dados.dataRealizada || null,
        retorno_data: dados.retornoData || null, status: dados.status,
        questionario: dados.questionario, observacoes: dados.observacoes,
      };
    } else if (entrada.tipo === "participacao") {
      const dados = eccParticipacaoSchema.parse(entrada.dados);
      tabela = "ecc_encontro_casais";
      alteracoes = { situacao: dados.situacao, observacoes: dados.observacoes };
      if (dados.classificacao) alteracoes.classificacao = dados.classificacao;
    } else if (entrada.tipo === "tarefa") {
      const dados = eccTarefaStatusSchema.parse((entrada.dados as { status?: unknown })?.status);
      tabela = "ecc_tarefas";
      alteracoes = { status: dados };
    } else if (entrada.tipo === "programacao") {
      const dados = eccProgramacaoStatusSchema.parse((entrada.dados as { status?: unknown })?.status);
      tabela = "ecc_programacao";
      alteracoes = { status: dados };
    } else {
      return NextResponse.json({ erro: "Tipo de atualização do ECC inválido." }, { status: 400 });
    }
    const { data, error } = await supabase.from(tabela).update({
      ...alteracoes,
      updated_at: new Date().toISOString(),
    }).eq("id", entrada.id).eq("paroquia_id", paroquiaId).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });
    return NextResponse.json({ id: data.id });
  } catch (error) {
    return erro(error);
  }
}
