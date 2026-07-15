"use client";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/forms/Button";
import { FormSection } from "@/components/forms/FormSection";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { TextField } from "@/components/forms/TextField";
import { parceiroSchema, ParceiroFormData, ParceiroFormInput } from "../schemas/parceiro.schema";
import { tiposParceria } from "../config/tipos-parceria";

interface Props { valoresIniciais?: ParceiroFormData; onSubmit: (data: ParceiroFormData) => Promise<void>; onCancel: () => void; }
const padrao: ParceiroFormInput = { razaoSocial: "", nomeFantasia: "", cnpj: "", responsavel: "", telefone: "", email: "", tipoParceria: "Prestação de serviços", contrapartida: "", inicioVigencia: "", fimVigencia: "", observacoes: "", status: "ATIVO" };

export function ParceiroForm({ valoresIniciais, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ParceiroFormInput, unknown, ParceiroFormData>({ resolver: zodResolver(parceiroSchema), defaultValues: valoresIniciais ?? padrao });
  useEffect(() => reset(valoresIniciais ?? padrao), [reset, valoresIniciais]);
  return <form onSubmit={handleSubmit(onSubmit, () => toast.error("Revise os campos obrigatórios."))} className="space-y-6" noValidate>
    <FormSection title="Organização" description="Identificação da instituição parceira."><div className="grid gap-4 md:grid-cols-2"><TextField label="Razão social" {...register("razaoSocial")} error={errors.razaoSocial?.message} /><TextField label="Nome fantasia" {...register("nomeFantasia")} error={errors.nomeFantasia?.message} /><TextField label="CNPJ" mask="cnpj" {...register("cnpj")} error={errors.cnpj?.message} /><div className="space-y-2"><label className="block text-sm font-medium text-slate-700">Status</label><select {...register("status")} className="w-full rounded-lg border px-4 py-3"><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option></select></div></div></FormSection>
    <FormSection title="Contato" description="Responsável pelo relacionamento com a paróquia."><div className="grid gap-4 md:grid-cols-2"><TextField label="Pessoa responsável" {...register("responsavel")} error={errors.responsavel?.message} /><TextField label="Telefone" mask="telefone" {...register("telefone")} error={errors.telefone?.message} /><TextField label="E-mail" type="email" {...register("email")} error={errors.email?.message} /></div></FormSection>
    <FormSection title="Termos da parceria" description="Finalidade, contribuição e período de vigência."><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><label className="block text-sm font-medium text-slate-700">Tipo de parceria</label><select {...register("tipoParceria")} className={`w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${errors.tipoParceria ? "border-red-500" : "border-slate-300"}`}><option value="">Selecione o tipo</option>{!tiposParceria.includes((valoresIniciais?.tipoParceria ?? padrao.tipoParceria) as typeof tiposParceria[number]) && valoresIniciais?.tipoParceria && <option value={valoresIniciais.tipoParceria}>{valoresIniciais.tipoParceria}</option>}{tiposParceria.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}</select>{errors.tipoParceria?.message && <p className="text-sm text-red-600">{errors.tipoParceria.message}</p>}</div><TextField label="Início da vigência" type="date" {...register("inicioVigencia")} error={errors.inicioVigencia?.message} /><TextField label="Fim da vigência" type="date" {...register("fimVigencia")} error={errors.fimVigencia?.message} /><div className="md:col-span-2"><TextAreaField label="Contribuição ou contrapartida" rows={4} {...register("contrapartida")} error={errors.contrapartida?.message} /></div><div className="md:col-span-2"><TextAreaField label="Observações" rows={4} {...register("observacoes")} error={errors.observacoes?.message} /></div></div></FormSection>
    <div className="flex justify-end gap-3"><Button type="button" onClick={onCancel} className="bg-slate-500 hover:bg-slate-600">Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar parceiro"}</Button></div>
  </form>;
}
