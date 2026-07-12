"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { Card } from "@/components/forms/Card";
import { TextField } from "@/components/forms/TextField";

import {
  familiaSchema,
  FamiliaFormData,
} from "@/modules/familias/schemas/familia.schema";

import { useFamilias } from "@/modules/familias/hooks/useFamilias";

export default function EditarFamiliaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { buscarPorId, atualizar } = useFamilias();

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
      isLoading,
    },
  } = useForm<FamiliaFormData>({
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
      quantidadeMoradores: 1,
      rendaFamiliar: 0,
      observacoes: "",
      status: "ATIVA",
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
          quantidadeMoradores:
            Number(familia.quantidadeMoradores) || 1,
          rendaFamiliar:
            Number(familia.rendaFamiliar) || 0,
          observacoes: familia.observacoes || "",
          status: familia.status || "ATIVA",
        });
      } catch (error) {
        console.error("Erro ao carregar família:", error);
        toast.error("Não foi possível carregar a família.");
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

  if (isLoading) {
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Editar Família
        </h1>

        <p className="mt-1 text-slate-500">
          Atualize os dados cadastrais e sociais da família.
        </p>
      </div>

      <Card title="Dados do responsável">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Nome do responsável"
            {...register("nomeResponsavel")}
            error={errors.nomeResponsavel?.message}
          />

          <TextField
            label="CPF"
            {...register("cpf")}
            error={errors.cpf?.message}
          />

          <TextField
            label="Telefone"
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
      </Card>

      <Card title="Endereço">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="CEP"
            {...register("cep")}
            error={errors.cep?.message}
          />

          <TextField
            label="Logradouro"
            {...register("logradouro")}
            error={errors.logradouro?.message}
          />

          <TextField
            label="Número"
            {...register("numero")}
            error={errors.numero?.message}
          />

          <TextField
            label="Complemento"
            {...register("complemento")}
            error={errors.complemento?.message}
          />

          <TextField
            label="Bairro"
            {...register("bairro")}
            error={errors.bairro?.message}
          />

          <TextField
            label="Cidade"
            {...register("cidade")}
            error={errors.cidade?.message}
          />

          <TextField
            label="Estado"
            maxLength={2}
            {...register("estado")}
            error={errors.estado?.message}
          />
        </div>
      </Card>

      <Card title="Situação familiar">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Quantidade de moradores"
            type="number"
            min={1}
            {...register("quantidadeMoradores")}
            error={errors.quantidadeMoradores?.message}
          />

          <TextField
            label="Renda familiar"
            type="number"
            min={0}
            step="0.01"
            {...register("rendaFamiliar")}
            error={errors.rendaFamiliar?.message}
          />

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

        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Observações
          </label>

          <textarea
            rows={5}
            {...register("observacoes")}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Registre informações relevantes sobre a família."
          />

          {errors.observacoes?.message && (
            <p className="text-sm text-red-600">
              {errors.observacoes.message}
            </p>
          )}
        </div>
      </Card>

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