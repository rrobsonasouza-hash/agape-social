"use client";

import { divIcon, type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { MapaEccProps } from "./MapaEcc";

const iconeParoquia = divIcon({
  className: "",
  html: '<span style="display:grid;width:38px;height:38px;place-items:center;border-radius:999px;background:#16a34a;color:white;border:4px solid white;box-shadow:0 3px 12px #0f172a55;font-weight:900">P</span>',
  iconAnchor: [19, 19],
});

function iconeCasal(numero: number) {
  return divIcon({
    className: "",
    html: `<span style="display:grid;width:32px;height:32px;place-items:center;border-radius:999px;background:#2563eb;color:white;border:3px solid white;box-shadow:0 3px 10px #0f172a55;font-weight:800;font-size:12px">${numero}</span>`,
    iconAnchor: [16, 16],
  });
}

function Enquadrar({ pontos }: { pontos: LatLngExpression[] }) {
  const mapa = useMap();
  useEffect(() => {
    if (pontos.length > 1) mapa.fitBounds(pontos as LatLngBoundsExpression, { padding: [44, 44] });
  }, [mapa, pontos]);
  return null;
}

export default function MapaEccLeaflet({ paroquia, casais }: MapaEccProps) {
  const pontos = useMemo<LatLngExpression[]>(
    () => [
      [paroquia.latitude, paroquia.longitude],
      ...casais.map((casal) => [casal.latitude, casal.longitude] as LatLngExpression),
    ],
    [paroquia, casais],
  );

  return (
    <MapContainer center={[paroquia.latitude, paroquia.longitude]} zoom={13} className="h-[480px] w-full rounded-2xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url={process.env.NEXT_PUBLIC_OSM_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
        maxZoom={19}
      />
      <Enquadrar pontos={pontos} />
      <Marker position={[paroquia.latitude, paroquia.longitude]} icon={iconeParoquia}>
        <Popup><strong>{paroquia.nome}</strong><br />Ponto de referência do encontro</Popup>
      </Marker>
      {casais.map((casal, indice) => (
        <Marker key={casal.id} position={[casal.latitude, casal.longitude]} icon={iconeCasal(indice + 1)}>
          <Popup>
            <strong>{indice + 1}. {casal.nome}</strong><br />
            {casal.endereco || "Endereço não informado"}<br />
            {casal.distanciaKm.toFixed(1)} km da paróquia
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
