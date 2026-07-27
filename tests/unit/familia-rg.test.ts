import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { familiaSchema } from "../../src/modules/familias/schemas/familia.schema.ts";

describe("documentos da família", () => {
  it("aceita família identificada somente pelo RG", () => {
    const resultado = familiaSchema.safeParse({ nomeResponsavel: "Maria da Silva", cpf: "", rg: "12.345.678-9", telefone: "(11) 99999-9999", status: "ATIVA" });
    assert.equal(resultado.success, true);
  });

  it("exige CPF ou RG", () => {
    const resultado = familiaSchema.safeParse({ nomeResponsavel: "Maria da Silva", cpf: "", rg: "", telefone: "(11) 99999-9999", status: "ATIVA" });
    assert.equal(resultado.success, false);
  });
});
