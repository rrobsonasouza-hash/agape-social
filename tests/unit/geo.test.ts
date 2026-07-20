import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularDistanciaKm } from "../../src/lib/geo/distance.ts";
import { pontoEstaNoPoligono } from "../../src/lib/geo/point-in-polygon.ts";

describe("calcularDistanciaKm", () => {
  it("retorna zero para coordenadas idênticas", () => {
    const ponto = { latitude: -23.5505, longitude: -46.6333 };

    assert.equal(calcularDistanciaKm(ponto, ponto), 0);
  });

  it("calcula uma distância conhecida com tolerância", () => {
    const saoPaulo = { latitude: -23.5505, longitude: -46.6333 };
    const rioDeJaneiro = { latitude: -22.9068, longitude: -43.1729 };
    const distancia = calcularDistanciaKm(saoPaulo, rioDeJaneiro);

    assert.ok(distancia > 355 && distancia < 365);
  });

  it("produz o mesmo resultado nos dois sentidos", () => {
    const origem = { latitude: -23.5, longitude: -46.6 };
    const destino = { latitude: -22.9, longitude: -43.2 };

    assert.equal(
      calcularDistanciaKm(origem, destino),
      calcularDistanciaKm(destino, origem)
    );
  });
});

describe("pontoEstaNoPoligono", () => {
  const quadrado = [
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 10 },
    { latitude: 10, longitude: 10 },
    { latitude: 10, longitude: 0 },
  ];

  it("identifica um ponto dentro da área", () => {
    assert.equal(pontoEstaNoPoligono({ latitude: 5, longitude: 5 }, quadrado), true);
  });

  it("rejeita um ponto fora da área", () => {
    assert.equal(pontoEstaNoPoligono({ latitude: 12, longitude: 5 }, quadrado), false);
  });

  it("não considera uma área vazia", () => {
    assert.equal(pontoEstaNoPoligono({ latitude: 5, longitude: 5 }, []), false);
  });
});
