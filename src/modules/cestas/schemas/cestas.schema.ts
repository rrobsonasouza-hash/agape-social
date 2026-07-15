import { z } from "zod";

export const itemCestaSchema = z.object({
  id: z.string(),
  nome: z.string().min(2),
  quantidade: z.coerce.number().positive(),
  unidade: z.string().min(1),
});

export const campanhaCestasSchema = z.object({
  nome: z.string().min(3, "Informe o nome da campanha."),
  metaCestas: z.coerce.number().int().positive("Informe uma meta válida."),
  dataLimite: z.string().min(1, "Informe a data limite."),
  status: z.enum(["ATIVA", "ENCERRADA"]),
});

export const movimentacaoCestasSchema = z.object({
  campanhaId: z.string().min(1),
  tipo: z.enum(["CESTA_PRONTA", "ITEM_AVULSO"]),
  origem: z.enum(["DOACAO", "COMPRA_PAROQUIA"]),
  operacao: z.enum(["ENTRADA", "SAIDA"]).optional().default("ENTRADA"),
  doadorId: z.string().optional().default(""),
  doadorNome: z.string().optional().default(""),
  itemId: z.string().optional().default(""),
  itemNome: z.string().optional().default(""),
  quantidade: z.coerce.number().positive("Informe a quantidade."),
  unidade: z.string().optional().default(""),
  valorTotal: z.coerce.number().min(0).optional().default(0),
  data: z.string().min(1),
  observacoes: z.string().max(500).optional().default(""),
  familiaId: z.string().optional().default(""),
  familiaNome: z.string().optional().default(""),
});

export type CampanhaCestasData = z.output<typeof campanhaCestasSchema>;
export type MovimentacaoCestasData = z.output<typeof movimentacaoCestasSchema>;
