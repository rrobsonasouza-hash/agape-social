import { z } from "zod";

export const familiaSchema = z.object({
  nomeResponsavel: z
    .string()
    .min(3, "Informe o nome do responsável."),

  cpf: z
    .string()
    .refine(
      (valor) => valor.replace(/\D/g, "").length === 11,
      "CPF inválido."
    ),

  telefone: z
    .string()
    .refine(
      (valor) => {
        const digitos = valor.replace(/\D/g, "");
        return digitos.length === 10 || digitos.length === 11;
      },
      "Telefone inválido."
    ),

  email: z
    .string()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal("")),

  cep: z.string().optional().default(""),
  logradouro: z.string().optional().default(""),
  numero: z.string().optional().default(""),
  complemento: z.string().optional().default(""),
  bairro: z.string().optional().default(""),
  cidade: z.string().optional().default(""),
  estado: z.string().optional().default(""),

  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),

  quantidadeMoradores: z.coerce.number().default(1),

  rendaFamiliar: z.coerce.number().default(0),

  observacoes: z.string().optional().default(""),

  consentimentoLgpd: z.boolean().optional().default(false),
  consentimentoLgpdEm: z.string().optional().default(""),
  versaoConsentimentoLgpd: z.string().optional().default(""),

  status: z.enum(["ATIVA", "INATIVA"]),
  beneficioBloqueado: z.boolean().optional().default(false),
  faltasConsecutivas: z.coerce.number().int().min(0).optional().default(0),
  motivoBloqueio: z.string().optional().default(""),
});

export const familiaCadastroSchema = familiaSchema.refine((dados) => dados.consentimentoLgpd, { path:["consentimentoLgpd"], message:"Confirme o consentimento para tratamento dos dados." });

export type FamiliaFormInput = z.input<typeof familiaSchema>;
export type FamiliaFormData = z.output<typeof familiaSchema>;
