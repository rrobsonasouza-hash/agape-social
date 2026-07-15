"use client";

import { Search } from "lucide-react";
import {
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import toast from "react-hot-toast";

import { TextField } from "@/components/forms/TextField";
import { MapaOpenStreetMap } from "@/components/maps/MapaOpenStreetMap";
import { useEndereco } from "@/modules/enderecos/hooks/useEndereco";
import { FamiliaFormInput } from "../schemas/familia.schema";
import { calcularDistanciaKm } from "@/lib/geo/distance";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";

interface EnderecoFamiliaFieldsProps {
  register: UseFormRegister<FamiliaFormInput>;
  errors: FieldErrors<FamiliaFormInput>;
  getValues: UseFormGetValues<FamiliaFormInput>;
  setValue: UseFormSetValue<FamiliaFormInput>;
  watch: UseFormWatch<FamiliaFormInput>;
}

export function EnderecoFamiliaFields({
  register,
  errors,
  getValues,
  setValue,
  watch,
}: EnderecoFamiliaFieldsProps) {
  const { buscarPorCep, consultandoCep } = useEndereco();
  const { paroquia } = useParoquia();
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const distanciaKm =
    paroquia &&
    typeof latitude === "number" &&
    typeof longitude === "number"
      ? calcularDistanciaKm(
          {
            latitude: paroquia.latitude,
            longitude: paroquia.longitude,
          },
          { latitude, longitude }
        )
      : null;

  async function preencherEndereco() {
    const cep = getValues("cep") ?? "";

    if (!cep.trim()) {
      return;
    }

    try {
      const endereco = await buscarPorCep(cep);

      setValue("cep", endereco.cep, { shouldValidate: true });
      setValue("logradouro", endereco.logradouro, { shouldDirty: true });
      setValue("complemento", endereco.complemento, { shouldDirty: true });
      setValue("bairro", endereco.bairro, { shouldDirty: true });
      setValue("cidade", endereco.cidade, { shouldDirty: true });
      setValue("estado", endereco.estado, { shouldDirty: true });

      if (
        typeof endereco.latitude === "number" &&
        typeof endereco.longitude === "number"
      ) {
        definirPosicao(endereco.latitude, endereco.longitude);
      }

      toast.success(
        endereco.latitude !== undefined
          ? "Endereço e ponto aproximado preenchidos pelo CEP."
          : "Endereço preenchido. Ajuste o ponto manualmente no mapa."
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível consultar o CEP.";
      toast.error(mensagem);
    }
  }

  function definirPosicao(latitudeAtual: number, longitudeAtual: number) {
    setValue("latitude", latitudeAtual, { shouldDirty: true });
    setValue("longitude", longitudeAtual, { shouldDirty: true });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
      <div>
        <TextField
          label="CEP"
          mask="cep"
          {...register("cep")}
          error={errors.cep?.message}
          onBlur={preencherEndereco}
        />
        <button
          type="button"
          onClick={preencherEndereco}
          disabled={consultandoCep}
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition hover:text-blue-900 disabled:cursor-wait disabled:opacity-60"
        >
          <Search size={16} aria-hidden="true" />
          {consultandoCep ? "Consultando CEP..." : "Buscar endereço"}
        </button>
      </div>

      <TextField label="Logradouro" {...register("logradouro")} error={errors.logradouro?.message} />
      <TextField label="Número" {...register("numero")} error={errors.numero?.message} />
      <TextField label="Complemento" {...register("complemento")} error={errors.complemento?.message} />
      <TextField label="Bairro" {...register("bairro")} error={errors.bairro?.message} />
      <TextField label="Cidade" {...register("cidade")} error={errors.cidade?.message} />
      <TextField label="Estado" maxLength={2} {...register("estado")} error={errors.estado?.message} />
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-5">
        <div>
          <div>
            <h3 className="font-medium text-slate-900">Localização no mapa</h3>
            <p className="mt-1 text-sm text-slate-500">
              Clique no mapa para posicionar o imóvel. O endereço não é enviado a serviços de geocodificação.
            </p>
          </div>
        </div>

        <MapaOpenStreetMap
          latitude={latitude}
          longitude={longitude}
          interactive
          onPositionChange={definirPosicao}
          referenceLatitude={paroquia?.latitude}
          referenceLongitude={paroquia?.longitude}
          radiusKm={paroquia?.raioAtendimentoKm}
        />

        {typeof latitude === "number" && typeof longitude === "number" && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-500">
              Coordenadas: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </span>
            {distanciaKm !== null && (
              <span
                className={`rounded-full px-3 py-1 font-semibold ${
                  distanciaKm <= paroquia!.raioAtendimentoKm
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {distanciaKm.toFixed(1)} km — {distanciaKm <= paroquia!.raioAtendimentoKm ? "dentro da área" : "fora da área"}
              </span>
            )}
          </div>
        )}

        {!paroquia && (
          <p className="text-xs text-amber-700">
            Configure o ponto e o raio da pastoral para validar a área de atendimento.
          </p>
        )}
      </div>
    </div>
  );
}
