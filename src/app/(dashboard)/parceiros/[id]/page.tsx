"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, CalendarRange, Handshake, Pencil, Power, RotateCcw, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/forms/Button";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileMetrics } from "@/components/profile/ProfileMetrics";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { Timeline } from "@/components/profile/Timeline";
import { useParceiros } from "@/modules/parceiros/hooks/useParceiros";
import { ParceiroDocumento } from "@/modules/parceiros/types/parceiro-documento";

function data(valor?: string) { return valor ? valor.split("-").reverse().join("/") : "Não definida"; }
export default function DetalhesParceiroPage() {
  const params = useParams<{id:string}>(); const router = useRouter(); const { buscarPorId, alterarStatus } = useParceiros(); const [parceiro, setParceiro] = useState<ParceiroDocumento|null>(null);
  useEffect(() => { buscarPorId(params.id).then((p) => p ? setParceiro(p) : router.push("/parceiros")).catch(() => toast.error("Não foi possível carregar o parceiro.")); }, [buscarPorId, params.id, router]);
  async function alternar() { if (!parceiro) return; const status = parceiro.status === "ATIVO" ? "INATIVO" : "ATIVO"; await alterarStatus(parceiro.id, status); setParceiro({...parceiro,status}); toast.success("Status atualizado!"); }
  if (!parceiro) return <div className="py-16 text-center text-slate-500">Carregando parceiro...</div>;
  return <div className="space-y-6"><button onClick={() => router.push("/parceiros")} className="inline-flex items-center gap-2 text-sm font-medium text-blue-700"><ArrowLeft size={18}/> Voltar para parceiros</button><ProfileHeader title={parceiro.nomeFantasia || parceiro.razaoSocial} subtitle={parceiro.razaoSocial} status={parceiro.status} phone={parceiro.telefone} email={parceiro.email || undefined} actions={<><Button onClick={() => router.push(`/parceiros/${parceiro.id}/editar`)} className="flex items-center gap-2"><Pencil size={18}/> Editar</Button><Button onClick={alternar} className={`flex items-center gap-2 ${parceiro.status === "ATIVO" ? "bg-amber-600" : "bg-green-600"}`}>{parceiro.status === "ATIVO" ? <Power size={18}/> : <RotateCcw size={18}/>} {parceiro.status === "ATIVO" ? "Inativar" : "Reativar"}</Button></>} /><ProfileMetrics items={[{label:"Parceria",value:parceiro.tipoParceria,icon:Handshake},{label:"Responsável",value:parceiro.responsavel,icon:UserRound},{label:"Início",value:data(parceiro.inicioVigencia),icon:CalendarRange},{label:"Organização",value:parceiro.nomeFantasia || parceiro.razaoSocial,icon:Building2}]} /><ProfileSection title="Termos da parceria" description="Contribuições e período de vigência."><dl className="grid gap-5 md:grid-cols-2"><div><dt className="text-sm text-slate-500">CNPJ</dt><dd className="font-medium">{parceiro.cnpj}</dd></div><div><dt className="text-sm text-slate-500">Vigência</dt><dd className="font-medium">{data(parceiro.inicioVigencia)} a {data(parceiro.fimVigencia)}</dd></div><div className="md:col-span-2"><dt className="text-sm text-slate-500">Contribuição</dt><dd className="mt-1 whitespace-pre-line">{parceiro.contrapartida}</dd></div><div className="md:col-span-2"><dt className="text-sm text-slate-500">Observações</dt><dd className="mt-1 whitespace-pre-line">{parceiro.observacoes || "Nenhuma observação."}</dd></div></dl></ProfileSection><ProfileSection title="Histórico da parceria" description="Ações, eventos e benefícios realizados em conjunto."><Timeline items={[]} emptyTitle="Nenhuma atividade vinculada." emptyDescription="As ações serão exibidas aqui quando registradas." /></ProfileSection></div>;
}
