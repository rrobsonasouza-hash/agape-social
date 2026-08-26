import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  eccCasalSchema, eccEncontroSchema, eccEquipeSchema, eccParticipacaoSchema,
  eccProgramacaoSchema, eccTarefaSchema,
} from "../../src/modules/ecc/schemas/ecc.schema.ts";

describe("ECC", () => {
  it("aceita uma edicao com periodo valido", () => {
    const encontro = eccEncontroSchema.parse({ numero: 18, nome: "Encontro de Casais com Cristo", dataInicio: "2026-10-09", dataFim: "2026-10-11" });
    assert.equal(encontro.status, "PLANEJAMENTO");
    assert.equal(encontro.capacidadeCasais, 0);
  });
  it("rejeita uma edicao cujo termino antecede o inicio", () => {
    assert.throws(() => eccEncontroSchema.parse({ numero: 18, nome: "Encontro de Casais com Cristo", dataInicio: "2026-10-11", dataFim: "2026-10-09" }));
  });
  it("permite casal no banco sem vinculo imediato com uma edicao", () => {
    const casal = eccCasalSchema.parse({ conjugeUmNome: "Maria Silva", conjugeDoisNome: "Joao Silva" });
    assert.equal(casal.encontroId, ""); assert.equal(casal.situacao, "ELEGIVEL");
  });
  it("exige edicao, voluntario e equipe ao formar a equipe", () => {
    assert.throws(() => eccEquipeSchema.parse({ encontroId: "", voluntarioId: "", equipe: "" }));
  });
  it("aceita endereco georreferenciado para o mapa", () => {
    const casal = eccCasalSchema.parse({ conjugeUmNome: "Maria Silva", conjugeDoisNome: "Joao Silva", cep: "02401-100", latitude: -23.48, longitude: -46.63 });
    assert.equal(casal.latitude, -23.48);
  });
  it("rejeita atividade cujo horario final antecede o inicial", () => {
    assert.throws(() => eccProgramacaoSchema.parse({ encontroId: "11111111-1111-4111-8111-111111111111", titulo: "Acolhida dos casais", data: "2026-10-09", horaInicio: "20:00", horaFim: "19:00" }));
  });
  it("inicia tarefas como pendentes e com prioridade media", () => {
    const tarefa = eccTarefaSchema.parse({ encontroId: "11111111-1111-4111-8111-111111111111", titulo: "Confirmar alimentos" });
    assert.equal(tarefa.status, "PENDENTE"); assert.equal(tarefa.prioridade, "MEDIA");
  });
  it("controla a situacao do casal por edicao", () => {
    assert.equal(eccParticipacaoSchema.parse({ situacao: "CONFIRMADO" }).situacao, "CONFIRMADO");
  });
});
