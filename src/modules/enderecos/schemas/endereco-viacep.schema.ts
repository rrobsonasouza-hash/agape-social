import { z } from "zod";

export const enderecoViaCepResponseSchema = z.object({
  cep: z.string().optional().default(""),
  logradouro: z.string().optional().default(""),
  complemento: z.string().optional().default(""),
  bairro: z.string().optional().default(""),
  localidade: z.string().optional().default(""),
  uf: z.string().optional().default(""),
  ibge: z.string().optional().default(""),
  erro: z.boolean().optional().default(false),
});
