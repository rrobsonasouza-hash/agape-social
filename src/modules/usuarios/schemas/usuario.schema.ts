import { z } from "zod";
export const usuarioSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo."),
  email: z.email("Informe um e-mail válido.").transform((email) => email.toLowerCase()),
  telefone: z.string().trim(),
  role: z.enum(["admin_plataforma", "admin_paroquia", "coordenador", "operador", "voluntario", "leitor", "atendente_secretaria", "tesoureiro"]),
  paroquiaId: z.string().trim().min(1, "Informe a paróquia."), paroquiaNome: z.string().trim().min(2, "Informe o nome da paróquia."),
  status: z.enum(["PENDENTE", "ATIVO", "INATIVO"]), observacoes: z.string().trim(),
});
