"use client";

import { useRouter } from "next/navigation";
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

export default function NovaFamiliaPage() {
  const router = useRouter();
  const { criar } = useFamilias();

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FamiliaFormInput, unknown, FamiliaFormData>({
    resolver: zodResolver(familiaSchema),
    defaultValues: {
      status: "ATIVA",
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
      beneficioBloqueado: false,
      faltasConsecutivas: 0,
      motivoBloqueio: "",
    },
  });

  async function salvar(data: FamiliaFormData) {
    try {
      await criar(data);

      toast.success("Família cadastrada com sucesso!");

      router.push("/familias");
    } catch (error) {
      console.error("Erro ao cadastrar a família:", error);

      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar a família.";

      toast.error(mensagem);
    }
  }

  function erroFormulario() {
    toast.error("Revise os campos obrigatórios do formulário.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Família"
        description="Cadastre uma nova família atendida pela Pastoral Social."
      />

      <form
        onSubmit={handleSubmit(salvar, erroFormulario)}
        className="space-y-6"
        noValidate
      >
        <FormSection
          title="Dados do responsável"
          description="Informações de identificação e contato."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Nome do responsável"
              placeholder="Nome completo"
              {...register("nomeResponsavel")}
              error={errors.nomeResponsavel?.message}
            />

            <TextField
              label="CPF"
              placeholder="000.000.000-00"
              mask="cpf"
              {...register("cpf")}
              error={errors.cpf?.message}
            />

            <TextField
              label="Telefone"
              placeholder="(00) 00000-0000"
              mask="telefone"
              {...register("telefone")}
              error={errors.telefone?.message}
            />

            <TextField
              label="E-mail"
              type="email"
              placeholder="email@exemplo.com"
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
          description="Composição e contexto socioeconômico."
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
            onClick={() => router.push("/familias")}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Salvar Família"}
          </Button>
        </div>
      </form>
    </div>
  );
}
