"use client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { ParceiroForm } from "@/modules/parceiros/components/ParceiroForm";
import { useParceiros } from "@/modules/parceiros/hooks/useParceiros";
import { ParceiroFormData } from "@/modules/parceiros/schemas/parceiro.schema";
export default function NovoParceiroPage() { const router = useRouter(); const { criar } = useParceiros(); async function salvar(data: ParceiroFormData) { try { await criar(data); toast.success("Parceiro cadastrado!"); router.push("/parceiros"); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar."); } } return <div className="space-y-6"><PageHeader title="Novo parceiro" description="Cadastre uma organização parceira da Pastoral Social." /><ParceiroForm onSubmit={salvar} onCancel={() => router.push("/parceiros")} /></div>; }
