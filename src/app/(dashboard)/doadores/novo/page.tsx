"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { DoadorForm } from "@/modules/doadores/components/DoadorForm";
import { useDoadores } from "@/modules/doadores/hooks/useDoadores";
import { DoadorFormData } from "@/modules/doadores/schemas/doador.schema";

export default function NovoDoadorPage() {
  const router = useRouter();
  const { criar } = useDoadores();
  async function salvar(data: DoadorFormData) {
    try { await criar(data); toast.success("Doador cadastrado com sucesso!"); router.push("/doadores"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar o doador."); }
  }
  return <div className="space-y-6"><PageHeader title="Novo doador" description="Cadastre uma pessoa ou organização apoiadora." /><DoadorForm onSubmit={salvar} onCancel={() => router.push("/doadores")} /></div>;
}
