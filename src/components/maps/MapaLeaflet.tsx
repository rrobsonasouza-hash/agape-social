"use client";

import { divIcon, LatLngExpression } from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";

interface MapaLeafletProps {
  latitude?: number | null;
  longitude?: number | null;
  interactive?: boolean;
  onPositionChange?: (latitude: number, longitude: number) => void;
  referenceLatitude?: number | null;
  referenceLongitude?: number | null;
  radiusKm?: number | null;
}

const centroBrasil: LatLngExpression = [-14.235, -51.9253];
const marcador = divIcon({
  className: "",
  html: '<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(15,23,42,.35)"></span>',
  iconAnchor: [11, 22],
});

function SeletorPosicao({
  onPositionChange,
}: Pick<MapaLeafletProps, "onPositionChange">) {
  useMapEvents({
    click(event) {
      onPositionChange?.(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export default function MapaLeaflet({
  latitude,
  longitude,
  interactive = false,
  onPositionChange,
  referenceLatitude,
  referenceLongitude,
  radiusKm,
}: MapaLeafletProps) {
  const possuiCoordenadas =
    typeof latitude === "number" && typeof longitude === "number";
  const centro: LatLngExpression = possuiCoordenadas
    ? [latitude, longitude]
    : centroBrasil;
  const possuiReferencia =
    typeof referenceLatitude === "number" &&
    typeof referenceLongitude === "number";

  return (
    <MapContainer
      key={`${latitude ?? "brasil"}-${longitude ?? "brasil"}`}
      center={centro}
      zoom={possuiCoordenadas ? 17 : 4}
      scrollWheelZoom
      className="h-80 w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url={
          process.env.NEXT_PUBLIC_OSM_TILE_URL ??
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
        maxZoom={19}
      />

      {interactive && (
        <SeletorPosicao onPositionChange={onPositionChange} />
      )}

      {possuiCoordenadas && (
        <Marker position={[latitude, longitude]} icon={marcador}>
          <Popup>Família assistida</Popup>
        </Marker>
      )}

      {possuiReferencia && (
        <>
          <Circle
            center={[referenceLatitude, referenceLongitude]}
            radius={(radiusKm ?? 0) * 1000}
            pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.08 }}
          />
          <Circle
            center={[referenceLatitude, referenceLongitude]}
            radius={35}
            pathOptions={{ color: "#15803d", fillColor: "#16a34a", fillOpacity: 1 }}
          >
            <Popup>Referência da Pastoral Social</Popup>
          </Circle>
        </>
      )}
    </MapContainer>
  );
}
