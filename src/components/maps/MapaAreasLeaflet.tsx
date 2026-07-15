"use client";

import { LatLngExpression } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Polygon,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";

import { Coordenada } from "@/modules/areas-pastorais/schemas/area-pastoral.schema";
import { AreaPastoralDocumento } from "@/modules/areas-pastorais/types/area-pastoral-documento";

interface MapaAreasLeafletProps {
  areas: AreaPastoralDocumento[];
  rascunho: Coordenada[];
  centro?: Coordenada | null;
  corRascunho: string;
  onAdicionarPonto: (coordenada: Coordenada) => void;
}

function CapturarClique({
  onAdicionarPonto,
}: Pick<MapaAreasLeafletProps, "onAdicionarPonto">) {
  useMapEvents({
    click(event) {
      onAdicionarPonto({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });
  return null;
}

function converter(poligono: Coordenada[]): LatLngExpression[] {
  return poligono.map((ponto) => [ponto.latitude, ponto.longitude]);
}

export default function MapaAreasLeaflet({
  areas,
  rascunho,
  centro,
  corRascunho,
  onAdicionarPonto,
}: MapaAreasLeafletProps) {
  const centroMapa: LatLngExpression = centro
    ? [centro.latitude, centro.longitude]
    : [-14.235, -51.9253];

  return (
    <MapContainer center={centroMapa} zoom={centro ? 14 : 4} className="h-[520px] w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url={process.env.NEXT_PUBLIC_OSM_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
        maxZoom={19}
      />
      <CapturarClique onAdicionarPonto={onAdicionarPonto} />

      {areas.map((area) => (
        <Polygon
          key={area.id}
          positions={converter(area.poligono)}
          pathOptions={{ color: area.cor, fillColor: area.cor, fillOpacity: 0.18 }}
        >
          <Popup>{area.nome}</Popup>
        </Polygon>
      ))}

      {rascunho.length >= 2 && (
        <Polygon
          positions={converter(rascunho)}
          pathOptions={{ color: corRascunho, fillColor: corRascunho, fillOpacity: 0.22, dashArray: "6 6" }}
        />
      )}

      {rascunho.map((ponto, indice) => (
        <CircleMarker
          key={`${ponto.latitude}-${ponto.longitude}-${indice}`}
          center={[ponto.latitude, ponto.longitude]}
          radius={6}
          pathOptions={{ color: corRascunho, fillColor: "#ffffff", fillOpacity: 1, weight: 3 }}
        >
          <Popup>Ponto {indice + 1}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
