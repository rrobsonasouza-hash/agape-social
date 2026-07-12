import { z } from "zod";

const tiposPermitidos = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const tamanhoMaximoBytes = 5 * 1024 * 1024;

export const documentoSchema = z.object({
  tipo: z.enum([
    "RG",
    "CPF",
    "COMPROVANTE_RESIDENCIA",
    "LAUDO_MEDICO",
    "RECEITA_MEDICA",
    "CERTIDAO",
    "ENCAMINHAMENTO",
    "FOTO_RESIDENCIA",
    "OUTRO",
  ]),

  observacao: z
    .string()
    .max(500, "A observação deve possuir no máximo 500 caracteres.")
    .optional(),

  arquivo: z
    .instanceof(File, {
      message: "Selecione um arquivo.",
    })
    .refine(
      (arquivo) => tiposPermitidos.includes(arquivo.type),
      "Formato inválido. Utilize PDF, JPG ou PNG."
    )
    .refine(
      (arquivo) => arquivo.size <= tamanhoMaximoBytes,
      "O arquivo deve possuir no máximo 5 MB."
    ),
});

export type DocumentoFormData = z.infer<typeof documentoSchema>;

export const formatosDocumentoPermitidos =
  ".pdf,.jpg,.jpeg,.png";

export const tamanhoMaximoDocumentoBytes =
  tamanhoMaximoBytes;