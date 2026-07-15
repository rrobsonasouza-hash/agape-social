"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/forms/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { useAuditoria } from "@/modules/auditoria/hooks/useAuditoria";
import { AuditoriaDocumento } from "@/modules/auditoria/types/auditoria-documento";

function dataHora(valor: AuditoriaDocumento["data"]) {
  if (!valor) return "Processando...";
  const data = valor instanceof Date ? valor : valor.toDate?.();
  return data ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(data) : "—";
}

export default function AuditoriaPage() {
  const { listar } = useAuditoria(); const [registros, setRegistros] = useState<AuditoriaDocumento[]>([]); const [pesquisa, setPesquisa] = useState(""); const [carregando, setCarregando] = useState(true);
  const carregar = useCallback(async () => { setCarregando(true); try { setRegistros(await listar()); } catch { toast.error("Não foi possível carregar a auditoria."); } finally { setCarregando(false); } }, [listar]);
  useEffect(() => { void carregar(); }, [carregar]);
  const filtrados = useMemo(() => { const termo = pesquisa.toLowerCase().trim(); return termo ? registros.filter((item) => [item.acao, item.entidade, item.descricao, item.usuarioNome, item.usuarioEmail].some((valor) => valor.toLowerCase().includes(termo))) : registros; }, [pesquisa, registros]);
  const colunas: DataTableColumn<AuditoriaDocumento>[] = [
    { key: "data", title: "Data e hora", render: (item) => dataHora(item.data) },
    { key: "usuario", title: "Responsável", render: (item) => <div><p className="font-semibold text-slate-900">{item.usuarioNome}</p><p className="text-xs text-slate-500">{item.usuarioEmail}</p></div> },
    { key: "acao", title: "Ação", render: (item) => <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">{item.acao}</span> },
    { key: "entidade", title: "Área", render: (item) => item.entidade },
    { key: "descricao", title: "Detalhes", render: (item) => item.descricao },
  ];
  return <div className="space-y-6"><PageHeader title="Auditoria" description="Consulte as operações administrativas realizadas no sistema." /><Card title="Pesquisar no histórico"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="search" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} className="w-full rounded-lg border py-3 pl-12 pr-4" placeholder="Responsável, ação, área ou detalhes..." /></div></Card><Card title="Histórico de operações"><DataTable data={filtrados} columns={colunas} getRowKey={(item) => item.id} loading={carregando} emptyTitle="Nenhuma operação auditada" emptyDescription="As próximas alterações administrativas serão registradas aqui." /></Card></div>;
}
