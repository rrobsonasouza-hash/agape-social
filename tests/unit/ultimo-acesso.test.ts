import assert from "node:assert/strict";
import test from "node:test";

import { formatarUltimoAcesso } from "../../src/lib/formatters/ultimo-acesso.ts";

test("informa quando o usuário nunca acessou", () => {
  assert.equal(formatarUltimoAcesso(null), "Nunca acessou");
});

test("formata o último acesso no horário de São Paulo", () => {
  const resultado = formatarUltimoAcesso("2026-09-14T15:30:00.000Z");

  assert.match(resultado, /14\/09\/2026/);
  assert.match(resultado, /12:30/);
});

test("trata uma data inválida", () => {
  assert.equal(formatarUltimoAcesso("data-invalida"), "Não disponível");
});
