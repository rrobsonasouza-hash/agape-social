import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

export async function resolverParoquia(paroquiaReferencia: string) {
  const supabase = supabaseAdmin();
  const campos = "id,nome,slug,ativa,endereco,latitude,longitude,raio_atuacao_km";
  const consulta = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(paroquiaReferencia)
    ? supabase.from("paroquias").select(campos).eq("id", paroquiaReferencia)
    : supabase.from("paroquias").select(campos).eq("slug", paroquiaReferencia === "principal" ? "paroquia-nossa-senhora-aparecida" : paroquiaReferencia);
  const { data, error } = await consulta.single();
  if (error || !data || !data.ativa) throw error ?? new Error("Paróquia não encontrada ou inativa.");
  return { supabase, paroquia: data, paroquiaId: data.id as string };
}

export async function resolverParoquiaDaRequisicao(request: NextRequest, usuario: { role: string; paroquiaId: string }) {
  const selecionada = usuario.role === "admin_plataforma" ? request.cookies.get("agape_paroquia")?.value : undefined;
  if (usuario.role === "admin_plataforma" && !selecionada) throw new Error("PARISH_REQUIRED");
  return resolverParoquia(selecionada || usuario.paroquiaId);
}
