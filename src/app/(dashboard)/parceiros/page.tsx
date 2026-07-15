"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/forms/Card";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useParceiros } from "@/modules/parceiros/hooks/useParceiros";
import { ParceiroDocumento } from "@/modules/parceiros/types/parceiro-documento";

export default function ParceirosPage() {
  const { listar } = useParceiros(); const [parceiros, setParceiros] = useState<ParceiroDocumento[]>([]); const [pesquisa, setPesquisa] = useState(""); const [carregando, setCarregando] = useState(true);
  useEffect(() => { listar().then(setParceiros).catch(() => toast.error("Não foi possível carregar os parceiros.")).finally(() => setCarregando(false)); }, [listar]);
  const filtrados = useMemo(() => { const termo = pesquisa.toLowerCase().trim(); return termo ? parceiros.filter((p) => [p.razaoSocial, p.nomeFantasia, p.cnpj, p.responsavel].some((v) => v.toLowerCase().includes(termo))) : parceiros; }, [parceiros, pesquisa]);
  const colunas: DataTableColumn<ParceiroDocumento>[] = [
    { key: "nome", title: "Parceiro", className: "font-medium text-slate-900", render: (p) => p.nomeFantasia || p.razaoSocial },
    { key: "responsavel", title: "Responsável", render: (p) => p.responsavel },
    { key: "tipo", title: "Parceria", render: (p) => p.tipoParceria },
    { key: "status", title: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { key: "acoes", title: "Ações", render: (p) => <Link href={`/parceiros/${p.id}`} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 font-medium text-blue-700"><Eye size={17} /> Visualizar</Link> },
  ];
  return <div className="space-y-6"><PageHeader title="Parceiros" description="Organizações que colaboram com a missão pastoral." actions={<Link href="/parceiros/novo" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white"><Plus size={18} /> Novo parceiro</Link>} /><Card title="Pesquisar"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="search" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} className="w-full rounded-lg border py-3 pl-12 pr-4" placeholder="Organização, CNPJ ou responsável..." /></div></Card><Card title="Parceiros cadastrados"><DataTable data={filtrados} columns={colunas} getRowKey={(p) => p.id} loading={carregando} emptyTitle="Nenhum parceiro cadastrado" /></Card></div>;
}
