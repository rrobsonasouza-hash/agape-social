"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/forms/Card";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDoadores } from "@/modules/doadores/hooks/useDoadores";
import { DoadorDocumento } from "@/modules/doadores/types/doador-documento";

export default function DoadoresPage() {
  const { listar } = useDoadores();
  const [doadores, setDoadores] = useState<DoadorDocumento[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    listar().then(setDoadores).catch(() => toast.error("Não foi possível carregar os doadores.")).finally(() => setCarregando(false));
  }, [listar]);

  const filtrados = useMemo(() => {
    const termo = pesquisa.toLowerCase().trim();
    return termo ? doadores.filter((doador) => [doador.nome, doador.documento, doador.telefone].some((valor) => valor.toLowerCase().includes(termo))) : doadores;
  }, [doadores, pesquisa]);

  const colunas: DataTableColumn<DoadorDocumento>[] = [
    { key: "nome", title: "Doador", className: "font-medium text-slate-900", render: (doador) => doador.nome },
    { key: "tipo", title: "Tipo", render: (doador) => doador.tipoPessoa === "FISICA" ? "Pessoa física" : "Pessoa jurídica" },
    { key: "telefone", title: "Telefone", render: (doador) => doador.telefone },
    { key: "interesse", title: "Interesse", render: (doador) => doador.interesseDoacao },
    { key: "status", title: "Status", render: (doador) => <StatusBadge status={doador.status} /> },
    { key: "acoes", title: "Ações", render: (doador) => <Link href={`/doadores/${doador.id}`} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 font-medium text-blue-700 hover:bg-blue-50"><Eye size={17} /> Visualizar</Link> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Doadores" description="Relacionamento com pessoas e organizações que apoiam a missão pastoral." actions={<Link href="/doadores/novo" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white"><Plus size={18} /> Novo doador</Link>} />
      <Card title="Pesquisar"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="search" value={pesquisa} onChange={(event) => setPesquisa(event.target.value)} placeholder="Nome, documento ou telefone..." className="w-full rounded-lg border border-slate-300 py-3 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" /></div></Card>
      <Card title="Doadores cadastrados"><DataTable data={filtrados} columns={colunas} getRowKey={(doador) => doador.id} loading={carregando} emptyTitle="Nenhum doador cadastrado" emptyDescription="Cadastre o primeiro apoiador da missão pastoral." /></Card>
    </div>
  );
}
