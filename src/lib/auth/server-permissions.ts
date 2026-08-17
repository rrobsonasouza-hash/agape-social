import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { permissoesPadrao, type PerfilConfiguravel, type PermissoesPorPerfil } from "@/config/permissions";

const perfisConfiguraveis = new Set<PerfilConfiguravel>(["coordenador", "operador", "voluntario", "leitor"]);

export async function exigirPermissaoServidor(
  supabase: SupabaseClient,
  paroquiaId: string,
  role: string,
  rota: string,
  perfisPermitidos: string[],
) {
  if (!perfisPermitidos.includes(role)) throw new Error("FORBIDDEN");
  if (!perfisConfiguraveis.has(role as PerfilConfiguravel)) return;

  const { data, error } = await supabase
    .from("configuracoes")
    .select("dados")
    .eq("id", `permissoes:${paroquiaId}`)
    .eq("paroquia_id", paroquiaId)
    .maybeSingle();
  if (error) throw error;

  const personalizadas = (data?.dados as { perfis?: PermissoesPorPerfil } | undefined)?.perfis;
  const permitidas = personalizadas?.[role as PerfilConfiguravel] ?? permissoesPadrao[role as PerfilConfiguravel];
  if (!permitidas.some((permitida) => rota === permitida || rota.startsWith(`${permitida}/`))) throw new Error("FORBIDDEN");
}
