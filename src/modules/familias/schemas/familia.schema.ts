import { z } from "zod";

export const familiaSchema = z.object({
  nomeResponsavel: z
    .string()
    .min(3, "Informe o nome do responsável."),

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

  // Campos que ainda serão implementados na tela
  cep: z.string().optional().default(""),
  logradouro: z.string().optional().default(""),
  numero: z.string().optional().default(""),
  complemento: z.string().optional().default(""),
  bairro: z.string().optional().default(""),
  cidade: z.string().optional().default(""),
  estado: z.string().optional().default(""),

  quantidadeMoradores: z.coerce.number().default(1),

  rendaFamiliar: z.coerce.number().default(0),

  observacoes: z.string().optional().default(""),

  status: z.enum(["ATIVA", "INATIVA"]),
});

export type FamiliaFormData = z.infer<typeof familiaSchema>;