import { z } from "zod";

const textoOpcional = z.string().trim().max(1000).default("");

export const eccEncontroSchema = z.object({
  numero: z.coerce.number().int().positive("Informe o número do ECC."), nome: z.string().trim().min(3, "Informe o nome do encontro."),
  tema: textoOpcional, lema: textoOpcional, dataInicio: z.string().date(), dataFim: z.string().date(),
  prazoInscricao: z.string().date().or(z.literal("")).default(""), local: textoOpcional,
  capacidadeCasais: z.coerce.number().int().min(0).default(0),
  status: z.enum(["PLANEJAMENTO", "INSCRICOES", "PREPARACAO", "REALIZADO", "ENCERRADO"]).default("PLANEJAMENTO"), observacoes: textoOpcional,
}).refine((dados) => dados.dataFim >= dados.dataInicio, { message: "A data final deve ser igual ou posterior à inicial.", path: ["dataFim"] });

export const eccCasalSchema = z.object({
  conjugeUmNome: z.string().trim().min(3, "Informe o nome do primeiro cônjuge."), conjugeDoisNome: z.string().trim().min(3, "Informe o nome do segundo cônjuge."),
  telefone: z.string().trim().max(30).default(""), email: z.string().trim().email("E-mail inválido.").or(z.literal("")).default(""),
  dataCasamento: z.string().date().or(z.literal("")).default(""), encontroId: z.string().uuid().or(z.literal("")).default(""), voluntarioUmId: z.string().default(""), voluntarioDoisId: z.string().default(""),
  cep: z.string().trim().refine((valor) => !valor || valor.replace(/\D/g, "").length === 8, "CEP invÃ¡lido.").default(""),
  logradouro: z.string().trim().max(180).default(""), numero: z.string().trim().max(30).default(""),
  complemento: z.string().trim().max(120).default(""), bairro: z.string().trim().max(120).default(""),
  cidade: z.string().trim().max(120).default(""), estado: z.string().trim().max(2).default(""),
  latitude: z.coerce.number().min(-90).max(90).nullable().default(null),
  longitude: z.coerce.number().min(-180).max(180).nullable().default(null),
  situacao: z.enum(["ELEGIVEL", "CONVIDADO", "INSCRITO", "CONFIRMADO", "LISTA_ESPERA", "DESISTENTE", "PARTICIPOU"]).default("ELEGIVEL"),
  classificacaoEncontro: z.enum(["INDICADO", "ENCONTRISTA", "CONVIDADO", "VISITANTE"]).default("INDICADO"),
  observacoes: textoOpcional,
});

export const eccEquipeSchema = z.object({
  encontroId: z.string().uuid("Selecione uma edição do ECC."), voluntarioId: z.string().min(1, "Selecione um voluntário."),
  equipe: z.string().trim().min(2, "Informe a equipe."), funcao: z.string().trim().min(2, "Informe a função."), coordenador: z.boolean().default(false),
  status: z.enum(["CONVIDADO", "CONFIRMADO", "INDISPONIVEL", "PARTICIPOU"]).default("CONVIDADO"), observacoes: textoOpcional,
});

export const eccProgramacaoStatusSchema = z.enum(["PLANEJADA", "CONFIRMADA", "CONCLUIDA", "CANCELADA"]);
export const eccTarefaStatusSchema = z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]);
export const eccVisitaStatusSchema = z.enum(["PENDENTE", "AGENDADA", "REALIZADA", "RETORNO_NECESSARIO", "CANCELADA"]);
export const eccComunicacaoStatusSchema = z.enum(["RASCUNHO", "PROGRAMADA", "ENVIADA", "CANCELADA"]);
export const eccDocumentoStatusSchema = z.enum(["PENDENTE", "DISPONIVEL", "ARQUIVADO"]);
export const eccCredenciamentoStatusSchema = z.enum(["AGUARDANDO", "CREDENCIADO", "AUSENTE", "CANCELADO"]);
export const eccClassificacaoParticipacaoSchema = z.enum(["INDICADO", "ENCONTRISTA", "CONVIDADO", "VISITANTE", "EQUIPE", "COORDENADOR"]);

export const eccProgramacaoSchema = z.object({
  encontroId: z.string().uuid("Selecione uma edição do ECC."),
  titulo: z.string().trim().min(3, "Informe o título da atividade."),
  descricao: textoOpcional,
  data: z.string().date("Informe a data da atividade."),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Informe o horário inicial."),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal("")).default(""),
  ambiente: z.string().trim().max(160).default(""),
  equipe: z.string().trim().max(160).default(""),
  responsavelVoluntarioId: z.string().default(""),
  status: eccProgramacaoStatusSchema.default("PLANEJADA"),
  observacoes: textoOpcional,
}).refine((dados) => !dados.horaFim || dados.horaFim >= dados.horaInicio, {
  message: "O horário final deve ser posterior ao inicial.",
  path: ["horaFim"],
});

export const eccTarefaSchema = z.object({
  encontroId: z.string().uuid("Selecione uma edição do ECC."),
  titulo: z.string().trim().min(3, "Informe o título da tarefa."),
  descricao: textoOpcional,
  equipe: z.string().trim().max(160).default(""),
  responsavelVoluntarioId: z.string().default(""),
  prazo: z.string().date().or(z.literal("")).default(""),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).default("MEDIA"),
  status: eccTarefaStatusSchema.default("PENDENTE"),
  observacoes: textoOpcional,
});

export const eccParticipacaoSchema = z.object({
  situacao: z.enum(["CONVIDADO", "INSCRITO", "CONFIRMADO", "LISTA_ESPERA", "DESISTENTE", "PARTICIPOU"]),
  classificacao: eccClassificacaoParticipacaoSchema.optional(),
  observacoes: textoOpcional,
});

export const eccVinculoCasalSchema = eccParticipacaoSchema.extend({
  encontroId: z.string().uuid("Selecione uma edição do ECC."),
  casalId: z.string().uuid("Selecione um casal."),
});

export const eccNovoVoluntarioSchema = z.object({
  casalId: z.string().uuid("Selecione um casal."),
  posicao: z.enum(["UM", "DOIS"]),
  cpf: z.string().trim().refine((valor) => valor.replace(/\D/g, "").length === 11, "Informe um CPF válido."),
  telefone: z.string().trim().min(10, "Informe o telefone."),
  email: z.string().trim().email("E-mail inválido.").or(z.literal("")).default(""),
  pastoral: z.string().trim().min(2, "Informe a pastoral ou área de atuação."),
  funcao: z.string().trim().min(2, "Informe a função do voluntário."),
  dataIngresso: z.string().date().or(z.literal("")).default(""),
});

export const eccVisitaSchema = z.object({
  encontroId: z.string().uuid("Selecione uma edição do ECC."),
  casalId: z.string().uuid("Selecione o casal que será visitado."),
  visitadorVoluntarioId: z.string().min(1, "Selecione o responsável pela visita."),
  dataAgendada: z.string().date("Informe a data da visita."),
  horaAgendada: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal("")).default(""),
  dataRealizada: z.string().date().or(z.literal("")).default(""),
  retornoData: z.string().date().or(z.literal("")).default(""),
  status: eccVisitaStatusSchema.default("AGENDADA"),
  questionario: z.object({
    motivoParticipacao: z.string().trim().max(1000).default(""),
    expectativas: z.string().trim().max(1000).default(""),
    participacaoParoquial: z.string().trim().max(500).default(""),
    filhosCuidados: z.string().trim().max(500).default(""),
    restricoesAlimentares: z.string().trim().max(500).default(""),
    necessidadesAcessibilidade: z.string().trim().max(500).default(""),
    contatoEmergencia: z.string().trim().max(300).default(""),
    observacoesPastorais: z.string().trim().max(1500).default(""),
    consentimentoInformacoes: z.boolean().default(false),
  }),
  observacoes: textoOpcional,
}).superRefine((dados, contexto) => {
  if (["REALIZADA", "RETORNO_NECESSARIO"].includes(dados.status) && !dados.dataRealizada)
    contexto.addIssue({ code: "custom", path: ["dataRealizada"], message: "Informe a data em que a visita foi realizada." });
  if (["REALIZADA", "RETORNO_NECESSARIO"].includes(dados.status) && !dados.questionario.consentimentoInformacoes)
    contexto.addIssue({ code: "custom", path: ["questionario", "consentimentoInformacoes"], message: "Confirme o consentimento para registrar o questionário." });
  if (dados.status === "RETORNO_NECESSARIO" && !dados.retornoData)
    contexto.addIssue({ code: "custom", path: ["retornoData"], message: "Informe a data prevista para o retorno." });
});

export const eccComunicacaoSchema = z.object({
  encontroId: z.string().uuid("Selecione uma edição do ECC."),
  titulo: z.string().trim().min(3, "Informe o assunto da comunicação."),
  mensagem: z.string().trim().min(5, "Escreva a mensagem."),
  canal: z.enum(["WHATSAPP", "EMAIL", "AVISO"]).default("WHATSAPP"),
  publico: z.enum(["TODOS", "PARTICIPANTES", "EQUIPE", "COORDENACAO"]).default("TODOS"),
  status: eccComunicacaoStatusSchema.default("RASCUNHO"),
  programadaPara: z.string().default(""),
});

export const eccDocumentoSchema = z.object({
  encontroId: z.string().uuid("Selecione uma edição do ECC."),
  titulo: z.string().trim().min(3, "Informe o nome do documento."),
  categoria: z.enum(["FICHA", "LISTA", "ROTEIRO", "TERMO", "MATERIAL", "OUTRO"]).default("OUTRO"),
  url: z.string().trim().url("Informe um link válido.").or(z.literal("")).default(""),
  observacoes: textoOpcional,
  status: eccDocumentoStatusSchema.default("PENDENTE"),
});

export const eccCredenciamentoSchema = z.object({
  encontroId: z.string().uuid("Selecione uma edição do ECC."),
  casalId: z.string().uuid("Selecione um casal participante."),
  status: eccCredenciamentoStatusSchema.default("CREDENCIADO"),
  crachaEntregue: z.boolean().default(false),
  materialEntregue: z.boolean().default(false),
  observacoes: textoOpcional,
});

export const eccArrecadacaoSchema = z.object({
  encontroId: z.string().uuid("Selecione uma edição do ECC."),
  categoria: z.enum(["ALIMENTO", "BEBIDA", "VALOR", "OUTRO"]).default("ALIMENTO"),
  item: z.string().trim().min(2, "Informe o alimento, bebida ou finalidade do valor."),
  responsavel: z.string().trim().max(160).default(""),
  telefone: z.string().trim().max(30).default(""),
  unidade: z.string().trim().min(1).max(30).default("unidade"),
  quantidadePrometida: z.coerce.number().min(0).default(0),
  quantidadeRecebida: z.coerce.number().min(0).default(0),
  valorPrometido: z.coerce.number().min(0).default(0),
  valorRecebido: z.coerce.number().min(0).default(0),
  status: z.enum(["PENDENTE", "PARCIAL", "RECEBIDO", "CANCELADO"]).default("PENDENTE"),
  observacoes: textoOpcional,
}).superRefine((dados, contexto) => {
  if (dados.categoria === "VALOR" && dados.valorPrometido <= 0)
    contexto.addIssue({ code: "custom", path: ["valorPrometido"], message: "Informe o valor prometido." });
  if (dados.categoria !== "VALOR" && dados.quantidadePrometida <= 0)
    contexto.addIssue({ code: "custom", path: ["quantidadePrometida"], message: "Informe a quantidade prometida." });
});

export type EccEncontroFormData = z.infer<typeof eccEncontroSchema>;
export type EccCasalFormData = z.infer<typeof eccCasalSchema>;
export type EccEquipeFormData = z.infer<typeof eccEquipeSchema>;
export type EccProgramacaoFormData = z.infer<typeof eccProgramacaoSchema>;
export type EccTarefaFormData = z.infer<typeof eccTarefaSchema>;
export type EccParticipacaoFormData = z.infer<typeof eccParticipacaoSchema>;
export type EccVinculoCasalFormData = z.infer<typeof eccVinculoCasalSchema>;
export type EccNovoVoluntarioFormData = z.infer<typeof eccNovoVoluntarioSchema>;
export type EccVisitaFormData = z.infer<typeof eccVisitaSchema>;
export type EccComunicacaoFormData = z.infer<typeof eccComunicacaoSchema>;
export type EccDocumentoFormData = z.infer<typeof eccDocumentoSchema>;
export type EccCredenciamentoFormData = z.infer<typeof eccCredenciamentoSchema>;
export type EccArrecadacaoFormData = z.infer<typeof eccArrecadacaoSchema>;
