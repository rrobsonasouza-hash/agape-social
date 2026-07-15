import { Role } from "@/config/roles";
const rotasPorPerfil: Record<Role, string[]> = {
  admin_plataforma: ["*"], admin_paroquia: ["*"],
  coordenador: ["/dashboard", "/familias", "/voluntarios", "/doadores", "/estoque", "/cestas", "/visitas", "/parceiros", "/areas-pastorais", "/rotas", "/relatorios"],
  operador: ["/dashboard", "/familias", "/doadores", "/estoque", "/cestas", "/visitas", "/rotas"],
  voluntario: ["/dashboard", "/cestas/distribuicao", "/visitas", "/rotas"], leitor: ["/dashboard", "/relatorios"],
};
export function podeAcessarRota(role: Role, rota: string) { const permitidas = rotasPorPerfil[role]; return permitidas.includes("*") || permitidas.some((permitida) => rota === permitida || rota.startsWith(`${permitida}/`)); }
