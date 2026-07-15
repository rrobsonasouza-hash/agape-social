import { z } from "zod";

export const doadorSchema = z.object({
  nome: z.string().min(3, "Informe o nome do doador."),
  tipoPessoa: z.enum(["FISICA", "JURIDICA"]),
  documento: z.string().min(11, "Informe CPF ou CNPJ."),
  telefone: z.string().min(10, "Telefone inválido."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  interesseDoacao: z.string().min(2, "Informe o principal interesse de doação."),
  frequencia: z.enum(["PONTUAL", "EVENTUAL", "MENSAL"]),
  observacoes: z.string().max(1000).optional().default(""),
  status: z.enum(["ATIVO", "INATIVO"]),
});

export type DoadorFormInput = z.input<typeof doadorSchema>;
export type DoadorFormData = z.output<typeof doadorSchema>;
