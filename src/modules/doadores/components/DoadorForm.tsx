"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { FormSection } from "@/components/forms/FormSection";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { TextField } from "@/components/forms/TextField";
import { doadorSchema, DoadorFormData, DoadorFormInput } from "../schemas/doador.schema";

interface DoadorFormProps {
  valoresIniciais?: DoadorFormData;
  onSubmit: (data: DoadorFormData) => Promise<void>;
  onCancel: () => void;
}

const valoresPadrao: DoadorFormInput = {
  nome: "",
  tipoPessoa: "FISICA",
  documento: "",
  telefone: "",
  email: "",
  interesseDoacao: "Cestas básicas e alimentos",
  frequencia: "EVENTUAL",
  observacoes: "",
  status: "ATIVO",
};

export function DoadorForm({ valoresIniciais, onSubmit, onCancel }: DoadorFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DoadorFormInput, unknown, DoadorFormData>({
    resolver: zodResolver(doadorSchema),
    defaultValues: valoresIniciais ?? valoresPadrao,
  });
  const tipoPessoa = watch("tipoPessoa");

  useEffect(() => {
    reset(valoresIniciais ?? valoresPadrao);
  }, [reset, valoresIniciais]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => toast.error("Revise os campos obrigatórios."))}
      className="space-y-6"
      noValidate
    >
      <FormSection title="Identificação" description="Dados da pessoa ou organização doadora.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nome ou razão social" {...register("nome")} error={errors.nome?.message} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Tipo de pessoa</label>
            <select {...register("tipoPessoa")} className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
              <option value="FISICA">Pessoa física</option>
              <option value="JURIDICA">Pessoa jurídica</option>
            </select>
          </div>
          <TextField
            label={tipoPessoa === "JURIDICA" ? "CNPJ" : "CPF"}
            mask={tipoPessoa === "JURIDICA" ? "cnpj" : "cpf"}
            {...register("documento")}
            error={errors.documento?.message}
          />
          <TextField label="Telefone" mask="telefone" {...register("telefone")} error={errors.telefone?.message} />
          <TextField label="E-mail" type="email" {...register("email")} error={errors.email?.message} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select {...register("status")} className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection title="Perfil de doação" description="Preferências para futuras campanhas e contatos.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Principal interesse" {...register("interesseDoacao")} error={errors.interesseDoacao?.message} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Frequência</label>
            <select {...register("frequencia")} className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
              <option value="PONTUAL">Pontual</option>
              <option value="EVENTUAL">Eventual</option>
              <option value="MENSAL">Mensal</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <TextAreaField label="Observações" rows={5} {...register("observacoes")} error={errors.observacoes?.message} />
          </div>
        </div>
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button type="button" onClick={onCancel} disabled={isSubmitting} className="bg-slate-500 hover:bg-slate-600">Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar doador"}</Button>
      </div>
    </form>
  );
}
