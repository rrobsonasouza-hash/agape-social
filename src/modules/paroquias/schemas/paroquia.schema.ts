import { z } from "zod";

export const paroquiaSchema = z.object({
  nome: z.string().min(3, "Informe o nome da paróquia."),
  cep: z.string().refine(
    (valor) => valor.replace(/\D/g, "").length === 8,
    "CEP inválido."
  ),
  logradouro: z.string().min(3, "Informe o logradouro."),
  numero: z.string().min(1, "Informe o número."),
  complemento: z.string().optional().default(""),
  bairro: z.string().min(2, "Informe o bairro."),
  cidade: z.string().min(2, "Informe a cidade."),
  estado: z.string().length(2, "Informe a UF."),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  raioAtendimentoKm: z.coerce
    .number()
    .positive("O raio deve ser maior que zero."),
}).refine(
  (dados) => dados.latitude !== 0 || dados.longitude !== 0,
  {
    message: "Marque a localização da paróquia no mapa.",
    path: ["latitude"],
  }
);

export type ParoquiaFormInput = z.input<typeof paroquiaSchema>;
export type ParoquiaFormData = z.output<typeof paroquiaSchema>;
