import { Role } from "@/config/roles";

export type StatusUsuario = "PENDENTE" | "ATIVO" | "INATIVO";
export interface UsuarioDocumento { id: string; nome: string; email: string; telefone: string; role: Role; paroquiaId: string; paroquiaNome: string; status: StatusUsuario; observacoes: string; createdAt?: unknown; updatedAt?: unknown; ultimoAcesso?: string | null; }
export type UsuarioFormData = Omit<UsuarioDocumento, "id" | "createdAt" | "updatedAt" | "ultimoAcesso">;
