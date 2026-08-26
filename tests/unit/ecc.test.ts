import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eccCasalSchema, eccEncontroSchema, eccEquipeSchema } from "../../src/modules/ecc/schemas/ecc.schema.ts";

describe("ECC", () => {
  it("aceita uma edição com período válido", () => {
    const encontro = eccEncontroSchema.parse({
      numero: 18,
      nome: "Encontro de Casais com Cristo",
      dataInicio: "2026-10-09",
      dataFim: "2026-10-11",
    });
    assert.equal(encontro.status, "PLANEJAMENTO");
    assert.equal(encontro.capacidadeCasais, 0);
  });

  it("rejeita uma edição cujo término antecede o início", () => {
    assert.throws(() => eccEncontroSchema.parse({
      numero: 18,
      nome: "Encontro de Casais com Cristo",
      dataInicio: "2026-10-11",
      dataFim: "2026-10-09",
    }));
  });

  it("permite casal no banco sem vinculá-lo imediatamente a uma edição", () => {
    const casal = eccCasalSchema.parse({ conjugeUmNome: "Maria Silva", conjugeDoisNome: "João Silva" });
    assert.equal(casal.encontroId, "");
    assert.equal(casal.situacao, "ELEGIVEL");
  });

  it("exige edição, voluntário e equipe ao formar a equipe de trabalho", () => {
    assert.throws(() => eccEquipeSchema.parse({ encontroId: "", voluntarioId: "", equipe: "" }));
  });
});
