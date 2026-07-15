import { calcularDistanciaKm } from "@/lib/geo/distance";
import { FamiliaDocumento } from "@/modules/familias/types/familia-documento";
import { VisitaDocumento } from "@/modules/visitas/types/visita-documento";
import { PontoRota, RotaPlanejada } from "../types/rota-planejada";

export class PlanejadorRotaService {
  planejar(
    visitas: VisitaDocumento[],
    familias: FamiliaDocumento[],
    origem: PontoRota
  ): RotaPlanejada {
    const familiasPorId = new Map(familias.map((familia) => [familia.id, familia]));
    const visitasSemCoordenadas: VisitaDocumento[] = [];
    const pendentes = visitas.flatMap((visita) => {
      const familia = familiasPorId.get(visita.familiaId);

      if (
        !familia ||
        typeof familia.latitude !== "number" ||
        typeof familia.longitude !== "number"
      ) {
        visitasSemCoordenadas.push(visita);
        return [];
      }

      return [{ visita, latitude: familia.latitude, longitude: familia.longitude }];
    });

    const paradas: RotaPlanejada["paradas"] = [];
    let pontoAtual = origem;
    let distanciaTotalKm = 0;

    while (pendentes.length > 0) {
      let indiceMaisProximo = 0;
      let menorDistancia = Number.POSITIVE_INFINITY;

      pendentes.forEach((parada, indice) => {
        const distancia = calcularDistanciaKm(pontoAtual, parada);
        if (distancia < menorDistancia) {
          menorDistancia = distancia;
          indiceMaisProximo = indice;
        }
      });

      const [proxima] = pendentes.splice(indiceMaisProximo, 1);
      distanciaTotalKm += menorDistancia;
      paradas.push({
        ...proxima,
        ordem: paradas.length + 1,
        distanciaAnteriorKm: menorDistancia,
      });
      pontoAtual = proxima;
    }

    return { paradas, visitasSemCoordenadas, distanciaTotalKm };
  }
}
