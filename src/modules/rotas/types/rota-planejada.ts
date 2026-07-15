import { VisitaDocumento } from "@/modules/visitas/types/visita-documento";

export interface PontoRota {
  latitude: number;
  longitude: number;
}

export interface ParadaRota extends PontoRota {
  ordem: number;
  visita: VisitaDocumento;
  distanciaAnteriorKm: number;
}

export interface RotaPlanejada {
  paradas: ParadaRota[];
  visitasSemCoordenadas: VisitaDocumento[];
  distanciaTotalKm: number;
}
