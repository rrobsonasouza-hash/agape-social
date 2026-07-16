"use client";
import { useState } from "react";
import { Database, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/forms/Card";
import { auth } from "@/lib/firebase/auth";

export default function MigracaoPage() {
  const [executando, setExecutando] = useState(false); const [resultado, setResultado] = useState<Record<string, number> | null>(null);
  async function migrar() {
    const token = await auth.currentUser?.getIdToken(); if (!token) return toast.error("Sessão expirada."); setExecutando(true);
    try { const resposta = await fetch("/api/migracao", { method: "POST", headers: { Authorization: `Bearer ${token}` } }); const dados = await resposta.json(); if (!resposta.ok) throw new Error(dados.erro); setResultado(dados.resultado); toast.success("Cópia para o Supabase concluída."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Falha na migração."); }
    finally { setExecutando(false); }
  }
  return <div className="space-y-6"><PageHeader title="Migração para Supabase" description="Copie os dados do Firebase para o PostgreSQL sem remover a origem." /><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex gap-3"><ShieldCheck className="shrink-0" size={20} /><p>Esta operação somente copia dados. O Firebase permanecerá intacto até a conferência e o corte definitivo.</p></div></div><Card title="Cópia controlada"><div className="space-y-4"><p className="text-sm text-slate-600">A operação pode ser repetida: registros com o mesmo identificador serão atualizados, sem duplicação.</p><button onClick={() => void migrar()} disabled={executando} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60"><Database size={18} />{executando ? "Migrando..." : "Copiar dados para o Supabase"}</button></div></Card>{resultado && <Card title="Resultado da última cópia"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(resultado).map(([tabela, total]) => <div key={tabela} className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-500">{tabela.replaceAll("_", " ")}</p><p className="mt-1 text-2xl font-bold text-slate-900">{total}</p></div>)}</div></Card>}</div>;
}
