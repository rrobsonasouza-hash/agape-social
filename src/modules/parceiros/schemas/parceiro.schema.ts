import { z } from "zod";

export const parceiroSchema = z.object({
  razaoSocial: z.string().min(3, "Informe a razão social."),
  nomeFantasia: z.string().optional().default(""),
  cnpj: z.string().refine((valor) => valor.replace(/\D/g, "").length === 14, "CNPJ inválido."),
  responsavel: z.string().min(3, "Informe a pessoa responsável."),
  telefone: z.string().min(10, "Telefone inválido."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  tipoParceria: z.string().min(3, "Informe o tipo de parceria."),
  contrapartida: z.string().min(3, "Descreva a contribuição do parceiro."),
  inicioVigencia: z.string().optional().default(""),
  fimVigencia: z.string().optional().default(""),
  observacoes: z.string().max(1000).optional().default(""),
  status: z.enum(["ATIVO", "INATIVO"]),
});

export type ParceiroFormInput = z.input<typeof parceiroSchema>;
export type ParceiroFormData = z.output<typeof parceiroSchema>;
