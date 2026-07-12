"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { Card } from "@/components/forms/Card";
import { TextField } from "@/components/forms/TextField";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  familiaSchema,
  FamiliaFormData,
} from "@/modules/familias/schemas/familia.schema";

import { useFamilias } from "@/modules/familias/hooks/useFamilias";

export default function NovaFamiliaPage() {
  const router = useRouter();
  const { criar } = useFamilias();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FamiliaFormData>({
    resolver: zodResolver(familiaSchema),
    defaultValues: {
      status: "ATIVA",
      quantidadeMoradores: 1,
      rendaFamiliar: 0,
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
        <Card title="Dados do responsável">
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
              {...register("cpf")}
              error={errors.cpf?.message}
            />

            <TextField
              label="Telefone"
              placeholder="(00) 00000-0000"
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
        </Card>

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