import type { Role } from "./roles.ts";

export type PerfilConfiguravel = "coordenador" | "operador" | "voluntario" | "leitor";
export type PermissoesPorPerfil = Record<PerfilConfiguravel, string[]>;

export const modulosConfiguraveis = [
  { rota: "/dashboard", nome: "Dashboard" }, { rota: "/familias", nome: "Famílias" },
  { rota: "/voluntarios", nome: "Voluntários" }, { rota: "/doadores", nome: "Doadores" },
  { rota: "/estoque", nome: "Estoque" }, { rota: "/cestas", nome: "Cestas e distribuições" },
  { rota: "/visitas", nome: "Visitas" }, { rota: "/parceiros", nome: "Parceiros" },
  { rota: "/areas-pastorais", nome: "Áreas pastorais" }, { rota: "/rotas", nome: "Rotas" },
  { rota: "/ecc", nome: "ECC — Encontro de Casais" }, { rota: "/relatorios", nome: "Relatórios" },
] as const;

export const permissoesPadrao: PermissoesPorPerfil = {
  coordenador: ["/dashboard", "/familias", "/voluntarios", "/doadores", "/estoque", "/cestas", "/visitas", "/parceiros", "/areas-pastorais", "/rotas", "/ecc", "/relatorios"],
  operador: ["/dashboard", "/familias", "/doadores", "/estoque", "/cestas", "/visitas", "/rotas", "/ecc"],
  voluntario: ["/dashboard", "/cestas", "/visitas", "/rotas", "/ecc"],
  leitor: ["/dashboard", "/ecc", "/relatorios"],
};

function rotaNaArea(rota: string, area: string) { return rota === area || rota.startsWith(`${area}/`); }

export function podeAcessarRota(role: Role, rota: string, personalizadas: PermissoesPorPerfil = permissoesPadrao) {
  if (rotaNaArea(rota, "/manual")) return true;
  if (role === "atendente_secretaria") return rotaNaArea(rota, "/secretaria");
  if (role === "tesoureiro") return rotaNaArea(rota, "/tesouraria");
  if (role === "admin_plataforma") return true;
  if (role === "admin_paroquia") return !rotaNaArea(rota, "/paroquias") && !rotaNaArea(rota, "/central");
  const permitidas = personalizadas[role];
  return permitidas.some((permitida) => rota === permitida || rota.startsWith(`${permitida}/`));
}
