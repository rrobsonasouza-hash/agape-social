import { z } from "zod";

export function normalizarAtuacoesVoluntario(entrada: Record<string, unknown>) {
  const pastoral = String(entrada.pastoral ?? "");
  const funcao = String(entrada.funcao ?? "Voluntário");
  const legadoEcc = /(^|\W)ECC(\W|$)/i.test(pastoral);
  const legadoPromocao = !legadoEcc || /SOCIAL|PROMOÇÃO HUMANA/i.test(pastoral);
  return {
    ...entrada,
    atuaPromocaoHumana: entrada.atuaPromocaoHumana ?? legadoPromocao,
    funcaoPromocaoHumana: entrada.funcaoPromocaoHumana ?? (legadoPromocao ? funcao : ""),
    atuaEcc: entrada.atuaEcc ?? legadoEcc,
    funcaoEcc: entrada.funcaoEcc ?? (legadoEcc ? funcao : ""),
  };
}

export const voluntarioSchema = z.object({
  nome: z
    .string()
    .min(3, "Informe o nome completo do voluntário."),

  cpf: z
    .string()
    .min(11, "CPF inválido."),

  telefone: z
    .string()
    .min(10, "Telefone inválido."),

  email: z
    .string()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal("")),

  dataNascimento: z
    .string()
    .optional()
    .or(z.literal("")),

  conjugeNome: z.string().trim().max(160).optional().or(z.literal("")),
  cep: z.string().trim().refine((valor) => !valor || valor.replace(/\D/g, "").length === 8, "CEP invÃ¡lido.").optional().or(z.literal("")),
  logradouro: z.string().trim().max(180).optional().or(z.literal("")),
  numero: z.string().trim().max(30).optional().or(z.literal("")),
  complemento: z.string().trim().max(120).optional().or(z.literal("")),
  bairro: z.string().trim().max(120).optional().or(z.literal("")),
  cidade: z.string().trim().max(120).optional().or(z.literal("")),
  estado: z.string().trim().max(2).optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),

  pastoral: z
    .string()
    .min(2, "Informe a pastoral ou área de atuação."),

  funcao: z
    .string()
    .min(2, "Informe a função do voluntário."),

  atuaPromocaoHumana: z.boolean(),
  funcaoPromocaoHumana: z.string().trim().max(120).optional().or(z.literal("")),
  atuaEcc: z.boolean(),
  funcaoEcc: z.string().trim().max(120).optional().or(z.literal("")),

  dataIngresso: z
    .string()
    .optional()
    .or(z.literal("")),

  disponibilidade: z.object({
    segunda: z.boolean(),
    terca: z.boolean(),
    quarta: z.boolean(),
    quinta: z.boolean(),
    sexta: z.boolean(),
    sabado: z.boolean(),
    domingo: z.boolean(),
  }),

  observacoes: z
    .string()
    .max(1000, "As observações devem possuir no máximo 1000 caracteres.")
    .optional()
    .or(z.literal("")),

  status: z.enum(["ATIVO", "INATIVO"]),
}).superRefine((dados, contexto) => {
  if (!dados.atuaPromocaoHumana && !dados.atuaEcc) {
    contexto.addIssue({ code: "custom", path: ["atuaPromocaoHumana"], message: "Selecione ao menos uma frente de atuação." });
  }
  if (dados.atuaPromocaoHumana && !dados.funcaoPromocaoHumana?.trim()) {
    contexto.addIssue({ code: "custom", path: ["funcaoPromocaoHumana"], message: "Informe a função na Promoção Humana." });
  }
  if (dados.atuaEcc && !dados.funcaoEcc?.trim()) {
    contexto.addIssue({ code: "custom", path: ["funcaoEcc"], message: "Informe a função no ECC." });
  }
});

export type VoluntarioFormData = z.infer<typeof voluntarioSchema>;
