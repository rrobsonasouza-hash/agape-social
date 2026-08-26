"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

export type PontoCasalEcc = {
  id: string;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  distanciaKm: number;
};

export type MapaEccProps = {
  paroquia: { nome: string; latitude: number; longitude: number };
  casais: PontoCasalEcc[];
};

const MapaEccLeaflet = dynamic(() => import("./MapaEccLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
      Preparando o mapa dos casais...
    </div>
  ),
});

export function MapaEcc(props: MapaEccProps) {
  return <MapaEccLeaflet {...props} />;
}
