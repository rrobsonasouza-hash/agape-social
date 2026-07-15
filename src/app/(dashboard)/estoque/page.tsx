"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, PackageCheck, ShoppingBasket, WalletCards } from "lucide-react";
import toast from "react-hot-toast";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { useEstoque } from "@/modules/estoque/hooks/useEstoque";
import { ResumoEstoque, SaldoItemEstoque } from "@/modules/estoque/types/estoque.types";
import { MovimentacaoCestas } from "@/modules/cestas/types/cestas.types";

const resumoVazio: ResumoEstoque = {
  itens: [], cestasProntas: 0, cestasMontaveis: 0, totalDisponivel: 0,
  investimentoAcumulado: 0, movimentos: [],
};

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatarData(data: string) {
  if (!data) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${data.slice(0, 10)}T00:00:00Z`));
}

export default function EstoquePage() {
  const { obterResumo } = useEstoque();
  const [resumo, setResumo] = useState(resumoVazio);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try { setResumo(await obterResumo()); }
    catch { toast.error("Não foi possível carregar o estoque."); }
    finally { setCarregando(false); }
  }, [obterResumo]);

  useEffect(() => { void carregar(); }, [carregar]);

  const movimentos = useMemo(() => resumo.movimentos.filter((item) => {
    if (filtro === "TODOS") return true;
    if (filtro === "ENTRADAS") return item.operacao !== "SAIDA";
    return item.operacao === "SAIDA";
  }), [filtro, resumo.movimentos]);

  const colunasItens: DataTableColumn<SaldoItemEstoque>[] = [
    { key: "item", title: "Item", render: (item) => <div><p className="font-semibold text-slate-900">{item.nome}</p>{item.necessarioPorCesta === 0 && <p className="text-xs text-slate-500">Fora da composição atual</p>}</div> },
    { key: "saldo", title: "Saldo atual", render: (item) => <span className={item.saldo <= 0 ? "font-semibold text-red-700" : "font-semibold text-slate-900"}>{item.saldo.toLocaleString("pt-BR")} {item.unidade}</span> },
    { key: "cesta", title: "Por cesta", render: (item) => item.necessarioPorCesta ? `${item.necessarioPorCesta} ${item.unidade}` : "—" },
    { key: "cobertura", title: "Cobertura", render: (item) => item.necessarioPorCesta ? `${item.coberturaCestas} cesta(s)` : "—" },
    { key: "situacao", title: "Situação", render: (item) => item.limitante ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"><AlertTriangle size={13} /> Item limitante</span> : <span className="text-slate-500">Regular</span> },
  ];

  const colunasMovimentos: DataTableColumn<MovimentacaoCestas>[] = [
    { key: "data", title: "Data", render: (item) => formatarData(item.data) },
    { key: "movimento", title: "Movimento", render: (item) => <div><p className="font-semibold text-slate-900">{item.tipo === "CESTA_PRONTA" ? "Cesta pronta" : item.itemNome || "Item avulso"}</p><p className="text-xs text-slate-500">{item.observacoes || (item.origem === "DOACAO" ? "Doação" : "Compra da paróquia")}</p></div> },
    { key: "operacao", title: "Operação", render: (item) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.operacao === "SAIDA" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{item.operacao === "SAIDA" ? "Saída" : "Entrada"}</span> },
    { key: "quantidade", title: "Quantidade", render: (item) => <span className="font-semibold">{item.quantidade.toLocaleString("pt-BR")} {item.unidade || (item.tipo === "CESTA_PRONTA" ? "cesta(s)" : "")}</span> },
    { key: "referencia", title: "Referência", render: (item) => item.familiaNome || item.doadorNome || "—" },
    { key: "valor", title: "Valor", render: (item) => item.valorTotal ? moeda.format(item.valorTotal) : "—" },
  ];

  const cards = [
    { label: "Cestas prontas", valor: resumo.cestasProntas, icon: PackageCheck },
    { label: "Podem ser montadas", valor: resumo.cestasMontaveis, icon: ShoppingBasket },
    { label: "Total disponível", valor: resumo.totalDisponivel, icon: Boxes },
    { label: "Investimento da paróquia", valor: moeda.format(resumo.investimentoAcumulado), icon: WalletCards },
  ];

  return <div className="space-y-6">
    <PageHeader title="Estoque" description="Consulte os saldos de itens e cestas, a capacidade de montagem e todo o histórico de movimentações." actions={<Link href="/cestas" className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">Registrar movimentação</Link>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><card.icon className="text-blue-700" /><p className="mt-3 text-3xl font-bold text-slate-900">{card.valor}</p><p className="text-sm text-slate-500">{card.label}</p></div>)}</section>

    <section className="space-y-3">
      <div><h2 className="text-lg font-bold text-slate-900">Saldo por item</h2><p className="text-sm text-slate-500">O item limitante determina quantas novas cestas podem ser montadas.</p></div>
      <DataTable data={resumo.itens} columns={colunasItens} getRowKey={(item) => item.id} loading={carregando} emptyTitle="Composição ainda não cadastrada" emptyDescription="Cadastre os itens da cesta padrão e registre as primeiras entradas." emptyAction={<Link href="/cestas" className="font-semibold text-blue-700">Configurar composição</Link>} />
    </section>

    <section className="space-y-3">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-lg font-bold text-slate-900">Histórico de movimentações</h2><p className="text-sm text-slate-500">Entradas, montagens e entregas registradas no sistema.</p></div><select aria-label="Filtrar movimentos" value={filtro} onChange={(event) => setFiltro(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"><option value="TODOS">Todos</option><option value="ENTRADAS">Entradas</option><option value="SAIDAS">Saídas</option></select></div>
      <DataTable data={movimentos} columns={colunasMovimentos} getRowKey={(item) => item.id} loading={carregando} emptyTitle="Nenhuma movimentação encontrada" emptyDescription="Os lançamentos de doações, compras, montagens e entregas aparecerão aqui." />
    </section>
  </div>;
}
