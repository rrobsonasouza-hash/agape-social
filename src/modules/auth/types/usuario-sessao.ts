import { Role } from "@/config/roles";
import { UsuarioDocumento } from "@/modules/usuarios/types/usuario-documento";
export interface UsuarioSessao { uid: string; nome: string; email: string; role: Role; paroquiaId: string; }
export function perfilParaSessao(perfil: UsuarioDocumento): UsuarioSessao { return { uid: perfil.id, nome: perfil.nome, email: perfil.email, role: perfil.role, paroquiaId: perfil.paroquiaId }; }
