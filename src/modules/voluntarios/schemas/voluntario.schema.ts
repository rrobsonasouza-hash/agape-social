import { z } from "zod";

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

  pastoral: z
    .string()
    .min(2, "Informe a pastoral ou área de atuação."),

  funcao: z
    .string()
    .min(2, "Informe a função do voluntário."),

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
});

export type VoluntarioFormData = z.infer<typeof voluntarioSchema>;