"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/forms/Button";
import { FormSection } from "@/components/forms/FormSection";
import { TextField } from "@/components/forms/TextField";
import { MapaOpenStreetMap } from "@/components/maps/MapaOpenStreetMap";
import { PageHeader } from "@/components/ui/PageHeader";
import { useEndereco } from "@/modules/enderecos/hooks/useEndereco";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";
import { paroquiaSchema, ParoquiaFormData, ParoquiaFormInput } from "@/modules/paroquias/schemas/paroquia.schema";

export default function NovaParoquiaPage() {
  const router = useRouter(); const { criar } = useParoquia(false); const { buscarPorCep, consultandoCep } = useEndereco();
  const { register, handleSubmit, getValues, setValue, watch, formState: { errors, isSubmitting } } = useForm<ParoquiaFormInput, unknown, ParoquiaFormData>({ resolver: zodResolver(paroquiaSchema), defaultValues: { nome: "", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", latitude: 0, longitude: 0, raioAtendimentoKm: 10 } });
  const latitude = Number(watch("latitude")); const longitude = Number(watch("longitude")); const raio = Number(watch("raioAtendimentoKm")) || 0;
  function posicao(lat: number, lng: number) { setValue("latitude", lat, { shouldValidate: true }); setValue("longitude", lng, { shouldValidate: true }); }
  async function consultarCep() { try { const e = await buscarPorCep(getValues("cep")); setValue("cep", e.cep); setValue("logradouro", e.logradouro); setValue("complemento", e.complemento); setValue("bairro", e.bairro); setValue("cidade", e.cidade); setValue("estado", e.estado); if (e.latitude !== undefined && e.longitude !== undefined) posicao(e.latitude, e.longitude); toast.success("Endereço preenchido. Confirme o ponto no mapa."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível consultar o CEP."); } }
  async function salvar(data: ParoquiaFormData) { try { await criar(data); toast.success("Paróquia cadastrada com sucesso."); router.push("/paroquias"); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar a paróquia."); } }
  return <div className="space-y-6"><PageHeader title="Nova paróquia" description="Cadastre a sede, localização e raio de atendimento da nova unidade." /><form onSubmit={handleSubmit(salvar)} className="space-y-6"><FormSection title="Identificação e endereço"><div className="grid gap-4 md:grid-cols-2"><TextField label="Nome da paróquia" {...register("nome")} error={errors.nome?.message} /><div><TextField label="CEP" mask="cep" {...register("cep")} error={errors.cep?.message} /><button type="button" onClick={consultarCep} disabled={consultandoCep} className="mt-2 text-sm font-medium text-blue-700">{consultandoCep ? "Consultando..." : "Buscar endereço e ponto"}</button></div><TextField label="Logradouro" {...register("logradouro")} error={errors.logradouro?.message} /><TextField label="Número" {...register("numero")} error={errors.numero?.message} /><TextField label="Complemento" {...register("complemento")} /><TextField label="Bairro" {...register("bairro")} error={errors.bairro?.message} /><TextField label="Cidade" {...register("cidade")} error={errors.cidade?.message} /><TextField label="Estado" maxLength={2} {...register("estado")} error={errors.estado?.message} /><TextField label="Raio de atendimento (km)" type="number" min={0.1} step={0.1} {...register("raioAtendimentoKm")} error={errors.raioAtendimentoKm?.message} /></div></FormSection><FormSection title="Localização"><p className="mb-3 text-sm text-slate-500">Clique no mapa para marcar exatamente a sede da igreja.</p><MapaOpenStreetMap latitude={latitude || null} longitude={longitude || null} interactive onPositionChange={posicao} referenceLatitude={latitude || null} referenceLongitude={longitude || null} radiusKm={raio} />{errors.latitude?.message && <p className="mt-2 text-sm text-red-600">{errors.latitude.message}</p>}</FormSection><div className="flex justify-end gap-3"><button type="button" onClick={() => router.push("/paroquias")} className="rounded-lg border px-4 py-3">Cancelar</button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Cadastrar paróquia"}</Button></div></form></div>;
}
