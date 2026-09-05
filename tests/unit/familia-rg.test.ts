import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { familiaSchema } from "../../src/modules/familias/schemas/familia.schema.ts";
import {
  encontrarDuplicidadeFamilia,
  ErroDuplicidadeFamilia,
} from "../../src/modules/familias/duplicidade.ts";

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

describe("duplicidade de família", () => {
  const cadastradas = [
    {
      id: "familia-existente",
      dados: {
        nomeResponsavel: "Maria da Silva",
        cpf: "123.456.789-00",
        rg: "12.345.678-X",
        status: "INATIVA",
        beneficioBloqueado: true,
      },
    },
  ];

  it("encontra CPF mesmo com formatação diferente e independentemente do status", () => {
    const duplicidade = encontrarDuplicidadeFamilia(
      { cpf: "12345678900" },
      cadastradas,
    );
    assert.equal(duplicidade?.id, "familia-existente");
    assert.equal(duplicidade?.documento, "CPF");
    assert.equal(duplicidade?.status, "INATIVA");
  });

  it("encontra RG mesmo com formatação e caixa diferentes", () => {
    const duplicidade = encontrarDuplicidadeFamilia(
      { rg: "12345678x" },
      cadastradas,
    );
    assert.equal(duplicidade?.documento, "RG");
  });

  it("ignora o próprio cadastro durante uma edição", () => {
    const duplicidade = encontrarDuplicidadeFamilia(
      { cpf: "12345678900" },
      cadastradas,
      "familia-existente",
    );
    assert.equal(duplicidade, null);
  });

  it("explica quando o registro anterior está inativo", () => {
    const duplicidade = encontrarDuplicidadeFamilia(
      { cpf: "12345678900" },
      cadastradas,
    );
    assert.ok(duplicidade);
    assert.match(new ErroDuplicidadeFamilia(duplicidade).message, /está inativo/i);
  });
});
