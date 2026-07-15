import { User } from "firebase/auth";
import { Role } from "@/config/roles";

export interface UsuarioSessao {
  uid: string;
  nome: string;
  email: string;
  role: Role;
  paroquiaId: string;
}

export function usuarioFirebaseParaSessao(user: User): UsuarioSessao {
  return {
    uid: user.uid,
    nome: user.displayName || user.email?.split("@")[0] || "Usuário",
    email: user.email || "",
    role: "admin_paroquia",
    paroquiaId: "principal",
  };
}
