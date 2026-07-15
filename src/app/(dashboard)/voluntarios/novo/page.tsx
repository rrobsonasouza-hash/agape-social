"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/ui/PageHeader";

import { VoluntarioForm } from "@/modules/voluntarios/components/VoluntarioForm";
import { useVoluntarios } from "@/modules/voluntarios/hooks/useVoluntarios";
import { VoluntarioFormData } from "@/modules/voluntarios/schemas/voluntario.schema";

export default function NovoVoluntarioPage() {
  const router = useRouter();
  const { criar } = useVoluntarios();

  async function salvar(data: VoluntarioFormData) {
    try {
      await criar(data);

      toast.success(
        "Voluntário cadastrado com sucesso!"
      );

      router.push("/voluntarios");
    } catch (error) {
      console.error(error);

      toast.error(
        "Não foi possível cadastrar o voluntário."
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Voluntário"
        description="Cadastre uma pessoa que atua nas atividades pastorais da paróquia."
      />

      <VoluntarioForm
        onSubmit={salvar}
        onCancel={() => router.push("/voluntarios")}
      />
    </div>
  );
}