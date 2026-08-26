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
  situacao: z.enum(["ELEGIVEL", "CONVIDADO", "INSCRITO", "CONFIRMADO", "LISTA_ESPERA", "DESISTENTE", "PARTICIPOU"]).default("ELEGIVEL"), observacoes: textoOpcional,
});

export const eccEquipeSchema = z.object({
  encontroId: z.string().uuid("Selecione uma edição do ECC."), voluntarioId: z.string().min(1, "Selecione um voluntário."),
  equipe: z.string().trim().min(2, "Informe a equipe."), funcao: z.string().trim().min(2, "Informe a função."), coordenador: z.boolean().default(false),
  status: z.enum(["CONVIDADO", "CONFIRMADO", "INDISPONIVEL", "PARTICIPOU"]).default("CONVIDADO"), observacoes: textoOpcional,
});

export const eccProgramacaoStatusSchema = z.enum(["PLANEJADA", "CONFIRMADA", "CONCLUIDA", "CANCELADA"]);
export const eccTarefaStatusSchema = z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]);

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
  observacoes: textoOpcional,
});

export const eccVinculoCasalSchema = eccParticipacaoSchema.extend({
  encontroId: z.string().uuid("Selecione uma edição do ECC."),
  casalId: z.string().uuid("Selecione um casal."),
});

export type EccEncontroFormData = z.infer<typeof eccEncontroSchema>;
export type EccCasalFormData = z.infer<typeof eccCasalSchema>;
export type EccEquipeFormData = z.infer<typeof eccEquipeSchema>;
export type EccProgramacaoFormData = z.infer<typeof eccProgramacaoSchema>;
export type EccTarefaFormData = z.infer<typeof eccTarefaSchema>;
export type EccParticipacaoFormData = z.infer<typeof eccParticipacaoSchema>;
export type EccVinculoCasalFormData = z.infer<typeof eccVinculoCasalSchema>;
