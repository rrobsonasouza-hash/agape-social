"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Plus, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "@/components/forms/Card";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useVisitas } from "@/modules/visitas/hooks/useVisitas";
import { VisitaDocumento } from "@/modules/visitas/types/visita-documento";

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : data;
}

export default function VisitasPage() {
  const { listar, alterarStatus } = useVisitas();
  const [visitas, setVisitas] = useState<VisitaDocumento[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setVisitas(await listar());
    } catch (error) {
      console.error("Erro ao carregar visitas:", error);
      toast.error("Não foi possível carregar as visitas.");
    } finally {
      setCarregando(false);
    }
  }, [listar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function atualizarStatus(visita: VisitaDocumento, status: "REALIZADA" | "CANCELADA") {
    try {
      await alterarStatus(visita.id, status);
      setVisitas((atuais) =>
        atuais.map((item) => item.id === visita.id ? { ...item, status } : item)
      );
      toast.success(status === "REALIZADA" ? "Visita concluída!" : "Visita cancelada.");
    } catch {
      toast.error("Não foi possível atualizar a visita.");
    }
  }

  const colunas: DataTableColumn<VisitaDocumento>[] = [
    {
      key: "data",
      title: "Data",
      render: (visita) => <span className="font-medium text-slate-900">{formatarData(visita.data)} às {visita.horario}</span>,
    },
    { key: "familia", title: "Família", render: (visita) => visita.familiaNome },
    { key: "responsavel", title: "Responsável", render: (visita) => visita.voluntarioNome || "A definir" },
    { key: "objetivo", title: "Objetivo", render: (visita) => visita.objetivo },
    { key: "status", title: "Status", render: (visita) => <StatusBadge status={visita.status} /> },
    {
      key: "acoes",
      title: "Ações",
      render: (visita) => visita.status === "AGENDADA" ? (
        <div className="flex gap-2">
          <button type="button" onClick={() => atualizarStatus(visita, "REALIZADA")} className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100">
            <CheckCircle2 size={15} /> Concluir
          </button>
          <button type="button" onClick={() => atualizarStatus(visita, "CANCELADA")} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">
            <XCircle size={15} /> Cancelar
          </button>
        </div>
      ) : <span className="text-xs text-slate-400">Finalizada</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitas"
        description="Agendamento e acompanhamento das visitas pastorais."
        actions={
          <Link href="/visitas/nova" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
            <Plus size={18} /> Agendar visita
          </Link>
        }
      />
      <Card title="Agenda pastoral">
        <DataTable
          data={visitas}
          columns={colunas}
          getRowKey={(visita) => visita.id}
          loading={carregando}
          loadingMessage="Carregando visitas..."
          emptyTitle="Nenhuma visita agendada"
          emptyDescription="Agende o primeiro acompanhamento pastoral."
          emptyAction={<Link href="/visitas/nova" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white"><Plus size={18} /> Agendar visita</Link>}
        />
      </Card>
    </div>
  );
}
