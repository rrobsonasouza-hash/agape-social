"use client";

import dynamic from "next/dynamic";

import "leaflet/dist/leaflet.css";
import { Coordenada } from "@/modules/areas-pastorais/schemas/area-pastoral.schema";
import { AreaPastoralDocumento } from "@/modules/areas-pastorais/types/area-pastoral-documento";

const MapaAreasLeaflet = dynamic(() => import("./MapaAreasLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-lg bg-slate-100 text-slate-500">
      Carregando mapa...
    </div>
  ),
});

interface MapaAreasPastoraisProps {
  areas: AreaPastoralDocumento[];
  rascunho: Coordenada[];
  centro?: Coordenada | null;
  corRascunho: string;
  onAdicionarPonto: (coordenada: Coordenada) => void;
}

export function MapaAreasPastorais(props: MapaAreasPastoraisProps) {
  return <MapaAreasLeaflet {...props} />;
}
