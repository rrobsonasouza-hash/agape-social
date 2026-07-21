import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calcularSha256, resumirColecoes, totalizarResumo } from "../../src/modules/backup/integridade.ts";

describe("integridade do backup",()=>{
  it("conta os registros de cada coleção",()=>{
    const resumo=resumirColecoes({familias:[{id:1},{id:2}],dizimos:[{id:3}],configuracao:{ativa:true}});
    assert.deepEqual(resumo,{familias:2,dizimos:1,configuracao:0});
    assert.equal(totalizarResumo(resumo),3);
  });

  it("gera o mesmo hash para o mesmo conteúdo",()=>{
    const dados={familias:[{id:"abc",nome:"Família"}]};
    assert.equal(calcularSha256(dados),calcularSha256(dados));
    assert.equal(calcularSha256(dados).length,64);
  });

  it("detecta alteração no conteúdo",()=>{
    assert.notEqual(calcularSha256({valor:100}),calcularSha256({valor:101}));
  });
});
