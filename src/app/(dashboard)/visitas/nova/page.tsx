"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { FormSection } from "@/components/forms/FormSection";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { TextField } from "@/components/forms/TextField";
import { PageHeader } from "@/components/ui/PageHeader";
import { useFamilias } from "@/modules/familias/hooks/useFamilias";
import { FamiliaDocumento } from "@/modules/familias/types/familia-documento";
import { useVoluntarios } from "@/modules/voluntarios/hooks/useVoluntarios";
import { VoluntarioDocumento } from "@/modules/voluntarios/types/voluntario-documento";
import { useVisitas } from "@/modules/visitas/hooks/useVisitas";
import {
  visitaSchema,
  VisitaFormData,
  VisitaFormInput,
} from "@/modules/visitas/schemas/visita.schema";

export default function NovaVisitaPage() {
  const router = useRouter();
  const { listar: listarFamilias } = useFamilias();
  const { listar: listarVoluntarios } = useVoluntarios();
  const { criar } = useVisitas();
  const [familias, setFamilias] = useState<FamiliaDocumento[]>([]);
  const [voluntarios, setVoluntarios] = useState<VoluntarioDocumento[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VisitaFormInput, unknown, VisitaFormData>({
    resolver: zodResolver(visitaSchema),
    defaultValues: {
      familiaId: "",
      familiaNome: "",
      voluntarioId: "",
      voluntarioNome: "",
      data: new Date().toISOString().slice(0, 10),
      horario: "09:00",
      objetivo: "Visita de acompanhamento",
      observacoes: "",
      status: "AGENDADA",
    },
  });

  useEffect(() => {
    Promise.all([listarFamilias(), listarVoluntarios()])
      .then(([familiasCarregadas, voluntariosCarregados]) => {
        setFamilias(familiasCarregadas.filter((familia) => familia.status === "ATIVA"));
        setVoluntarios(voluntariosCarregados.filter((voluntario) => voluntario.status === "ATIVO"));
      })
      .catch(() => toast.error("Não foi possível carregar famílias e voluntários."));
  }, [listarFamilias, listarVoluntarios]);

  async function salvar(data: VisitaFormData) {
    try {
      await criar(data);
      toast.success("Visita agendada com sucesso!");
      router.push("/visitas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível agendar a visita.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Agendar visita" description="Organize um novo acompanhamento pastoral para uma família." />
      <form onSubmit={handleSubmit(salvar)} className="space-y-6" noValidate>
        <FormSection title="Atendimento" description="Família, responsável e finalidade da visita.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Família</label>
              <select
                {...register("familiaId")}
                onChange={(event) => {
                  const familia = familias.find((item) => item.id === event.target.value);
                  setValue("familiaId", event.target.value, { shouldValidate: true });
                  setValue("familiaNome", familia?.nomeResponsavel ?? "");
                }}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Selecione uma família</option>
                {familias.map((familia) => <option key={familia.id} value={familia.id}>{familia.nomeResponsavel}</option>)}
              </select>
              {errors.familiaId && <p className="text-sm text-red-600">{errors.familiaId.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Voluntário responsável</label>
              <select
                {...register("voluntarioId")}
                onChange={(event) => {
                  const voluntario = voluntarios.find((item) => item.id === event.target.value);
                  setValue("voluntarioId", event.target.value);
                  setValue("voluntarioNome", voluntario?.nome ?? "");
                }}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">A definir</option>
                {voluntarios.map((voluntario) => <option key={voluntario.id} value={voluntario.id}>{voluntario.nome}</option>)}
              </select>
            </div>

            <TextField label="Data" type="date" {...register("data")} error={errors.data?.message} />
            <TextField label="Horário" type="time" {...register("horario")} error={errors.horario?.message} />
            <div className="md:col-span-2">
              <TextField label="Objetivo" {...register("objetivo")} error={errors.objetivo?.message} />
            </div>
            <div className="md:col-span-2">
              <TextAreaField label="Observações" rows={4} {...register("observacoes")} error={errors.observacoes?.message} />
            </div>
          </div>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Button type="button" onClick={() => router.push("/visitas")} className="bg-slate-500 hover:bg-slate-600">Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Agendando..." : "Agendar visita"}</Button>
        </div>
      </form>
    </div>
  );
}
