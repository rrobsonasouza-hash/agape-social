import type { SupabaseClient } from "@supabase/supabase-js";
import type { VoluntarioFormData } from "@/modules/voluntarios/schemas/voluntario.schema";

function normalizarNome(valor: string) {
  return valor.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
}

export function voluntarioAtuaNoEcc(dados: Record<string, unknown>) {
  return dados.atuaEcc === true || /(^|\W)ECC(\W|$)/i.test(String(dados.pastoral ?? ""));
}

export async function sincronizarCasalDoVoluntario(
  supabase: SupabaseClient,
  paroquiaId: string,
  voluntarioId: string,
  dados: VoluntarioFormData,
) {
  if (!dados.atuaEcc || dados.status !== "ATIVO" || !dados.conjugeNome?.trim()) return null;

  const rpc = await supabase.rpc("sincronizar_casal_voluntario_ecc", {
    p_paroquia_id: paroquiaId,
    p_voluntario_id: voluntarioId,
    p_dados: dados,
  });
  if (!rpc.error) return (rpc.data as string | null) ?? null;
  const funcaoAindaNaoDisponivel = rpc.error.code === "PGRST202" || /sincronizar_casal_voluntario_ecc|schema cache|function/i.test(rpc.error.message);
  if (!funcaoAindaNaoDisponivel) throw rpc.error;

  const porVinculo = await supabase
    .from("ecc_casais")
    .select("id,conjuge_um_nome,conjuge_dois_nome,voluntario_um_id,voluntario_dois_id")
    .eq("paroquia_id", paroquiaId)
    .or(`voluntario_um_id.eq.${voluntarioId},voluntario_dois_id.eq.${voluntarioId}`)
    .limit(1)
    .maybeSingle();
  if (porVinculo.error) throw porVinculo.error;

  const nome = normalizarNome(dados.nome);
  let existente = porVinculo.data;
  if (!existente) {
    const [ordemDireta, ordemInversa] = await Promise.all([
      supabase.from("ecc_casais").select("id,conjuge_um_nome,conjuge_dois_nome,voluntario_um_id,voluntario_dois_id").eq("paroquia_id", paroquiaId).eq("conjuge_um_nome", dados.nome.trim()).eq("conjuge_dois_nome", dados.conjugeNome.trim()).limit(1).maybeSingle(),
      supabase.from("ecc_casais").select("id,conjuge_um_nome,conjuge_dois_nome,voluntario_um_id,voluntario_dois_id").eq("paroquia_id", paroquiaId).eq("conjuge_um_nome", dados.conjugeNome.trim()).eq("conjuge_dois_nome", dados.nome.trim()).limit(1).maybeSingle(),
    ]);
    if (ordemDireta.error) throw ordemDireta.error;
    if (ordemInversa.error) throw ordemInversa.error;
    existente = ordemDireta.data ?? ordemInversa.data;
  }

  const endereco = {
    telefone: dados.telefone,
    email: dados.email || "",
    cep: dados.cep || "",
    logradouro: dados.logradouro || "",
    numero: dados.numero || "",
    complemento: dados.complemento || "",
    bairro: dados.bairro || "",
    cidade: dados.cidade || "",
    estado: (dados.estado || "").toUpperCase(),
    latitude: dados.latitude ?? null,
    longitude: dados.longitude ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existente) {
    const voluntarioNaSegundaPosicao = existente.voluntario_dois_id === voluntarioId || normalizarNome(existente.conjuge_dois_nome) === nome;
    const alteracoes = voluntarioNaSegundaPosicao
      ? { ...endereco, conjuge_dois_nome: dados.nome, conjuge_um_nome: dados.conjugeNome, voluntario_dois_id: voluntarioId }
      : { ...endereco, conjuge_um_nome: dados.nome, conjuge_dois_nome: dados.conjugeNome, voluntario_um_id: voluntarioId };
    const atualizacao = await supabase.from("ecc_casais").update(alteracoes).eq("id", existente.id).eq("paroquia_id", paroquiaId);
    if (atualizacao.error) throw atualizacao.error;
    return existente.id;
  }

  const criacao = await supabase.from("ecc_casais").insert({
    paroquia_id: paroquiaId,
    conjuge_um_nome: dados.nome,
    conjuge_dois_nome: dados.conjugeNome,
    voluntario_um_id: voluntarioId,
    situacao: "ELEGIVEL",
    observacoes: "Casal criado automaticamente a partir do cadastro de voluntário do ECC.",
    ...endereco,
  }).select("id").single();
  if (criacao.error) throw criacao.error;
  return criacao.data.id as string;
}
