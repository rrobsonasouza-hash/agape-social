import { z } from "zod";

export const coordenadaSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const areaPastoralSchema = z.object({
  nome: z.string().min(3, "Informe o nome da área pastoral."),
  descricao: z.string().max(300).optional().default(""),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida."),
  ativa: z.boolean().default(true),
  poligono: z
    .array(coordenadaSchema)
    .min(3, "Marque pelo menos três pontos no mapa."),
});

export type Coordenada = z.infer<typeof coordenadaSchema>;
export type AreaPastoralFormData = z.infer<typeof areaPastoralSchema>;
