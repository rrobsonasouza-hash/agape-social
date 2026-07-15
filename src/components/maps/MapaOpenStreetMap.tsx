"use client";

import dynamic from "next/dynamic";

import "leaflet/dist/leaflet.css";

const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
      Carregando mapa...
    </div>
  ),
});

interface MapaOpenStreetMapProps {
  latitude?: number | null;
  longitude?: number | null;
  interactive?: boolean;
  onPositionChange?: (latitude: number, longitude: number) => void;
  referenceLatitude?: number | null;
  referenceLongitude?: number | null;
  radiusKm?: number | null;
}

export function MapaOpenStreetMap(props: MapaOpenStreetMapProps) {
  return <MapaLeaflet {...props} />;
}
