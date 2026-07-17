import { auth } from "@/lib/firebase/auth";
import { UsuarioDocumento } from "../types/usuario-documento";
export class UsuarioRepository {
  async listar(): Promise<UsuarioDocumento[]> { const token = await auth.currentUser?.getIdToken(); if (!token) throw new Error("Sessão expirada."); const resposta = await fetch("/api/usuarios", { headers: { Authorization: `Bearer ${token}` } }); const dados = await resposta.json(); if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar os usuários."); return dados as UsuarioDocumento[]; }
}
