"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { DoadorForm } from "@/modules/doadores/components/DoadorForm";
import { useDoadores } from "@/modules/doadores/hooks/useDoadores";
import { DoadorFormData } from "@/modules/doadores/schemas/doador.schema";

export default function EditarDoadorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { buscarPorId, atualizar } = useDoadores();
  const [doador, setDoador] = useState<DoadorFormData | null>(null);

  useEffect(() => {
    buscarPorId(params.id).then((dados) => {
      if (!dados) { toast.error("Doador não encontrado."); router.push("/doadores"); return; }
      setDoador(dados);
    }).catch(() => toast.error("Não foi possível carregar o doador."));
  }, [buscarPorId, params.id, router]);

  async function salvar(data: DoadorFormData) {
    try { await atualizar(params.id, data); toast.success("Doador atualizado!"); router.push(`/doadores/${params.id}`); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o doador."); }
  }

  if (!doador) return <div className="py-16 text-center text-slate-500">Carregando doador...</div>;
  return <div className="space-y-6"><PageHeader title="Editar doador" description="Atualize o relacionamento e o perfil de contribuição." /><DoadorForm valoresIniciais={doador} onSubmit={salvar} onCancel={() => router.push(`/doadores/${params.id}`)} /></div>;
}
