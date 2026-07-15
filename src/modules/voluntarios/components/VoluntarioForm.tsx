"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { CheckboxField } from "@/components/forms/CheckboxField";
import { DateField } from "@/components/forms/DateField";
import { FormSection } from "@/components/forms/FormSection";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { TextField } from "@/components/forms/TextField";

import {
  voluntarioSchema,
  VoluntarioFormData,
} from "../schemas/voluntario.schema";

interface VoluntarioFormProps {
  valoresIniciais?: VoluntarioFormData;
  textoBotao?: string;
  textoSalvando?: string;
  onSubmit: (data: VoluntarioFormData) => Promise<void>;
  onCancel: () => void;
}

const valoresPadrao: VoluntarioFormData = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  dataNascimento: "",
  pastoral: "Pastoral Social",
  funcao: "Voluntário",
  dataIngresso: "",
  disponibilidade: {
    segunda: false,
    terca: false,
    quarta: false,
    quinta: false,
    sexta: false,
    sabado: false,
    domingo: false,
  },
  observacoes: "",
  status: "ATIVO",
};

export function VoluntarioForm({
  valoresIniciais,
  textoBotao = "Salvar Voluntário",
  textoSalvando = "Salvando...",
  onSubmit,
  onCancel,
}: VoluntarioFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<VoluntarioFormData>({
    resolver: zodResolver(voluntarioSchema),
    defaultValues: valoresIniciais ?? valoresPadrao,
  });

  useEffect(() => {
    reset(valoresIniciais ?? valoresPadrao);
  }, [reset, valoresIniciais]);

  async function enviarFormulario(
    data: VoluntarioFormData
  ) {
    await onSubmit(data);
  }

  function erroFormulario() {
    toast.error(
      "Revise os campos obrigatórios do formulário."
    );
  }

  return (
    <form
      onSubmit={handleSubmit(
        enviarFormulario,
        erroFormulario
      )}
      className="space-y-6"
      noValidate
    >
      <FormSection
        title="Dados pessoais"
        description="Informações básicas para identificação e contato."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Nome completo"
            placeholder="Nome do voluntário"
            {...register("nome")}
            error={errors.nome?.message}
          />

          <TextField
            label="CPF"
            placeholder="000.000.000-00"
            mask="cpf"
            inputMode="numeric"
            {...register("cpf")}
            error={errors.cpf?.message}
          />

          <TextField
            label="Telefone"
            placeholder="(11) 98765-4321"
            mask="telefone"
            inputMode="numeric"
            {...register("telefone")}
            error={errors.telefone?.message}
          />

          <TextField
            label="E-mail"
            type="email"
            placeholder="email@provedor.com"
            {...register("email")}
            error={errors.email?.message}
          />

          <DateField
            label="Data de nascimento"
            {...register("dataNascimento")}
            error={errors.dataNascimento?.message}
          />
        </div>
      </FormSection>

      <FormSection
        title="Atuação pastoral"
        description="Informe onde e como o voluntário atua na paróquia."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Pastoral ou área de atuação"
            placeholder="Ex.: Pastoral Social"
            {...register("pastoral")}
            error={errors.pastoral?.message}
          />

          <TextField
            label="Função"
            placeholder="Ex.: Coordenador ou voluntário"
            {...register("funcao")}
            error={errors.funcao?.message}
          />

          <DateField
            label="Data de ingresso"
            {...register("dataIngresso")}
            error={errors.dataIngresso?.message}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              {...register("status")}
              className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                errors.status
                  ? "border-red-500"
                  : "border-slate-300"
              }`}
            >
              <option value="ATIVO">
                Ativo
              </option>

              <option value="INATIVO">
                Inativo
              </option>
            </select>

            {errors.status?.message && (
              <p className="text-sm text-red-600">
                {errors.status.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Disponibilidade"
        description="Selecione os dias em que o voluntário normalmente está disponível."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CheckboxField
            label="Segunda-feira"
            {...register(
              "disponibilidade.segunda"
            )}
          />

          <CheckboxField
            label="Terça-feira"
            {...register(
              "disponibilidade.terca"
            )}
          />

          <CheckboxField
            label="Quarta-feira"
            {...register(
              "disponibilidade.quarta"
            )}
          />

          <CheckboxField
            label="Quinta-feira"
            {...register(
              "disponibilidade.quinta"
            )}
          />

          <CheckboxField
            label="Sexta-feira"
            {...register(
              "disponibilidade.sexta"
            )}
          />

          <CheckboxField
            label="Sábado"
            {...register(
              "disponibilidade.sabado"
            )}
          />

          <CheckboxField
            label="Domingo"
            {...register(
              "disponibilidade.domingo"
            )}
          />
        </div>
      </FormSection>

      <FormSection
        title="Observações"
        description="Registre informações relevantes sobre a atuação do voluntário."
      >
        <TextAreaField
          label="Observações"
          rows={5}
          placeholder="Experiência, áreas de interesse, limitações de horário ou outras informações."
          {...register("observacoes")}
          error={errors.observacoes?.message}
        />
      </FormSection>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          className="bg-slate-500 hover:bg-slate-600"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? textoSalvando
            : textoBotao}
        </Button>
      </div>
    </form>
  );
}