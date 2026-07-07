import type { Role } from "@/config/roles";

export type NavigationItem = {
  titulo: string;
  href: string;
  roles?: Role[];
};

/**
 * Itens do menu lateral. Rotas serão ativadas conforme cada módulo for implementado.
 */
export const navigationItems: NavigationItem[] = [
  { titulo: "Painel", href: "/dashboard" },
  { titulo: "Famílias", href: "/familias" },
  { titulo: "Voluntários", href: "/voluntarios" },
  { titulo: "Doadores", href: "/doadores" },
  { titulo: "Estoque", href: "/estoque" },
  { titulo: "Cestas", href: "/cestas" },
  { titulo: "Visitas", href: "/visitas" },
  { titulo: "Relatórios", href: "/relatorios" },
  { titulo: "Usuários", href: "/usuarios" },
];
