"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { FormSection } from "@/components/forms/FormSection";
import { TextField } from "@/components/forms/TextField";
import { MapaOpenStreetMap } from "@/components/maps/MapaOpenStreetMap";
import { PageHeader } from "@/components/ui/PageHeader";
import { useEndereco } from "@/modules/enderecos/hooks/useEndereco";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";
import { obterTokenAcesso } from "@/lib/auth/client-session";
import {
  paroquiaSchema,
  ParoquiaFormData,
  ParoquiaFormInput,
} from "@/modules/paroquias/schemas/paroquia.schema";

const valoresIniciais: ParoquiaFormInput = {
  nome: "Paróquia Nossa Senhora Aparecida",
  cep: "02043-081",
  logradouro: "Parque Domingos Luís",
  numero: "273",
  complemento: "",
  bairro: "Jardim São Paulo",
  cidade: "São Paulo",
  estado: "SP",
  latitude: 0,
  longitude: 0,
  raioAtendimentoKm: 10,
};

export default function AdministracaoPage() {
  const { buscarPorCep, consultandoCep } = useEndereco();
  const { buscarPrincipal, salvarPrincipal } = useParoquia(false);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ParoquiaFormInput, unknown, ParoquiaFormData>({
    resolver: zodResolver(paroquiaSchema),
    defaultValues: valoresIniciais,
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const raioAtendimentoKm = Number(watch("raioAtendimentoKm")) || 0;

  useEffect(() => {
    buscarPrincipal()
      .then((dados) => {
        if (dados) reset(dados);
      })
      .catch(() => toast.error("Não foi possível carregar a configuração da paróquia."))
      .finally(() => setCarregando(false));
  }, [buscarPrincipal, reset]);

  function definirPosicao(latitudeAtual: number, longitudeAtual: number) {
    setValue("latitude", latitudeAtual, { shouldDirty: true, shouldValidate: true });
    setValue("longitude", longitudeAtual, { shouldDirty: true, shouldValidate: true });
  }

  async function preencherEndereco() {
    try {
      const endereco = await buscarPorCep(getValues("cep"));
      setValue("cep", endereco.cep, { shouldValidate: true });
      setValue("logradouro", endereco.logradouro, { shouldDirty: true });
      setValue("complemento", endereco.complemento, { shouldDirty: true });
      setValue("bairro", endereco.bairro, { shouldDirty: true });
      setValue("cidade", endereco.cidade, { shouldDirty: true });
      setValue("estado", endereco.estado, { shouldDirty: true });

      if (endereco.latitude !== undefined && endereco.longitude !== undefined) {
        definirPosicao(endereco.latitude, endereco.longitude);
      }

      toast.success(
        endereco.latitude !== undefined
          ? "Endereço e ponto aproximado preenchidos pelo CEP."
          : "Endereço preenchido. Clique no mapa para marcar a igreja."
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível consultar o CEP.");
    }
  }

  async function salvar(data: ParoquiaFormData) {
    try {
      await salvarPrincipal(data);
      toast.success("Configuração da paróquia salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar paróquia:", error);
      toast.error("Não foi possível salvar a configuração da paróquia.");
    }
  }

  async function baixarBackup() {
    setExportando(true);
    try {
      const token = await obterTokenAcesso();
      const resposta = await fetch("/api/backup", { headers: { Authorization: `Bearer ${token}` } });
      if (!resposta.ok) { const dados = await resposta.json(); throw new Error(dados.erro || "Não foi possível gerar o backup."); }
      const arquivo = await resposta.blob(); const disposicao = resposta.headers.get("content-disposition") || ""; const nome = disposicao.match(/filename="([^"]+)"/)?.[1] || `backup-agape-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(arquivo); const link = document.createElement("a"); link.href = url; link.download = nome; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      toast.success("Backup gerado com sucesso.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível gerar o backup."); }
    finally { setExportando(false); }
  }

  if (carregando) {
    return <div className="py-16 text-center text-slate-500">Carregando configuração...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administração"
        description="Configure a paróquia e sua área territorial de atendimento."
      />

      <form onSubmit={handleSubmit(salvar)} className="space-y-6" noValidate>
        <FormSection title="Dados da paróquia" description="Identificação e endereço da sede pastoral.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Nome da paróquia" {...register("nome")} error={errors.nome?.message} />
            <div>
              <TextField label="CEP" mask="cep" {...register("cep")} error={errors.cep?.message} />
              <button type="button" onClick={preencherEndereco} disabled={consultandoCep} className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue-700 disabled:opacity-60">
                <Search size={16} aria-hidden="true" />
                {consultandoCep ? "Consultando CEP..." : "Buscar endereço e ponto"}
              </button>
            </div>
            <TextField label="Logradouro" {...register("logradouro")} error={errors.logradouro?.message} />
            <TextField label="Número" {...register("numero")} error={errors.numero?.message} />
            <TextField label="Complemento" {...register("complemento")} error={errors.complemento?.message} />
            <TextField label="Bairro" {...register("bairro")} error={errors.bairro?.message} />
            <TextField label="Cidade" {...register("cidade")} error={errors.cidade?.message} />
            <TextField label="Estado" maxLength={2} {...register("estado")} error={errors.estado?.message} />
          </div>
        </FormSection>

        <FormSection title="Área de atendimento" description="Defina o ponto de referência e o raio para concessão de benefícios.">
          <div className="mb-4 max-w-xs">
            <TextField label="Raio de atendimento (km)" type="number" min={0.1} step={0.1} {...register("raioAtendimentoKm")} error={errors.raioAtendimentoKm?.message} />
          </div>
          <div className="mb-3">
            <p className="text-sm text-slate-500">Ajuste o marcador clicando exatamente sobre a igreja.</p>
          </div>
          <MapaOpenStreetMap
            latitude={latitude || null}
            longitude={longitude || null}
            interactive
            onPositionChange={definirPosicao}
            referenceLatitude={latitude || null}
            referenceLongitude={longitude || null}
            radiusKm={raioAtendimentoKm}
          />
          {errors.latitude?.message && <p className="mt-2 text-sm text-red-600">{errors.latitude.message}</p>}
        </FormSection>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar configuração"}
          </Button>
        </div>
      </form>

      <FormSection title="Backup da paróquia" description="Baixe uma cópia dos cadastros e históricos desta unidade. Senhas e chaves nunca são incluídas.">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm text-slate-600">Guarde o arquivo em local seguro, pois ele contém dados pessoais das famílias, voluntários, doadores e usuários.</p>
          <button type="button" onClick={() => void baixarBackup()} disabled={exportando} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"><Download size={18} />{exportando ? "Gerando..." : "Baixar backup"}</button>
        </div>
      </FormSection>
    </div>
  );
}
