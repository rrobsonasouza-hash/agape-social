import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolverNomeAtualDaFamilia } from "../../src/modules/distribuicoes/nome-familia.ts";
import { calcularTaxaComparecimento } from "../../src/modules/relatorios/calculos.ts";

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

describe("taxa de comparecimento", () => {
  it("inclui agendamentos vencidos sem baixa no total previsto", () => {
    assert.equal(calcularTaxaComparecimento(81, 0, 18).toFixed(1), "81.8");
  });

  it("inclui ausências registradas e evita divisão por zero", () => {
    assert.equal(calcularTaxaComparecimento(8, 2, 0), 80);
    assert.equal(calcularTaxaComparecimento(0, 0, 0), 0);
  });
});
