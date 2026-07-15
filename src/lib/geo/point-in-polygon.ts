import { Coordenada } from "@/modules/areas-pastorais/schemas/area-pastoral.schema";

export function pontoEstaNoPoligono(
  ponto: Coordenada,
  poligono: Coordenada[]
): boolean {
  let dentro = false;

  for (let atual = 0, anterior = poligono.length - 1; atual < poligono.length; anterior = atual++) {
    const a = poligono[atual];
    const b = poligono[anterior];
    const cruza =
      a.latitude > ponto.latitude !== b.latitude > ponto.latitude &&
      ponto.longitude <
        ((b.longitude - a.longitude) * (ponto.latitude - a.latitude)) /
          (b.latitude - a.latitude) +
          a.longitude;

    if (cruza) dentro = !dentro;
  }

  return dentro;
}
