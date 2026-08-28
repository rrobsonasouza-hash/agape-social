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
  eccComunicacaoSchema,
  eccComunicacaoStatusSchema,
  eccDocumentoSchema,
  eccDocumentoStatusSchema,
  eccCredenciamentoSchema,
  eccArrecadacaoSchema,
  eccNecessidadeSchema,
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
    const [encontros, casais, participacoes, equipes, programacao, tarefas, visitas, comunicacoes, documentos, credenciamentos, arrecadacoes, necessidades, voluntarios] =
      await Promise.all([
        supabase.from("ecc_encontros").select("*").eq("paroquia_id", paroquiaId).order("data_inicio", { ascending: false }),
        supabase.from("ecc_casais").select("*").eq("paroquia_id", paroquiaId).order("conjuge_um_nome"),
        supabase.from("ecc_encontro_casais").select("*").eq("paroquia_id", paroquiaId).order("inscrito_em"),
        supabase.from("ecc_equipes").select("*").eq("paroquia_id", paroquiaId).order("equipe").order("funcao"),
        supabase.from("ecc_programacao").select("*").eq("paroquia_id", paroquiaId).order("data").order("hora_inicio"),
        supabase.from("ecc_tarefas").select("*").eq("paroquia_id", paroquiaId).order("prazo", { ascending: true, nullsFirst: false }),
        supabase.from("ecc_visitas").select("*").eq("paroquia_id", paroquiaId).order("data_agendada", { ascending: false }),
        supabase.from("ecc_comunicacoes").select("*").eq("paroquia_id", paroquiaId).order("created_at", { ascending: false }),
        supabase.from("ecc_documentos").select("*").eq("paroquia_id", paroquiaId).order("created_at", { ascending: false }),
        supabase.from("ecc_credenciamentos").select("*").eq("paroquia_id", paroquiaId).order("credenciado_em", { ascending: false, nullsFirst: false }),
        supabase.from("ecc_arrecadacoes").select("*").eq("paroquia_id", paroquiaId).order("created_at", { ascending: false }),
        supabase.from("ecc_necessidades").select("*").eq("paroquia_id", paroquiaId).order("item"),
        supabase.from("voluntarios").select("id,dados").eq("paroquia_id", paroquiaId).order("created_at", { ascending: false }),
      ]);
    for (const resultado of [encontros, casais, participacoes, equipes, programacao, tarefas, visitas, comunicacoes, documentos, credenciamentos, arrecadacoes, necessidades, voluntarios])
      if (resultado.error) throw resultado.error;

    const nomesVoluntarios = new Map(
      (voluntarios.data ?? []).map((item) => [
        item.id,
        String((item.dados as { nome?: string }).nome ?? "Voluntário"),
      ]),
    );
    const nomesCasaisVisitadores = new Map(
      (voluntarios.data ?? []).map((item) => {
        const dados = item.dados as Record<string, unknown>;
        return [item.id, [String(dados.nome ?? "Voluntário"), String(dados.conjugeNome ?? "")].filter(Boolean).join(" e ")];
      }),
    );
    const nomesCasais = new Map(
      (casais.data ?? []).map((item) => [
        item.id,
        `${item.conjuge_um_nome} e ${item.conjuge_dois_nome}`,
      ]),
    );
    const casaisDoadores = new Map<string, { id: string; nome: string; telefone: string }>();
    for (const item of voluntarios.data ?? []) {
      const dados = item.dados as Record<string, unknown>;
      const nome = String(dados.nome ?? "").trim();
      const conjuge = String(dados.conjugeNome ?? "").trim();
      if (!nome || !conjuge || String(dados.status ?? "ATIVO") !== "ATIVO") continue;
      const chave = [nome, conjuge].map((valor) => valor.toLocaleLowerCase("pt-BR")).sort().join("|");
      if (!casaisDoadores.has(chave)) casaisDoadores.set(chave, {
        id: item.id, nome: `${nome} e ${conjuge}`, telefone: String(dados.telefone ?? ""),
      });
    }

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
        inscritoEm: item.inscrito_em, conviteEnviadoEm: item.convite_enviado_em ?? "",
        respostaEm: item.resposta_em ?? "", confirmadoEm: item.confirmado_em ?? "", observacoes: item.observacoes,
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
        visitadorNome: nomesCasaisVisitadores.get(item.visitador_voluntario_id) ?? nomesVoluntarios.get(item.visitador_voluntario_id) ?? "Não definido",
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
      comunicacoes: (comunicacoes.data ?? []).map((item) => ({
        id: item.id, encontroId: item.encontro_id, titulo: item.titulo, mensagem: item.mensagem,
        canal: item.canal, publico: item.publico, status: item.status,
        programadaPara: item.programada_para ?? "", enviadaEm: item.enviada_em ?? "", criadoEm: item.created_at,
      })),
      documentos: (documentos.data ?? []).map((item) => ({
        id: item.id, encontroId: item.encontro_id, titulo: item.titulo, categoria: item.categoria,
        url: item.url, caminhoStorage: item.caminho_storage ?? "", nomeArquivo: item.nome_arquivo ?? "",
        tipoArquivo: item.tipo_arquivo ?? "", tamanhoBytes: Number(item.tamanho_bytes ?? 0),
        observacoes: item.observacoes, status: item.status, criadoEm: item.created_at,
      })),
      credenciamentos: (credenciamentos.data ?? []).map((item) => ({
        id: item.id, encontroId: item.encontro_id, casalId: item.casal_id,
        casalNome: nomesCasais.get(item.casal_id) ?? "Casal não encontrado", status: item.status,
        credenciadoEm: item.credenciado_em ?? "", crachaEntregue: item.cracha_entregue === true,
        materialEntregue: item.material_entregue === true, observacoes: item.observacoes ?? "",
      })),
      arrecadacoes: (arrecadacoes.data ?? []).map((item) => ({
        id: item.id, encontroId: item.encontro_id, categoria: item.categoria, item: item.item,
        responsavel: item.responsavel ?? "", telefone: item.telefone ?? "", unidade: item.unidade ?? "unidade",
        quantidadePrometida: Number(item.quantidade_prometida ?? 0), quantidadeRecebida: Number(item.quantidade_recebida ?? 0),
        valorPrometido: Number(item.valor_prometido ?? 0), valorRecebido: Number(item.valor_recebido ?? 0),
        status: item.status, observacoes: item.observacoes ?? "", criadoEm: item.created_at,
      })),
      necessidades: (necessidades.data ?? []).map((item) => ({
        id: item.id, encontroId: item.encontro_id, categoria: item.categoria, item: item.item,
        unidade: item.unidade ?? "unidade", quantidadeNecessaria: Number(item.quantidade_necessaria ?? 0),
        valorNecessario: Number(item.valor_necessario ?? 0), observacoes: item.observacoes ?? "",
        ativa: item.ativa !== false, criadoEm: item.created_at,
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
      casaisDoadores: [...casaisDoadores.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
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

function statusArrecadacao(dados: ReturnType<typeof eccArrecadacaoSchema.parse>) {
  if (dados.status === "CANCELADO") return "CANCELADO";
  const prometido = dados.categoria === "VALOR" ? dados.valorPrometido : dados.quantidadePrometida;
  const recebido = dados.categoria === "VALOR" ? dados.valorRecebido : dados.quantidadeRecebida;
  if (recebido >= prometido) return "RECEBIDO";
  return recebido > 0 ? "PARCIAL" : "PENDENTE";
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
          classificacao: dados.classificacaoEncontro,
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
    if (entrada.tipo === "comunicacao") {
      const dados = eccComunicacaoSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      const enviadaEm = dados.status === "ENVIADA" ? new Date().toISOString() : null;
      const { data, error } = await supabase.from("ecc_comunicacoes").insert({
        paroquia_id: paroquiaId, encontro_id: dados.encontroId, titulo: dados.titulo,
        mensagem: dados.mensagem, canal: dados.canal, publico: dados.publico, status: dados.status,
        programada_para: dados.programadaPara || null, enviada_em: enviadaEm, criado_por: usuario.uid,
      }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id: data.id }, { status: 201 });
    }
    if (entrada.tipo === "documento") {
      const dados = eccDocumentoSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      const { data, error } = await supabase.from("ecc_documentos").insert({
        paroquia_id: paroquiaId, encontro_id: dados.encontroId, titulo: dados.titulo,
        categoria: dados.categoria, url: dados.url, observacoes: dados.observacoes,
        status: dados.status, criado_por: usuario.uid,
      }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id: data.id }, { status: 201 });
    }
    if (entrada.tipo === "credenciamento") {
      const dados = eccCredenciamentoSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      const participacao = await supabase.from("ecc_encontro_casais").select("id,classificacao")
        .eq("encontro_id", dados.encontroId).eq("casal_id", dados.casalId).eq("paroquia_id", paroquiaId).maybeSingle();
      if (participacao.error || !participacao.data) throw participacao.error ?? new Error("O casal não pertence à edição selecionada.");
      if (["EQUIPE", "COORDENADOR"].includes(participacao.data.classificacao))
        throw new Error("O credenciamento de casais participantes não se aplica à equipe desta edição.");
      const agora = new Date().toISOString();
      const { data, error } = await supabase.from("ecc_credenciamentos").upsert({
        paroquia_id: paroquiaId, encontro_id: dados.encontroId, casal_id: dados.casalId,
        status: dados.status, credenciado_em: dados.status === "CREDENCIADO" ? agora : null,
        cracha_entregue: dados.crachaEntregue, material_entregue: dados.materialEntregue,
        observacoes: dados.observacoes, registrado_por: usuario.uid, updated_at: agora,
      }, { onConflict: "encontro_id,casal_id" }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id: data.id }, { status: 201 });
    }
    if (entrada.tipo === "arrecadacao") {
      const dados = eccArrecadacaoSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      const { data, error } = await supabase.from("ecc_arrecadacoes").insert({
        paroquia_id: paroquiaId, encontro_id: dados.encontroId, categoria: dados.categoria,
        item: dados.item, responsavel: dados.responsavel, telefone: dados.telefone, unidade: dados.unidade,
        quantidade_prometida: dados.quantidadePrometida, quantidade_recebida: dados.quantidadeRecebida,
        valor_prometido: dados.valorPrometido, valor_recebido: dados.valorRecebido,
        status: statusArrecadacao(dados), observacoes: dados.observacoes, criado_por: usuario.uid,
      }).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id: data.id }, { status: 201 });
    }
    if (entrada.tipo === "necessidade") {
      const dados = eccNecessidadeSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      const { data, error } = await supabase.from("ecc_necessidades").insert({
        paroquia_id: paroquiaId, encontro_id: dados.encontroId, categoria: dados.categoria,
        item: dados.item, unidade: dados.categoria === "VALOR" ? "R$" : dados.unidade,
        quantidade_necessaria: dados.quantidadeNecessaria, valor_necessario: dados.valorNecessario,
        observacoes: dados.observacoes, ativa: dados.ativa, criado_por: usuario.uid,
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
    } else if (entrada.tipo === "convite") {
      const atual = await supabase.from("ecc_encontro_casais").select("id")
        .eq("id", entrada.id).eq("paroquia_id", paroquiaId).maybeSingle();
      if (atual.error || !atual.data) return NextResponse.json({ erro: "Participação não encontrada." }, { status: 404 });
      tabela = "ecc_encontro_casais";
      alteracoes = { situacao: "CONVIDADO", convite_enviado_em: new Date().toISOString() };
    } else if (entrada.tipo === "participacao") {
      const dados = eccParticipacaoSchema.parse(entrada.dados);
      const atual = await supabase.from("ecc_encontro_casais")
        .select("id,encontro_id,classificacao,situacao,convite_enviado_em,resposta_em,confirmado_em")
        .eq("id", entrada.id).eq("paroquia_id", paroquiaId).maybeSingle();
      if (atual.error || !atual.data) return NextResponse.json({ erro: "Participação não encontrada." }, { status: 404 });
      const classificacao = dados.classificacao ?? atual.data.classificacao ?? "INDICADO";
      let situacao = dados.situacao;
      const ocupaVaga = ["INDICADO", "ENCONTRISTA", "CONVIDADO", "VISITANTE"].includes(classificacao);
      if (situacao === "CONFIRMADO" && ocupaVaga) {
        const encontro = await supabase.from("ecc_encontros").select("capacidade_casais")
          .eq("id", atual.data.encontro_id).eq("paroquia_id", paroquiaId).maybeSingle();
        if (encontro.error || !encontro.data) throw encontro.error ?? new Error("Encontro não encontrado nesta paróquia.");
        const capacidade = Number(encontro.data.capacidade_casais ?? 0);
        if (capacidade > 0) {
          const confirmados = await supabase.from("ecc_encontro_casais").select("id", { count: "exact", head: true })
            .eq("encontro_id", atual.data.encontro_id).eq("paroquia_id", paroquiaId)
            .in("situacao", ["CONFIRMADO", "PARTICIPOU"])
            .in("classificacao", ["INDICADO", "ENCONTRISTA", "CONVIDADO", "VISITANTE"])
            .neq("id", entrada.id);
          if (confirmados.error) throw confirmados.error;
          if ((confirmados.count ?? 0) >= capacidade) situacao = "LISTA_ESPERA";
        }
      }
      const agora = new Date().toISOString();
      tabela = "ecc_encontro_casais";
      alteracoes = { situacao, observacoes: dados.observacoes };
      if (dados.classificacao) alteracoes.classificacao = dados.classificacao;
      if (situacao === "CONVIDADO" && !atual.data.convite_enviado_em) alteracoes.convite_enviado_em = agora;
      if (["INSCRITO", "CONFIRMADO", "LISTA_ESPERA", "DESISTENTE"].includes(situacao) && !atual.data.resposta_em) alteracoes.resposta_em = agora;
      if (situacao === "CONFIRMADO" && !atual.data.confirmado_em) alteracoes.confirmado_em = agora;
    } else if (entrada.tipo === "tarefa") {
      const dados = eccTarefaStatusSchema.parse((entrada.dados as { status?: unknown })?.status);
      tabela = "ecc_tarefas";
      alteracoes = { status: dados };
    } else if (entrada.tipo === "programacao") {
      const dados = eccProgramacaoStatusSchema.parse((entrada.dados as { status?: unknown })?.status);
      tabela = "ecc_programacao";
      alteracoes = { status: dados };
    } else if (entrada.tipo === "comunicacao") {
      const dados = eccComunicacaoStatusSchema.parse((entrada.dados as { status?: unknown })?.status);
      tabela = "ecc_comunicacoes";
      alteracoes = { status: dados, enviada_em: dados === "ENVIADA" ? new Date().toISOString() : null };
    } else if (entrada.tipo === "documento") {
      const dados = eccDocumentoStatusSchema.parse((entrada.dados as { status?: unknown })?.status);
      tabela = "ecc_documentos";
      alteracoes = { status: dados };
    } else if (entrada.tipo === "arrecadacao") {
      const dados = eccArrecadacaoSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      tabela = "ecc_arrecadacoes";
      alteracoes = {
        encontro_id: dados.encontroId, categoria: dados.categoria, item: dados.item,
        responsavel: dados.responsavel, telefone: dados.telefone, unidade: dados.unidade,
        quantidade_prometida: dados.quantidadePrometida, quantidade_recebida: dados.quantidadeRecebida,
        valor_prometido: dados.valorPrometido, valor_recebido: dados.valorRecebido,
        status: statusArrecadacao(dados), observacoes: dados.observacoes,
      };
    } else if (entrada.tipo === "necessidade") {
      const dados = eccNecessidadeSchema.parse(entrada.dados);
      await validarEncontro(supabase, paroquiaId, dados.encontroId);
      tabela = "ecc_necessidades";
      alteracoes = {
        encontro_id: dados.encontroId, categoria: dados.categoria, item: dados.item,
        unidade: dados.categoria === "VALOR" ? "R$" : dados.unidade,
        quantidade_necessaria: dados.quantidadeNecessaria, valor_necessario: dados.valorNecessario,
        observacoes: dados.observacoes, ativa: dados.ativa,
      };
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
