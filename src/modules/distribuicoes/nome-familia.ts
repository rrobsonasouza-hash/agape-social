export function resolverNomeAtualDaFamilia(
  dados: Record<string, unknown>,
  nomesAtuais: ReadonlyMap<string, string>,
) {
  const familiaId = typeof dados.familiaId === "string" ? dados.familiaId : "";
  const nomeAtual = nomesAtuais.get(familiaId)?.trim();
  return nomeAtual || String(dados.familiaNome ?? "");
}
