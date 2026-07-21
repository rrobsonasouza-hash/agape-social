import { createHash } from "node:crypto";

export function resumirColecoes(dados: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(dados).map(([colecao, registros]) => [colecao, Array.isArray(registros) ? registros.length : 0]));
}

export function totalizarResumo(resumo: Record<string, number>) {
  return Object.values(resumo).reduce((total, quantidade) => total + quantidade, 0);
}

export function calcularSha256(dados: unknown) {
  return createHash("sha256").update(JSON.stringify(dados)).digest("hex");
}
