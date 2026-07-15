"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/ui/PageHeader";

import { VoluntarioForm } from "@/modules/voluntarios/components/VoluntarioForm";
import { useVoluntarios } from "@/modules/voluntarios/hooks/useVoluntarios";

import {
  VoluntarioFormData,
} from "@/modules/voluntarios/schemas/voluntario.schema";

export default function EditarVoluntarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const {
    buscarPorId,
    atualizar,
  } = useVoluntarios();

  const [valoresIniciais, setValoresIniciais] =
    useState<VoluntarioFormData | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    async function carregarVoluntario() {
      try {
        const voluntario = await buscarPorId(
          params.id
        );

        if (!voluntario) {
          toast.error(
            "Voluntário não encontrado."
          );

          router.push("/voluntarios");
          return;
        }

        setValoresIniciais({
          nome: voluntario.nome || "",
          cpf: voluntario.cpf || "",
          telefone: voluntario.telefone || "",
          email: voluntario.email || "",
          dataNascimento:
            voluntario.dataNascimento || "",
          pastoral:
            voluntario.pastoral || "",
          funcao:
            voluntario.funcao || "",
          dataIngresso:
            voluntario.dataIngresso || "",
          disponibilidade: {
            segunda:
              voluntario.disponibilidade?.segunda ??
              false,
            terca:
              voluntario.disponibilidade?.terca ??
              false,
            quarta:
              voluntario.disponibilidade?.quarta ??
              false,
            quinta:
              voluntario.disponibilidade?.quinta ??
              false,
            sexta:
              voluntario.disponibilidade?.sexta ??
              false,
            sabado:
              voluntario.disponibilidade?.sabado ??
              false,
            domingo:
              voluntario.disponibilidade?.domingo ??
              false,
          },
          observacoes:
            voluntario.observacoes || "",
          status:
            voluntario.status || "ATIVO",
        });
      } catch (error) {
        console.error(
          "Erro ao carregar voluntário:",
          error
        );

        toast.error(
          "Não foi possível carregar os dados do voluntário."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarVoluntario();
  }, [
    buscarPorId,
    params.id,
    router,
  ]);

  async function salvar(
    data: VoluntarioFormData
  ) {
    try {
      await atualizar(
        params.id,
        data
      );

      toast.success(
        "Voluntário atualizado com sucesso!"
      );

      router.push(
        `/voluntarios/${params.id}`
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar voluntário:",
        error
      );

      toast.error(
        "Não foi possível atualizar o voluntário."
      );
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-slate-500">
          Carregando dados do voluntário...
        </p>
      </div>
    );
  }

  if (!valoresIniciais) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Voluntário"
        description="Atualize os dados pessoais, pastorais e a disponibilidade do voluntário."
      />

      <VoluntarioForm
        valoresIniciais={valoresIniciais}
        textoBotao="Salvar alterações"
        textoSalvando="Salvando alterações..."
        onSubmit={salvar}
        onCancel={() =>
          router.push(
            `/voluntarios/${params.id}`
          )
        }
      />
    </div>
  );
}