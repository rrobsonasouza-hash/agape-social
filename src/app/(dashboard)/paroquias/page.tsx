"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";
import { ParoquiaDocumento } from "@/modules/paroquias/types/paroquia-documento";

export default function ParoquiasPage() {
  const { listar, alterarStatus } = useParoquia(false); const [paroquias, setParoquias] = useState<ParoquiaDocumento[]>([]); const [carregando, setCarregando] = useState(true);
  const carregar = useCallback(async () => { setCarregando(true); try { setParoquias(await listar()); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível carregar as paróquias."); } finally { setCarregando(false); } }, [listar]);
  useEffect(() => { void carregar(); }, [carregar]);
  async function status(item: ParoquiaDocumento) { try { await alterarStatus(item.id, !item.ativa); toast.success(item.ativa ? "Paróquia desativada." : "Paróquia ativada."); await carregar(); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível alterar o status."); } }
  return <div className="space-y-6"><PageHeader title="Paróquias" description="Administre as unidades atendidas pela plataforma." /><div className="flex justify-end"><Link href="/paroquias/nova" className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white">Nova paróquia</Link></div>{carregando ? <p className="py-12 text-center text-slate-500">Carregando...</p> : <div className="grid gap-4 md:grid-cols-2">{paroquias.map((item) => <article key={item.id} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-slate-900">{item.nome}</h2><p className="mt-1 text-sm text-slate-500">{item.logradouro}, {item.numero} — {item.cidade}/{item.estado}</p><p className="mt-1 text-sm text-slate-500">Raio: {item.raioAtendimentoKm} km</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.ativa ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.ativa ? "Ativa" : "Inativa"}</span></div><button type="button" onClick={() => status(item)} className="mt-4 text-sm font-medium text-blue-700">{item.ativa ? "Desativar" : "Ativar"}</button></article>)}</div>}</div>;
}
