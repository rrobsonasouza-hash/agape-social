import { z } from "zod";

export const statusVisitaSchema = z.enum([
  "AGENDADA",
  "REALIZADA",
  "CANCELADA",
]);

export const visitaSchema = z.object({
  familiaId: z.string().min(1, "Selecione uma família."),
  familiaNome: z.string().min(1),
  voluntarioId: z.string().optional().default(""),
  voluntarioNome: z.string().optional().default(""),
  data: z.string().min(1, "Informe a data da visita."),
  horario: z.string().min(1, "Informe o horário."),
  objetivo: z.string().min(3, "Informe o objetivo da visita."),
  observacoes: z.string().max(1000).optional().default(""),
  status: statusVisitaSchema.default("AGENDADA"),
});

export type StatusVisita = z.infer<typeof statusVisitaSchema>;
export type VisitaFormInput = z.input<typeof visitaSchema>;
export type VisitaFormData = z.output<typeof visitaSchema>;
