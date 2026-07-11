"use client";

import { useRouter } from "next/navigation";
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
      console.clear();

      console.log("========== NOVO CADASTRO ==========");
      console.log("Dados recebidos:");
      console.table(data);

      const resultado = await criar(data);

      console.log("Documento criado:");
      console.log(resultado);

      toast.success("Família cadastrada com sucesso!");

      router.push("/familias");
    } catch (error: any) {
      console.error("========== ERRO ==========");
      console.error(error);

      if (error?.code) {
        console.error("Código:", error.code);
      }

      if (error?.message) {
        console.error("Mensagem:", error.message);

        alert(
          `Erro do Firebase\n\nCódigo: ${error.code}\n\nMensagem:\n${error.message}`
        );

        toast.error(error.message);
      } else {
        alert("Ocorreu um erro desconhecido. Veja o Console (F12).");
        toast.error("Erro desconhecido.");
      }
    }
  }

  function erroFormulario(errors: unknown) {
    console.log("===== ERROS DE VALIDAÇÃO =====");
    console.log(errors);

    toast.error("Existem campos obrigatórios não preenchidos.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nova Família</h1>

        <p className="text-gray-500">
          Cadastro da família atendida.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(salvar, erroFormulario)}
        noValidate
      >
        <Card title="Dados do Responsável">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Nome"
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
              {...register("email")}
              error={errors.email?.message}
            />
          </div>
        </Card>

        <div className="mt-8 flex justify-end gap-3">
          <Button
            type="button"
            className="bg-gray-500 hover:bg-gray-600"
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