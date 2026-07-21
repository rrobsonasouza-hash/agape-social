import assert from "node:assert/strict";
import { describe,it } from "node:test";
import { montarDiagnostico } from "../../src/modules/saude/diagnostico.ts";

describe("diagnóstico de saúde",()=>{
  it("informa serviço disponível e publicação curta",()=>{assert.deepEqual(montarDiagnostico({bancoDisponivel:true,ambiente:"production",commit:"1234567890",verificadoEm:"2026-07-21T12:00:00.000Z"}),{status:"ok",servico:"agape-social",versao:"1.0.0",ambiente:"production",publicacao:"1234567",banco:"disponivel",verificadoEm:"2026-07-21T12:00:00.000Z"});});
  it("sinaliza indisponibilidade do banco",()=>{assert.equal(montarDiagnostico({bancoDisponivel:false}).status,"indisponivel");});
});
