/**
 * Valida se o usuário autenticado pertence ao tenant informado.
 * Implementação completa na Fase 1.
 */
export function assertTenant(
  paroquiaIdUsuario: string | undefined,
  paroquiaIdRecurso: string,
): void {
  if (!paroquiaIdUsuario || paroquiaIdUsuario !== paroquiaIdRecurso) {
    throw new Error("Acesso negado: tenant inválido.");
  }
}
