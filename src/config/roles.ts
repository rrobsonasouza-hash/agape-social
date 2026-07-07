export const roles = {
  adminPlataforma: "admin_plataforma",
  adminParoquia: "admin_paroquia",
  coordenador: "coordenador",
  operador: "operador",
  voluntario: "voluntario",
  leitor: "leitor",
} as const;

export type Role = (typeof roles)[keyof typeof roles];

export const roleLabels: Record<Role, string> = {
  admin_plataforma: "Admin da plataforma",
  admin_paroquia: "Admin da paróquia",
  coordenador: "Coordenador",
  operador: "Operador",
  voluntario: "Voluntário",
  leitor: "Leitor",
};
