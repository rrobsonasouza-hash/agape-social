import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calcularResumoPeriodo, calcularSaldoConta } from "../../src/modules/tesouraria/calculos.ts";

const movimentos = [
  { contaId:"caixa", tipo:"ENTRADA" as const, valor:500, data:"2026-07-02", status:"CONFIRMADA" as const },
  { contaId:"caixa", tipo:"SAIDA" as const, valor:80, data:"2026-07-03", status:"CONFIRMADA" as const },
  { contaId:"caixa", tipo:"TRANSFERENCIA_SAIDA" as const, valor:200, data:"2026-07-04", status:"CONFIRMADA" as const },
  { contaId:"banco", tipo:"TRANSFERENCIA_ENTRADA" as const, valor:200, data:"2026-07-04", status:"CONFIRMADA" as const },
  { contaId:"caixa", tipo:"SAIDA" as const, valor:900, data:"2026-07-05", status:"CANCELADA" as const },
];

describe("cálculos da Tesouraria",()=>{
  it("calcula o saldo de cada conta considerando transferências",()=>{
    assert.equal(calcularSaldoConta(100,"caixa",movimentos),320);
    assert.equal(calcularSaldoConta(50,"banco",movimentos),250);
  });

  it("ignora movimentações canceladas no saldo",()=>{
    assert.equal(calcularSaldoConta(0,"caixa",movimentos),220);
  });

  it("mantém transferências neutras no resultado financeiro",()=>{
    assert.deepEqual(calcularResumoPeriodo(movimentos,"2026-07-01","2026-07-31"),{entradas:500,saidas:80,resultado:420});
  });

  it("respeita o período informado",()=>{
    assert.deepEqual(calcularResumoPeriodo(movimentos,"2026-07-03","2026-07-03"),{entradas:0,saidas:80,resultado:-80});
  });
});
