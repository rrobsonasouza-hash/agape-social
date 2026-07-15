import { auth } from "@/lib/firebase/auth";
import { enviarRecuperacaoSenha } from "@/lib/firebase/auth";
import { usuarioSchema } from "../schemas/usuario.schema";
import { UsuarioRepository } from "../repositories/usuario.repository";
import { UsuarioFormData } from "../types/usuario-documento";

async function requisicaoAdministrativa(url: string, method: string, body: unknown) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const resposta = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.erro || "Não foi possível concluir a operação.");
  return resultado as { id: string };
}

export class UsuarioService {
  private repository = new UsuarioRepository();
  listar() { return this.repository.listar(); }
  async criar(data: UsuarioFormData) { const validado = usuarioSchema.parse(data); const resultado = await requisicaoAdministrativa("/api/usuarios", "POST", validado); await enviarRecuperacaoSenha(validado.email); return resultado; }
  async atualizar(id: string, data: UsuarioFormData) { return requisicaoAdministrativa(`/api/usuarios/${id}`, "PUT", usuarioSchema.parse(data)); }
  alterarStatus(id: string, status: "PENDENTE" | "ATIVO" | "INATIVO") { return requisicaoAdministrativa(`/api/usuarios/${id}`, "PATCH", { status }); }
}
