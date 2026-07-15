"use client";

import { divIcon, LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { ParadaRota, PontoRota } from "@/modules/rotas/types/rota-planejada";

interface MapaRotaLeafletProps {
  origem: PontoRota;
  paradas: ParadaRota[];
}

function AjustarEnquadramento({ pontos }: { pontos: LatLngExpression[] }) {
  const mapa = useMap();

  useEffect(() => {
    if (pontos.length > 1) {
      mapa.fitBounds(pontos as LatLngBoundsExpression, { padding: [40, 40] });
    }
  }, [mapa, pontos]);

  return null;
}

function iconeNumerado(numero: number) {
  return divIcon({
    className: "",
    html: `<span style="display:flex;width:30px;height:30px;align-items:center;justify-content:center;border-radius:9999px;background:#2563eb;color:#fff;border:3px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,.35);font-weight:700;font-size:12px">${numero}</span>`,
    iconAnchor: [15, 15],
  });
}

const iconeOrigem = divIcon({
  className: "",
  html: '<span style="display:flex;width:34px;height:34px;align-items:center;justify-content:center;border-radius:9999px;background:#16a34a;color:#fff;border:3px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,.35);font-weight:700;font-size:16px">P</span>',
  iconAnchor: [17, 17],
});

export default function MapaRotaLeaflet({ origem, paradas }: MapaRotaLeafletProps) {
  const pontos: LatLngExpression[] = [
    [origem.latitude, origem.longitude],
    ...paradas.map((parada) => [parada.latitude, parada.longitude] as LatLngExpression),
  ];

  return (
    <MapContainer center={[origem.latitude, origem.longitude]} zoom={13} className="h-[540px] w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url={process.env.NEXT_PUBLIC_OSM_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
        maxZoom={19}
      />
      <AjustarEnquadramento pontos={pontos} />
      <Polyline positions={pontos} pathOptions={{ color: "#2563eb", weight: 4, dashArray: "8 8" }} />
      <Marker position={[origem.latitude, origem.longitude]} icon={iconeOrigem}>
        <Popup>Paróquia — início do roteiro</Popup>
      </Marker>
      {paradas.map((parada) => (
        <Marker
          key={parada.visita.id}
          position={[parada.latitude, parada.longitude]}
          icon={iconeNumerado(parada.ordem)}
        >
          <Popup>
            <strong>{parada.ordem}. {parada.visita.familiaNome}</strong>
            <br />
            {parada.visita.horario} — {parada.visita.objetivo}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
