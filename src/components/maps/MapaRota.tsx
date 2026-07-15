"use client";

import dynamic from "next/dynamic";

import "leaflet/dist/leaflet.css";
import { ParadaRota, PontoRota } from "@/modules/rotas/types/rota-planejada";

const MapaRotaLeaflet = dynamic(() => import("./MapaRotaLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[540px] items-center justify-center rounded-lg bg-slate-100 text-slate-500">
      Carregando roteiro...
    </div>
  ),
});

interface MapaRotaProps {
  origem: PontoRota;
  paradas: ParadaRota[];
}

export function MapaRota(props: MapaRotaProps) {
  return <MapaRotaLeaflet {...props} />;
}
