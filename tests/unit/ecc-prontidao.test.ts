import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calcularProntidaoEcc } from "../../src/modules/ecc/lib/prontidao.ts";
import type { EccPainel } from "../../src/modules/ecc/types/ecc.types.ts";

function painelBase(): EccPainel {
  return {
    encontros: [{ id: "encontro", numero: 1, nome: "ECC", tema: "", lema: "", dataInicio: "2026-09-05", dataFim: "2026-09-06", prazoInscricao: "", local: "", capacidadeCasais: 20, status: "PREPARACAO", observacoes: "" }],
    casais: [], participacoes: [], equipe: [], equipePresencas: [], programacao: [], tarefas: [], visitas: [], comunicacoes: [], documentos: [], credenciamentos: [], presencasDiarias: [], arrecadacoes: [], necessidades: [], despesas: [], posEncontro: [], voluntarios: [], casaisDoadores: [],
    paroquia: { nome: "Paróquia", latitude: null, longitude: null }, podeGerenciarVisitas: true, podeGerenciarPosEncontro: true,
  };
}

describe("Prontidão do ECC", () => {
  it("classifica como crítico quando o encontro está próximo e faltam equipes", () => {
    const resultado = calcularProntidaoEcc(painelBase(), "encontro", new Date("2026-09-01T12:00:00"));
    assert.equal(resultado.nivel, "CRITICO");
    assert.equal(resultado.itens.find((item) => item.id === "equipes")?.nivel, "CRITICO");
  });

  it("fica pronto quando equipes, visitas, arrecadações, tarefas e círculos estão resolvidos", () => {
    const dados = painelBase();
    dados.participacoes.push({ id: "participacao", encontroId: "encontro", casalId: "casal", casalNome: "José e Maria", situacao: "CONFIRMADO", classificacao: "ENCONTRISTA", inscritoEm: "", conviteEnviadoEm: "", respostaEm: "", confirmadoEm: "", observacoes: "" });
    dados.equipe.push({ id: "equipe", encontroId: "encontro", voluntarioId: "voluntario", voluntarioNome: "João", equipe: "Secretaria", funcao: "Coordenador", coordenador: true, status: "CONFIRMADO", dataEscala: "2026-09-05", horaInicio: "08:00", horaFim: "18:00", observacoes: "" });
    dados.visitas.push({ id: "visita", encontroId: "encontro", casalId: "casal", casalNome: "José e Maria", visitadorVoluntarioId: "voluntario", visitadorNome: "João", dataAgendada: "2026-08-20", horaAgendada: "", dataRealizada: "2026-08-20", retornoData: "", status: "REALIZADA", questionario: { motivoParticipacao: "", expectativas: "", participacaoParoquial: "", filhosCuidados: "", restricoesAlimentares: "", necessidadesAcessibilidade: "", contatoEmergencia: "", observacoesPastorais: "", consentimentoInformacoes: true }, observacoes: "" });
    dados.necessidades.push({ id: "necessidade", encontroId: "encontro", categoria: "ALIMENTO", item: "Arroz", unidade: "kg", quantidadeNecessaria: 20, valorNecessario: 0, observacoes: "", ativa: true, criadoEm: "" });
    dados.arrecadacoes.push({ id: "doacao", encontroId: "encontro", categoria: "ALIMENTO", item: "Arroz", responsavel: "Casal", telefone: "", unidade: "kg", quantidadePrometida: 20, quantidadeRecebida: 20, valorPrometido: 0, valorRecebido: 0, status: "RECEBIDO", observacoes: "", criadoEm: "" });
    dados.credenciamentos.push({ id: "credenciamento", encontroId: "encontro", casalId: "casal", casalNome: "José e Maria", status: "AGUARDANDO", credenciadoEm: "", crachaEntregue: false, materialEntregue: false, restricoesAlimentares: "", medicamentos: "", contatoEmergencia: "", circulo: "Azul", observacoes: "" });
    const resultado = calcularProntidaoEcc(dados, "encontro", new Date("2026-09-01T12:00:00"));
    assert.equal(resultado.nivel, "PRONTO");
    assert.equal(resultado.percentual, 100);
  });
});
