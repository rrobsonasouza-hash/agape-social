import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  eccCasalSchema, eccEncontroSchema, eccEquipeSchema, eccEquipePresencaSchema, eccParticipacaoSchema,
  eccProgramacaoSchema, eccTarefaSchema,
  eccNovoVoluntarioSchema,
  eccVisitaSchema,
  eccComunicacaoSchema,
  eccDocumentoSchema,
  eccCredenciamentoSchema,
  eccPresencaDiaSchema,
  eccArrecadacaoSchema,
  eccDespesaSchema,
  eccPosEncontroSchema,
} from "../../src/modules/ecc/schemas/ecc.schema.ts";
import { assinarConfirmacao, assinarEncontro, validarConfirmacao, validarEncontroAssinado } from "../../src/modules/ecc/server/checkin-token.ts";

describe("ECC", () => {
  it("assina o QR e limita a confirmacao ao casal e contato corretos", () => {
    process.env.ECC_CHECKIN_SECRET = "segredo-de-teste-com-tamanho-suficiente";
    const encontroId = "11111111-1111-4111-8111-111111111111";
    const casalId = "22222222-2222-4222-8222-222222222222";
    const qr = assinarEncontro(encontroId);
    assert.equal(validarEncontroAssinado(encontroId, qr), true);
    assert.equal(validarEncontroAssinado("33333333-3333-4333-8333-333333333333", qr), false);
    const confirmacao = assinarConfirmacao(encontroId, casalId, "11999999999", Date.now() + 60_000);
    assert.equal(validarConfirmacao(encontroId, casalId, "11999999999", confirmacao), true);
    assert.equal(validarConfirmacao(encontroId, casalId, "11888888888", confirmacao), false);
  });
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
    assert.equal(casal.classificacaoEncontro, "INDICADO");
  });
  it("reserva equipe e coordenacao para o fluxo de voluntarios", () => {
    const base = { conjugeUmNome: "Maria Silva", conjugeDoisNome: "Joao Silva", encontroId: "11111111-1111-4111-8111-111111111111" };
    assert.equal(eccCasalSchema.parse({ ...base, classificacaoEncontro: "ENCONTRISTA" }).classificacaoEncontro, "ENCONTRISTA");
    assert.throws(() => eccCasalSchema.parse({ ...base, classificacaoEncontro: "COORDENADOR" }));
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
  it("exige dados pastorais e CPF ao transformar conjuge em voluntario", () => {
    const entrada = eccNovoVoluntarioSchema.parse({ casalId: "11111111-1111-4111-8111-111111111111", posicao: "DOIS", cpf: "123.456.789-00", telefone: "11999999999", pastoral: "ECC", funcao: "Acolhida" });
    assert.equal(entrada.posicao, "DOIS");
    assert.throws(() => eccNovoVoluntarioSchema.parse({ ...entrada, cpf: "123" }));
  });
  it("agenda visita e protege o questionario realizado com consentimento", () => {
    const base = { encontroId: "11111111-1111-4111-8111-111111111111", casalId: "22222222-2222-4222-8222-222222222222", visitadorVoluntarioId: "voluntario-1", dataAgendada: "2026-09-10", questionario: {} };
    assert.equal(eccVisitaSchema.parse(base).status, "AGENDADA");
    assert.throws(() => eccVisitaSchema.parse({ ...base, status: "REALIZADA", dataRealizada: "2026-09-10" }));
    const realizada = eccVisitaSchema.parse({ ...base, status: "REALIZADA", dataRealizada: "2026-09-10", questionario: { consentimentoInformacoes: true } });
    assert.equal(realizada.questionario.consentimentoInformacoes, true);
  });
  it("exige data para retorno pastoral", () => {
    const base = { encontroId: "11111111-1111-4111-8111-111111111111", casalId: "22222222-2222-4222-8222-222222222222", visitadorVoluntarioId: "voluntario-1", dataAgendada: "2026-09-10", dataRealizada: "2026-09-10", status: "RETORNO_NECESSARIO", questionario: { consentimentoInformacoes: true } };
    assert.throws(() => eccVisitaSchema.parse(base));
    assert.equal(eccVisitaSchema.parse({ ...base, retornoData: "2026-09-17" }).retornoData, "2026-09-17");
  });
  it("registra comunicacao segmentada da edicao", () => {
    const comunicacao = eccComunicacaoSchema.parse({ encontroId: "11111111-1111-4111-8111-111111111111", titulo: "Confirmação do encontro", mensagem: "Pedimos que confirmem a participação.", canal: "WHATSAPP", publico: "PARTICIPANTES" });
    assert.equal(comunicacao.status, "RASCUNHO");
    assert.equal(comunicacao.publico, "PARTICIPANTES");
  });
  it("valida link opcional do documento da edicao", () => {
    const documento = eccDocumentoSchema.parse({ encontroId: "11111111-1111-4111-8111-111111111111", titulo: "Roteiro geral", categoria: "ROTEIRO", url: "https://example.com/roteiro.pdf" });
    assert.equal(documento.status, "PENDENTE");
    assert.throws(() => eccDocumentoSchema.parse({ ...documento, url: "arquivo-invalido" }));
  });
  it("registra credenciamento e entrega de materiais por casal", () => {
    const registro = eccCredenciamentoSchema.parse({ encontroId: "11111111-1111-4111-8111-111111111111", casalId: "22222222-2222-4222-8222-222222222222", crachaEntregue: true, materialEntregue: true, circulo: "Amarelo" });
    assert.equal(registro.status, "CREDENCIADO");
    assert.equal(registro.crachaEntregue, true);
    assert.equal(registro.circulo, "Amarelo");
  });

  it("valida horario da escala e presenca da equipe", () => {
    const base = { encontroId: "11111111-1111-4111-8111-111111111111", voluntarioId: "voluntario-1", equipe: "Cozinha", funcao: "Apoio" };
    assert.throws(() => eccEquipeSchema.parse({ ...base, dataEscala: "2026-10-10", horaInicio: "18:00", horaFim: "08:00" }));
    const presenca = eccEquipePresencaSchema.parse({ encontroId: base.encontroId, equipeId: "22222222-2222-4222-8222-222222222222", data: "2026-10-10", presente: true });
    assert.equal(presenca.presente, true);
  });

  it("rejeita prazo de inscricao posterior ao inicio do encontro", () => {
    assert.throws(() => eccEncontroSchema.parse({ numero: 19, nome: "Encontro de Casais com Cristo", dataInicio: "2026-10-09", dataFim: "2026-10-11", prazoInscricao: "2026-10-10" }));
  });
  it("valida telefone do casal com DDD e tamanho brasileiro", () => {
    const casal = { conjugeUmNome: "Maria Silva", conjugeDoisNome: "Joao Silva" };
    assert.equal(eccCasalSchema.parse({ ...casal, telefone: "(11) 99999-9999" }).telefone, "(11) 99999-9999");
    assert.throws(() => eccCasalSchema.parse({ ...casal, telefone: "119547788888888888" }));
  });
  it("registra a presença do casal em um dia do encontro", () => {
    const presenca = eccPresencaDiaSchema.parse({ encontroId: "11111111-1111-4111-8111-111111111111", casalId: "22222222-2222-4222-8222-222222222222", data: "2026-10-10", presente: true });
    assert.equal(presenca.presente, true);
  });
  it("registra alimento com quantidade prometida", () => {
    const registro = eccArrecadacaoSchema.parse({ encontroId: "11111111-1111-4111-8111-111111111111", categoria: "ALIMENTO", item: "Arroz", quantidadePrometida: 30, unidade: "kg" });
    assert.equal(registro.quantidadePrometida, 30);
    assert.equal(registro.status, "PENDENTE");
  });
  it("exige valor prometido nas arrecadacoes em dinheiro", () => {
    assert.throws(() => eccArrecadacaoSchema.parse({ encontroId: "11111111-1111-4111-8111-111111111111", categoria: "VALOR", item: "Compras da cozinha" }));
  });
  it("aceita valor prometido e recebido", () => {
    const registro = eccArrecadacaoSchema.parse({ encontroId: "11111111-1111-4111-8111-111111111111", categoria: "VALOR", item: "Bebidas", valorPrometido: 500, valorRecebido: 250 });
    assert.equal(registro.valorRecebido, 250);
  });
  it("registra despesa financeira da edicao", () => {
    const despesa = eccDespesaSchema.parse({ encontroId: "11111111-1111-4111-8111-111111111111", descricao: "Compra de alimentos", valor: 350, data: "2026-10-09", status: "PAGA" });
    assert.equal(despesa.status, "PAGA");
    assert.equal(despesa.valor, 350);
  });
  it("registra o retorno e o interesse do casal no pos-encontro", () => {
    const retorno = eccPosEncontroSchema.parse({
      encontroId: "11111111-1111-4111-8111-111111111111",
      casalId: "22222222-2222-4222-8222-222222222222",
      avaliacao: 5, testemunho: "O encontro fortaleceu nossa caminhada.",
      interesseTrabalhar: true, areasInteresse: ["Acolhida", "Secretaria"],
    });
    assert.equal(retorno.avaliacao, 5);
    assert.deepEqual(retorno.areasInteresse, ["Acolhida", "Secretaria"]);
    assert.throws(() => eccPosEncontroSchema.parse({ ...retorno, acompanhamentoNecessario: true, acompanhamentoObservacoes: "" }));
  });
});
