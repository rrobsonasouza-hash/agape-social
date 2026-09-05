import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolverNomeAtualDaFamilia } from "../../src/modules/distribuicoes/nome-familia.ts";

describe("nome atual nas distribuições", () => {
  const nomesAtuais = new Map([["familia-1", "Nome corrigido"]]);

  for (const status of ["AGENDADA", "RETIRADA", "ENTREGUE_DOMICILIO", "AUSENTE"]) {
    it(`usa o nome atual quando a distribuição está ${status}`, () => {
      const nome = resolverNomeAtualDaFamilia(
        { familiaId: "familia-1", familiaNome: "Nome antigo", status },
        nomesAtuais,
      );
      assert.equal(nome, "Nome corrigido");
    });
  }

  it("preserva o nome histórico se a família não estiver mais disponível", () => {
    const nome = resolverNomeAtualDaFamilia(
      { familiaId: "familia-ausente", familiaNome: "Nome histórico" },
      nomesAtuais,
    );
    assert.equal(nome, "Nome histórico");
  });
});
