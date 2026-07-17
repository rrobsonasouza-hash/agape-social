import { Role } from "@/config/roles";

export type PerfilConfiguravel = "coordenador" | "operador" | "voluntario" | "leitor";
export type PermissoesPorPerfil = Record<PerfilConfiguravel, string[]>;

export const modulosConfiguraveis = [
  { rota: "/dashboard", nome: "Dashboard" }, { rota: "/familias", nome: "Famílias" },
  { rota: "/voluntarios", nome: "Voluntários" }, { rota: "/doadores", nome: "Doadores" },
  { rota: "/estoque", nome: "Estoque" }, { rota: "/cestas", nome: "Cestas e distribuições" },
  { rota: "/visitas", nome: "Visitas" }, { rota: "/parceiros", nome: "Parceiros" },
  { rota: "/areas-pastorais", nome: "Áreas pastorais" }, { rota: "/rotas", nome: "Rotas" },
  { rota: "/relatorios", nome: "Relatórios" },
] as const;

export const permissoesPadrao: PermissoesPorPerfil = {
  coordenador: ["/dashboard", "/familias", "/voluntarios", "/doadores", "/estoque", "/cestas", "/visitas", "/parceiros", "/areas-pastorais", "/rotas", "/relatorios"],
  operador: ["/dashboard", "/familias", "/doadores", "/estoque", "/cestas", "/visitas", "/rotas"],
  voluntario: ["/dashboard", "/cestas", "/visitas", "/rotas"],
  leitor: ["/dashboard", "/relatorios"],
};

export function podeAcessarRota(role: Role, rota: string, personalizadas: PermissoesPorPerfil = permissoesPadrao) {
  if (role === "admin_plataforma") return true;
  if (role === "admin_paroquia") return !rota.startsWith("/paroquias");
  const permitidas = personalizadas[role];
  return permitidas.some((permitida) => rota === permitida || rota.startsWith(`${permitida}/`));
}
