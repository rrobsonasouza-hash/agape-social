import type { Role } from "@/config/roles";

/**
 * Verificação de permissões (RBAC).
 * Implementação na Fase 1.
 */
export function possuiPapel(
  papelUsuario: Role | undefined,
  papeisPermitidos: Role[],
): boolean {
  if (!papelUsuario) {
    return false;
  }

  return papeisPermitidos.includes(papelUsuario);
}
