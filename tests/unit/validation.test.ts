import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { doadorSchema } from "../../src/modules/doadores/schemas/doador.schema.ts";
import { familiaSchema } from "../../src/modules/familias/schemas/familia.schema.ts";
import { parceiroSchema } from "../../src/modules/parceiros/schemas/parceiro.schema.ts";
import { visitaSchema } from "../../src/modules/visitas/schemas/visita.schema.ts";
import { voluntarioSchema } from "../../src/modules/voluntarios/schemas/voluntario.schema.ts";

describe("validação server-side dos cadastros", () => {
  it("rejeita família com CPF inválido", () => {
    const resultado = familiaSchema.safeParse({
      nomeResponsavel: "Maria da Silva",
      cpf: "123",
      telefone: "(11) 99999-9999",
      status: "ATIVA",
    });
    assert.equal(resultado.success, false);
  });

  it("rejeita voluntário sem área pastoral", () => {
    const resultado = voluntarioSchema.safeParse({
      nome: "João da Silva",
      cpf: "123.456.789-00",
      telefone: "(11) 99999-9999",
      pastoral: "",
      funcao: "Voluntário",
      disponibilidade: { segunda: false, terca: false, quarta: false, quinta: false, sexta: false, sabado: true, domingo: false },
      status: "ATIVO",
    });
    assert.equal(resultado.success, false);
  });

  it("rejeita doador sem documento", () => {
    assert.equal(doadorSchema.safeParse({ nome: "Empresa Solidária", tipoPessoa: "JURIDICA", documento: "", telefone: "11999999999", interesseDoacao: "Alimentos", frequencia: "MENSAL", status: "ATIVO" }).success, false);
  });

  it("rejeita parceiro com CNPJ incompleto", () => {
    assert.equal(parceiroSchema.safeParse({ razaoSocial: "Parceiro Social", cnpj: "123", responsavel: "José Souza", telefone: "11999999999", tipoParceria: "Doação", contrapartida: "Alimentos", status: "ATIVO" }).success, false);
  });

  it("rejeita visita sem família", () => {
    assert.equal(visitaSchema.safeParse({ familiaId: "", familiaNome: "", data: "2026-07-20", horario: "14:00", objetivo: "Acompanhamento" }).success, false);
  });
});
