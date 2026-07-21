import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { podeAcessarRota, permissoesPadrao } from "../../src/config/permissions.ts";

describe("controle de acesso por perfil",()=>{
  it("reserva a Central para o administrador da plataforma",()=>{
    assert.equal(podeAcessarRota("admin_plataforma","/central"),true);
    assert.equal(podeAcessarRota("admin_plataforma","/central/paroquias"),true);
    assert.equal(podeAcessarRota("admin_paroquia","/central"),false);
    assert.equal(podeAcessarRota("admin_paroquia","/central/administradores"),false);
  });

  it("impede o administrador paroquial de gerenciar tenants",()=>{
    assert.equal(podeAcessarRota("admin_paroquia","/paroquias"),false);
    assert.equal(podeAcessarRota("admin_paroquia","/paroquias/nova"),false);
    assert.equal(podeAcessarRota("admin_paroquia","/administracao"),true);
  });

  it("limita o atendente às rotas da Secretaria",()=>{
    assert.equal(podeAcessarRota("atendente_secretaria","/secretaria"),true);
    assert.equal(podeAcessarRota("atendente_secretaria","/secretaria/dizimos"),true);
    assert.equal(podeAcessarRota("atendente_secretaria","/tesouraria"),false);
    assert.equal(podeAcessarRota("atendente_secretaria","/usuarios"),false);
  });

  it("limita o tesoureiro às rotas da Tesouraria",()=>{
    assert.equal(podeAcessarRota("tesoureiro","/tesouraria"),true);
    assert.equal(podeAcessarRota("tesoureiro","/tesouraria/relatorio"),true);
    assert.equal(podeAcessarRota("tesoureiro","/secretaria"),false);
  });

  it("respeita permissões configuráveis e suas subrotas",()=>{
    assert.equal(podeAcessarRota("operador","/familias/123",permissoesPadrao),true);
    assert.equal(podeAcessarRota("operador","/usuarios",permissoesPadrao),false);
    assert.equal(podeAcessarRota("leitor","/relatorios",permissoesPadrao),true);
    assert.equal(podeAcessarRota("leitor","/familias",permissoesPadrao),false);
  });
});
