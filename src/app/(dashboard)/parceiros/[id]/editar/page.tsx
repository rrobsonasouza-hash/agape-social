"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { ParceiroForm } from "@/modules/parceiros/components/ParceiroForm";
import { useParceiros } from "@/modules/parceiros/hooks/useParceiros";
import { ParceiroFormData } from "@/modules/parceiros/schemas/parceiro.schema";
export default function EditarParceiroPage() { const params = useParams<{id:string}>(); const router = useRouter(); const { buscarPorId, atualizar } = useParceiros(); const [parceiro, setParceiro] = useState<ParceiroFormData|null>(null); useEffect(() => { buscarPorId(params.id).then((p) => p ? setParceiro(p) : router.push("/parceiros")).catch(() => toast.error("Não foi possível carregar o parceiro.")); }, [buscarPorId, params.id, router]); async function salvar(data: ParceiroFormData) { try { await atualizar(params.id, data); toast.success("Parceiro atualizado!"); router.push(`/parceiros/${params.id}`); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar."); } } if (!parceiro) return <div className="py-16 text-center text-slate-500">Carregando parceiro...</div>; return <div className="space-y-6"><PageHeader title="Editar parceiro" description="Atualize os dados e termos da parceria." /><ParceiroForm valoresIniciais={parceiro} onSubmit={salvar} onCancel={() => router.push(`/parceiros/${params.id}`)} /></div>; }
