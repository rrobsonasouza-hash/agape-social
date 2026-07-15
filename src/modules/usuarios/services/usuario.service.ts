import { usuarioSchema } from "../schemas/usuario.schema";
import { UsuarioRepository } from "../repositories/usuario.repository";
import { UsuarioFormData } from "../types/usuario-documento";
export class UsuarioService { private repository = new UsuarioRepository(); listar() { return this.repository.listar(); }
  async criar(data: UsuarioFormData) { const validado = usuarioSchema.parse(data); if (await this.repository.buscarPorEmail(validado.email)) throw new Error("Já existe um perfil com este e-mail."); return this.repository.criar(validado); }
  async atualizar(id: string, data: UsuarioFormData) { const validado = usuarioSchema.parse(data); const existente = await this.repository.buscarPorEmail(validado.email); if (existente && existente.id !== id) throw new Error("Já existe um perfil com este e-mail."); return this.repository.atualizar(id, validado); }
  alterarStatus(id: string, status: "PENDENTE" | "ATIVO" | "INATIVO") { return this.repository.alterarStatus(id, status); }
}
