import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { maskCEP, maskCNPJ, maskCPF, maskTelefone } from "../../src/lib/formatters/masks.ts";

describe("máscaras brasileiras", () => {
  it("formata CPF e remove caracteres não numéricos", () => {
    assert.equal(maskCPF("123abc45678909"), "123.456.789-09");
  });

  it("limita o CPF à quantidade correta de dígitos", () => {
    assert.equal(maskCPF("123456789091234"), "123.456.789-09");
  });

  it("formata telefone celular", () => {
    assert.equal(maskTelefone("11987654321"), "(11) 98765-4321");
  });

  it("ignora dígitos excedentes do telefone", () => {
    assert.equal(maskTelefone("11987654321999"), "(11) 98765-4321");
  });

  it("formata CEP", () => {
    assert.equal(maskCEP("01310930"), "01310-930");
  });

  it("formata CNPJ", () => {
    assert.equal(maskCNPJ("11222333000181"), "11.222.333/0001-81");
  });
});
