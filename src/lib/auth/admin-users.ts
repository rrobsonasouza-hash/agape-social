import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function mapearUltimosAcessos(supabase: SupabaseClient, ids: string[]) {
  const pendentes = new Set(ids);
  const acessos = new Map<string, string | null>();
  let pagina = 1;
  const porPagina = 1000;

  while (pendentes.size > 0) {
    const { data, error } = await supabase.auth.admin.listUsers({ page: pagina, perPage: porPagina });
    if (error) throw error;
    for (const usuario of data.users) {
      if (!pendentes.has(usuario.id)) continue;
      acessos.set(usuario.id, usuario.last_sign_in_at ?? null);
      pendentes.delete(usuario.id);
    }
    if (data.users.length < porPagina) break;
    pagina += 1;
  }

  for (const id of pendentes) acessos.set(id, null);
  return acessos;
}
