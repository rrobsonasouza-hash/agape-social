export function calcularTaxaComparecimento(
  comparecimentos: number,
  ausencias: number,
  pendenciasVencidas: number,
) {
  const previstos = comparecimentos + ausencias + pendenciasVencidas;
  return previstos > 0 ? (comparecimentos / previstos) * 100 : 0;
}
