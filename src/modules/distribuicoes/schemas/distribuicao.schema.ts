import { z } from "zod";

export const statusDistribuicaoSchema = z.enum([
  "AGENDADA",
  "RETIRADA",
  "AUSENTE",
  "ENTREGUE_DOMICILIO",
]);

export const distribuicaoSchema = z.object({
  data: z.string().min(1),
  familiaId: z.string().min(1),
  familiaNome: z.string().min(1),
  campanhaId: z.string().min(1),
  quantidade: z.coerce.number().int().positive().default(1),
  status: statusDistribuicaoSchema.default("AGENDADA"),
});

export type StatusDistribuicao = z.infer<typeof statusDistribuicaoSchema>;
export type DistribuicaoData = z.output<typeof distribuicaoSchema>;
