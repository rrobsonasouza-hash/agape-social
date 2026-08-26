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
  situacao: z.enum(["ELEGIVEL", "CONVIDADO", "INSCRITO", "CONFIRMADO", "LISTA_ESPERA", "DESISTENTE", "PARTICIPOU"]).default("ELEGIVEL"), observacoes: textoOpcional,
});

export const eccEquipeSchema = z.object({
  encontroId: z.string().uuid("Selecione uma edição do ECC."), voluntarioId: z.string().min(1, "Selecione um voluntário."),
  equipe: z.string().trim().min(2, "Informe a equipe."), funcao: z.string().trim().min(2, "Informe a função."), coordenador: z.boolean().default(false),
  status: z.enum(["CONVIDADO", "CONFIRMADO", "INDISPONIVEL", "PARTICIPOU"]).default("CONVIDADO"), observacoes: textoOpcional,
});

export type EccEncontroFormData = z.infer<typeof eccEncontroSchema>;
export type EccCasalFormData = z.infer<typeof eccCasalSchema>;
export type EccEquipeFormData = z.infer<typeof eccEquipeSchema>;
