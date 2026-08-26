import { obterTokenAcesso } from "@/lib/auth/client-session";
import type { EccCasalFormData, EccEncontroFormData, EccEquipeFormData } from "../schemas/ecc.schema";
import type { EccPainel } from "../types/ecc.types";

async function requisicao<T>(init?: RequestInit): Promise<T> {
  const token = await obterTokenAcesso();
  if (!token) throw new Error("Sessão expirada.");
  const resposta = await fetch("/api/ecc", { ...init, headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}`, ...init?.headers } });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação do ECC.");
  return dados as T;
}

export class EccRepository {
  listar() { return requisicao<EccPainel>(); }
  criarEncontro(dados:EccEncontroFormData) { return requisicao<{id:string}>({ method:"POST", body:JSON.stringify({ tipo:"encontro", dados }) }); }
  criarCasal(dados:EccCasalFormData) { return requisicao<{id:string}>({ method:"POST", body:JSON.stringify({ tipo:"casal", dados }) }); }
  adicionarEquipe(dados:EccEquipeFormData) { return requisicao<{id:string}>({ method:"POST", body:JSON.stringify({ tipo:"equipe", dados }) }); }
}
