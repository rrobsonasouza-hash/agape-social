"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPinOff, Navigation, Route as RouteIcon } from "lucide-react";
import toast from "react-hot-toast";

import { FormSection } from "@/components/forms/FormSection";
import { TextField } from "@/components/forms/TextField";
import { MapaRota } from "@/components/maps/MapaRota";
import { PageHeader } from "@/components/ui/PageHeader";
import { useFamilias } from "@/modules/familias/hooks/useFamilias";
import { FamiliaDocumento } from "@/modules/familias/types/familia-documento";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";
import { usePlanejadorRota } from "@/modules/rotas/hooks/usePlanejadorRota";
import { useVisitas } from "@/modules/visitas/hooks/useVisitas";
import { VisitaDocumento } from "@/modules/visitas/types/visita-documento";

export default function RotasPage() {
  const { listar: listarVisitas } = useVisitas();
  const { listar: listarFamilias } = useFamilias();
  const { paroquia, carregandoParoquia } = useParoquia();
  const { planejar } = usePlanejadorRota();
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [visitas, setVisitas] = useState<VisitaDocumento[]>([]);
  const [familias, setFamilias] = useState<FamiliaDocumento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([listarVisitas(), listarFamilias()])
      .then(([visitasCarregadas, familiasCarregadas]) => {
        setVisitas(visitasCarregadas);
        setFamilias(familiasCarregadas);
      })
      .catch(() => toast.error("Não foi possível carregar os dados do roteiro."))
      .finally(() => setCarregando(false));
  }, [listarFamilias, listarVisitas]);

  const visitasDoDia = useMemo(
    () => visitas.filter((visita) => visita.data === data && visita.status === "AGENDADA"),
    [data, visitas]
  );

  const rota = useMemo(() => {
    if (!paroquia) return null;
    return planejar(visitasDoDia, familias, {
      latitude: paroquia.latitude,
      longitude: paroquia.longitude,
    });
  }, [familias, paroquia, planejar, visitasDoDia]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planejador de Rotas"
        description="Organize a sequência territorial das visitas agendadas."
      />

      <FormSection title="Data do roteiro" description="O planejamento considera somente visitas agendadas.">
        <div className="max-w-xs">
          <TextField label="Data" type="date" value={data} onChange={(event) => setData(event.target.value)} />
        </div>
      </FormSection>

      {carregando || carregandoParoquia ? (
        <div className="py-16 text-center text-slate-500">Calculando roteiro...</div>
      ) : !paroquia ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          Configure a paróquia em Administração antes de planejar rotas.
        </div>
      ) : !rota || visitasDoDia.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <CalendarDays size={38} className="mx-auto text-slate-300" />
          <p className="mt-4 font-medium text-slate-700">Nenhuma visita agendada nesta data.</p>
          <p className="mt-2 text-sm text-slate-500">Escolha outra data ou agende visitas antes de gerar o roteiro.</p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <Navigation className="text-blue-700" />
              <p className="mt-3 text-3xl font-bold text-slate-900">{rota.paradas.length}</p>
              <p className="text-sm text-slate-500">Paradas no roteiro</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <RouteIcon className="text-blue-700" />
              <p className="mt-3 text-3xl font-bold text-slate-900">{rota.distanciaTotalKm.toFixed(1)} km</p>
              <p className="text-sm text-slate-500">Distância territorial estimada</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <MapPinOff className={rota.visitasSemCoordenadas.length ? "text-amber-600" : "text-green-600"} />
              <p className="mt-3 text-3xl font-bold text-slate-900">{rota.visitasSemCoordenadas.length}</p>
              <p className="text-sm text-slate-500">Visitas sem localização</p>
            </div>
          </section>

          {rota.paradas.length > 0 && (
            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <MapaRota
                  origem={{ latitude: paroquia.latitude, longitude: paroquia.longitude }}
                  paradas={rota.paradas}
                />
                <p className="mt-3 text-xs text-slate-500">
                  As linhas representam distância direta entre os pontos, não o trajeto pelas ruas.
                </p>
              </section>

              <FormSection title="Sequência sugerida" description="Partida na paróquia; prioridade para o ponto mais próximo.">
                <ol className="space-y-4">
                  {rota.paradas.map((parada) => (
                    <li key={parada.visita.id} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{parada.ordem}</span>
                      <div>
                        <p className="font-medium text-slate-900">{parada.visita.familiaNome}</p>
                        <p className="text-sm text-slate-500">{parada.visita.horario} • {parada.visita.objetivo}</p>
                        <p className="mt-1 text-xs text-slate-400">{parada.distanciaAnteriorKm.toFixed(1)} km desde o ponto anterior</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </FormSection>
            </div>
          )}

          {rota.visitasSemCoordenadas.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <p className="font-semibold">Algumas visitas não entraram no roteiro</p>
              <p className="mt-1 text-sm">Edite a localização destas famílias: {rota.visitasSemCoordenadas.map((visita) => visita.familiaNome).join(", ")}.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
