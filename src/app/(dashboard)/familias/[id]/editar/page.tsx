"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { FormSection } from "@/components/forms/FormSection";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  familiaSchema,
  FamiliaFormData,
  FamiliaFormInput,
} from "@/modules/familias/schemas/familia.schema";

import { useFamilias } from "@/modules/familias/hooks/useFamilias";
import { EnderecoFamiliaFields } from "@/modules/familias/components/EnderecoFamiliaFields";
import { formatMoeda, parseMoeda } from "@/lib/formatters/masks";

export default function EditarFamiliaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { buscarPorId, atualizar } = useFamilias();
  const [carregando, setCarregando] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<FamiliaFormInput, unknown, FamiliaFormData>({
    resolver: zodResolver(familiaSchema),
    defaultValues: {
      nomeResponsavel: "",
      cpf: "",
      telefone: "",
      email: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      latitude: null,
      longitude: null,
      quantidadeMoradores: 1,
      rendaFamiliar: 0,
      observacoes: "",
      consentimentoLgpd: false,
      consentimentoLgpdEm: "",
      versaoConsentimentoLgpd: "",
      status: "ATIVA",
      beneficioBloqueado: false,
      faltasConsecutivas: 0,
      motivoBloqueio: "",
    },
  });

  useEffect(() => {
    async function carregarFamilia() {
      try {
        const familia = await buscarPorId(params.id);

        if (!familia) {
          toast.error("Família não encontrada.");
          router.push("/familias");
          return;
        }

        reset({
          nomeResponsavel: familia.nomeResponsavel || "",
          cpf: familia.cpf || "",
          telefone: familia.telefone || "",
          email: familia.email || "",
          cep: familia.cep || "",
          logradouro: familia.logradouro || "",
          numero: familia.numero || "",
          complemento: familia.complemento || "",
          bairro: familia.bairro || "",
          cidade: familia.cidade || "",
          estado: familia.estado || "",
          latitude: familia.latitude ?? null,
          longitude: familia.longitude ?? null,
          quantidadeMoradores:
            Number(familia.quantidadeMoradores) || 1,
          rendaFamiliar:
            Number(familia.rendaFamiliar) || 0,
          observacoes: familia.observacoes || "",
          consentimentoLgpd: familia.consentimentoLgpd ?? false,
          consentimentoLgpdEm: familia.consentimentoLgpdEm ?? "",
          versaoConsentimentoLgpd: familia.versaoConsentimentoLgpd ?? "",
          status: familia.status || "ATIVA",
          beneficioBloqueado: familia.beneficioBloqueado ?? false,
          faltasConsecutivas: familia.faltasConsecutivas ?? 0,
          motivoBloqueio: familia.motivoBloqueio ?? "",
        });
      } catch (error) {
        console.error("Erro ao carregar família:", error);
        toast.error("Não foi possível carregar a família.");
      } finally {
        setCarregando(false);
      }
    }

    carregarFamilia();
  }, [buscarPorId, params.id, reset, router]);

  async function salvar(data: FamiliaFormData) {
    try {
      await atualizar(params.id, data);

      toast.success("Família atualizada com sucesso!");

      router.push(`/familias/${params.id}`);
    } catch (error) {
      console.error("Erro ao atualizar família:", error);

      toast.error("Não foi possível atualizar a família.");
    }
  }

  function erroFormulario() {
    toast.error("Revise os campos do formulário.");
  }

  if (carregando) {
    return (
      <div className="py-16 text-center text-slate-500">
        Carregando dados da família...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(salvar, erroFormulario)}
      className="space-y-6"
      noValidate
    >
      <PageHeader
        title="Editar Família"
        description="Atualize os dados cadastrais e sociais da família."
      />

      <FormSection
        title="Dados do responsável"
        description="Informações de identificação e contato."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Nome do responsável"
            {...register("nomeResponsavel")}
            error={errors.nomeResponsavel?.message}
          />

          <TextField
            label="CPF"
            mask="cpf"
            {...register("cpf")}
            error={errors.cpf?.message}
          />

          <TextField
            label="Telefone"
            mask="telefone"
            {...register("telefone")}
            error={errors.telefone?.message}
          />

          <TextField
            label="E-mail"
            type="email"
            {...register("email")}
            error={errors.email?.message}
          />
        </div>
      </FormSection>

      <FormSection
        title="Endereço"
        description="Localização atual da família."
      >
        <EnderecoFamiliaFields
          register={register}
          errors={errors}
          getValues={getValues}
          setValue={setValue}
          watch={watch}
        />
      </FormSection>

      <FormSection
        title="Situação familiar"
        description="Composição, contexto socioeconômico e status."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Quantidade de moradores"
            type="number"
            min={1}
            {...register("quantidadeMoradores")}
            error={errors.quantidadeMoradores?.message}
          />

          <Controller name="rendaFamiliar" control={control} render={({ field }) => <TextField label="Renda familiar" type="text" inputMode="numeric" value={formatMoeda(Number(field.value || 0))} onChange={(event) => field.onChange(parseMoeda(event.target.value))} error={errors.rendaFamiliar?.message} />} />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              {...register("status")}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="ATIVA">Ativa</option>
              <option value="INATIVA">Inativa</option>
            </select>

            {errors.status?.message && (
              <p className="text-sm text-red-600">
                {errors.status.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <TextAreaField
            label="Observações"
            rows={5}
            {...register("observacoes")}
            error={errors.observacoes?.message}
            placeholder="Registre informações relevantes sobre a família."
          />
        </div>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          className="bg-slate-500 hover:bg-slate-600"
          onClick={() => router.push(`/familias/${params.id}`)}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Salvando alterações..."
            : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
