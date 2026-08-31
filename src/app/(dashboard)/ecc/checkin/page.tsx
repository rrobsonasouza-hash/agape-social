"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, HeartHandshake, Search, Users } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { useEcc } from "@/modules/ecc/hooks/useEcc";
import type { EccPainel } from "@/modules/ecc/types/ecc.types";

export default function CheckinEccPage() { return <Suspense fallback={<div className="p-10 text-center text-slate-500">Abrindo check-in...</div>}><Checkin /></Suspense>; }

function Checkin() {
  const params = useSearchParams();
  const encontroId = params.get("encontro") ?? "";
  const { listar, registrarCredenciamento, registrarPresencaDia, registrarPresencaEquipe } = useEcc();
  const [dados, setDados] = useState<EccPainel | null>(null);
  const [dia, setDia] = useState("");
  const [tipo, setTipo] = useState<"CASAIS" | "EQUIPE">("CASAIS");
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState("");
  const carregar = useCallback(async () => { try { const resposta = await listar(); setDados(resposta); const edicao = resposta.encontros.find((item) => item.id === encontroId); setDia((atual) => atual || edicao?.dataInicio || ""); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível abrir o check-in."); } }, [encontroId, listar]);
  useEffect(() => { void carregar(); }, [carregar]);
  const edicao = dados?.encontros.find((item) => item.id === encontroId);
  const casais = useMemo(() => (dados?.participacoes ?? []).filter((item) => item.encontroId === encontroId && !["EQUIPE", "COORDENADOR"].includes(item.classificacao) && item.situacao !== "DESISTENTE" && item.casalNome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))), [busca, dados?.participacoes, encontroId]);
  const equipe = useMemo(() => (dados?.equipe ?? []).filter((item) => item.encontroId === encontroId && item.voluntarioNome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))), [busca, dados?.equipe, encontroId]);

  async function checkinCasal(casalId: string) {
    if (!dia || !dados) return toast.error("Selecione o dia do encontro.");
    const atual = dados.credenciamentos.find((item) => item.encontroId === encontroId && item.casalId === casalId);
    setSalvando(casalId);
    try { await registrarCredenciamento({ encontroId, casalId, status: "CREDENCIADO", crachaEntregue: atual?.crachaEntregue ?? false, materialEntregue: atual?.materialEntregue ?? false, restricoesAlimentares: atual?.restricoesAlimentares ?? "", medicamentos: atual?.medicamentos ?? "", contatoEmergencia: atual?.contatoEmergencia ?? "", circulo: atual?.circulo ?? "", observacoes: atual?.observacoes ?? "" }); await registrarPresencaDia({ encontroId, casalId, data: dia, presente: true }); await carregar(); toast.success("Check-in do casal confirmado."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível fazer o check-in."); } finally { setSalvando(""); }
  }
  async function checkinEquipe(equipeId: string) {
    if (!dia) return toast.error("Selecione o dia do encontro.");
    setSalvando(equipeId);
    try { await registrarPresencaEquipe({ encontroId, equipeId, data: dia, presente: true }); await carregar(); toast.success("Presença da equipe confirmada."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível fazer o check-in."); } finally { setSalvando(""); }
  }

  if (!dados) return <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">Carregando check-in...</div>;
  if (!edicao) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-12 text-center text-amber-900">A edição informada não foi encontrada nesta paróquia.</div>;
  const presencasCasais = new Set(dados.presencasDiarias.filter((item) => item.encontroId === encontroId && item.data === dia && item.presente).map((item) => item.casalId));
  const presencasEquipe = new Set(dados.equipePresencas.filter((item) => item.encontroId === encontroId && item.data === dia && item.presente).map((item) => item.equipeId));
  return <main className="mx-auto w-full max-w-5xl space-y-5"><PageHeader title="Check-in do ECC" description={`${edicao.numero}º ECC · ${edicao.nome}`} /><section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4"><label className="grid gap-1 text-sm font-black">Dia do encontro<input type="date" min={edicao.dataInicio} max={edicao.dataFim} value={dia} onChange={(event) => setDia(event.target.value)} className="rounded-xl border px-3 py-2.5 font-normal" /></label><div className="flex rounded-xl bg-slate-100 p-1"><button onClick={() => setTipo("CASAIS")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black ${tipo === "CASAIS" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}><Users size={17} />Casais</button><button onClick={() => setTipo("EQUIPE")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black ${tipo === "EQUIPE" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}><HeartHandshake size={17} />Equipe</button></div></div><label className="relative mt-4 block"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Localizar pelo nome" className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm" /></label></section><section className="space-y-3">{tipo === "CASAIS" ? casais.map((item) => { const presente = presencasCasais.has(item.casalId); return <article key={item.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${presente ? "border-emerald-200 bg-emerald-50" : "bg-white"}`}><div><strong>{item.casalNome}</strong><p className="text-xs text-slate-500">{item.classificacao.toLocaleLowerCase("pt-BR")}</p></div><button disabled={presente || salvando === item.casalId} onClick={() => void checkinCasal(item.casalId)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${presente ? "bg-emerald-100 text-emerald-800" : "bg-blue-600 text-white"}`}><BadgeCheck size={18} />{presente ? "Presente" : "Confirmar check-in"}</button></article>; }) : equipe.map((item) => { const presente = presencasEquipe.has(item.id); return <article key={item.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${presente ? "border-emerald-200 bg-emerald-50" : "bg-white"}`}><div><strong>{item.voluntarioNome}</strong><p className="text-xs text-slate-500">{item.equipe} · {item.funcao}</p></div><button disabled={presente || salvando === item.id} onClick={() => void checkinEquipe(item.id)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${presente ? "bg-emerald-100 text-emerald-800" : "bg-blue-600 text-white"}`}><BadgeCheck size={18} />{presente ? "Presente" : "Confirmar presença"}</button></article>; })}</section></main>;
}
