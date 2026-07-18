import { supabase } from "@/lib/supabase/client";
import { IdentidadeSessao } from "@/lib/auth/client-session";
import { UsuarioDocumento } from "@/modules/usuarios/types/usuario-documento";

export class AcessoRepository {
  async carregarPerfilSessao(identidade: IdentidadeSessao): Promise<UsuarioDocumento> {
    const { data, error } = await supabase.from("perfis").select("id,nome,email,telefone,perfil,status,observacoes,paroquia_id").eq("id", identidade.uid).maybeSingle();
    if (error || !data) throw new Error("Seu e-mail ainda não possui um perfil autorizado no Ágape.");
    if (data.status !== "ATIVO") throw new Error("Seu acesso está desativado. Procure o administrador responsável.");
    return { id: data.id, nome: data.nome, email: data.email, telefone: data.telefone || "", role: data.perfil, paroquiaId: data.paroquia_id || "principal", paroquiaNome: "", status: data.status, observacoes: data.observacoes || "" } as UsuarioDocumento;
  }
}
