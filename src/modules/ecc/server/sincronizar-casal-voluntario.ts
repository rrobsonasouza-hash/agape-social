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

  const consulta = await supabase
    .from("ecc_casais")
    .select("id,conjuge_um_nome,conjuge_dois_nome,voluntario_um_id,voluntario_dois_id")
    .eq("paroquia_id", paroquiaId)
    .limit(500);
  if (consulta.error) throw consulta.error;

  const nome = normalizarNome(dados.nome);
  const conjuge = normalizarNome(dados.conjugeNome);
  const existente = (consulta.data ?? []).find((item) =>
    item.voluntario_um_id === voluntarioId ||
    item.voluntario_dois_id === voluntarioId ||
    (normalizarNome(item.conjuge_um_nome) === nome && normalizarNome(item.conjuge_dois_nome) === conjuge) ||
    (normalizarNome(item.conjuge_dois_nome) === nome && normalizarNome(item.conjuge_um_nome) === conjuge),
  );

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
