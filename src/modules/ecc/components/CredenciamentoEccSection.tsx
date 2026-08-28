"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Check, Clock3, PackageCheck, Search, UserRoundX } from "lucide-react";
import toast from "react-hot-toast";
import { useEcc } from "../hooks/useEcc";
import type { EccCredenciamentoFormData } from "../schemas/ecc.schema";
import type { EccCasal, EccCredenciamento, EccCredenciamentoStatus, EccParticipacao } from "../types/ecc.types";

type Props = {
  encontroId: string;
  participacoes: EccParticipacao[];
  casais: EccCasal[];
  credenciamentos: EccCredenciamento[];
  onSaved: () => Promise<void>;
};

const nomesStatus: Record<EccCredenciamentoStatus, string> = { AGUARDANDO: "Aguardando", CREDENCIADO: "Presente", AUSENTE: "Ausente", CANCELADO: "Cancelado" };
const coresStatus: Record<EccCredenciamentoStatus, string> = { AGUARDANDO: "bg-amber-100 text-amber-800", CREDENCIADO: "bg-emerald-100 text-emerald-700", AUSENTE: "bg-red-100 text-red-700", CANCELADO: "bg-slate-100 text-slate-600" };
const normalizar = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function CredenciamentoEccSection({ encontroId, participacoes, casais, credenciamentos, onSaved }: Props) {
  const { registrarCredenciamento } = useEcc();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<EccCredenciamentoStatus | "TODOS">("TODOS");
  const [salvando, setSalvando] = useState("");
  const participantes = useMemo(() => participacoes.filter((item) => !["EQUIPE", "COORDENADOR"].includes(item.classificacao)), [participacoes]);
  const registros = useMemo(() => new Map(credenciamentos.filter((item) => item.encontroId === encontroId).map((item) => [item.casalId, item])), [credenciamentos, encontroId]);
  const linhas = useMemo(() => participantes.map((participacao) => ({
    participacao,
    casal: casais.find((item) => item.id === participacao.casalId),
    registro: registros.get(participacao.casalId),
    status: registros.get(participacao.casalId)?.status ?? "AGUARDANDO" as EccCredenciamentoStatus,
  })).filter((item) => {
    const termo = normalizar(busca);
    return (!termo || normalizar(`${item.participacao.casalNome} ${item.casal?.telefone ?? ""}`).includes(termo)) && (filtro === "TODOS" || item.status === filtro);
  }).sort((a, b) => a.participacao.casalNome.localeCompare(b.participacao.casalNome, "pt-BR")), [busca, casais, filtro, participantes, registros]);

  const presentes = participantes.filter((item) => registros.get(item.casalId)?.status === "CREDENCIADO").length;
  const ausentes = participantes.filter((item) => registros.get(item.casalId)?.status === "AUSENTE").length;
  const aguardando = participantes.length - presentes - ausentes - participantes.filter((item) => registros.get(item.casalId)?.status === "CANCELADO").length;

  async function salvar(casalId: string, alteracoes: Partial<EccCredenciamentoFormData>) {
    const atual = registros.get(casalId);
    const dados: EccCredenciamentoFormData = {
      encontroId, casalId, status: atual?.status ?? "AGUARDANDO",
      crachaEntregue: atual?.crachaEntregue ?? false, materialEntregue: atual?.materialEntregue ?? false,
      observacoes: atual?.observacoes ?? "", ...alteracoes,
    };
    setSalvando(casalId);
    try { await registrarCredenciamento(dados); await onSaved(); toast.success(dados.status === "CREDENCIADO" ? "Chegada do casal registrada." : "Credenciamento atualizado."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o credenciamento."); }
    finally { setSalvando(""); }
  }

  return <section className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase text-slate-500">Casais esperados</p><strong className="text-3xl">{participantes.length}</strong></article>
      <article className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase text-emerald-700">Presentes</p><strong className="text-3xl">{presentes}</strong></article>
      <article className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase text-amber-700">Aguardando</p><strong className="text-3xl">{aguardando}</strong></article>
      <article className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase text-red-700">Ausentes</p><strong className="text-3xl">{ausentes}</strong></article>
    </div>

    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-black">Recepção dos casais</h2><p className="text-sm text-slate-500">Busque pelo nome ou telefone e registre a chegada com um toque.</p></div><div className="flex flex-1 flex-wrap gap-2 sm:flex-none"><label className="relative min-w-56 flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm" placeholder="Buscar casal" value={busca} onChange={(e) => setBusca(e.target.value)} /></label><select className="rounded-xl border bg-white px-3 py-2.5 text-sm font-bold" value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)}><option value="TODOS">Todos</option>{Object.entries(nomesStatus).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></div></div>
      <div className="mt-5 space-y-3">{linhas.map(({ participacao, casal, registro, status }) => <article key={participacao.id} className={`rounded-2xl border p-4 ${status === "CREDENCIADO" ? "border-emerald-200 bg-emerald-50/40" : "bg-white"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-base">{participacao.casalNome}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-black ${coresStatus[status]}`}>{nomesStatus[status]}</span></div><p className="mt-1 text-xs text-slate-500">{casal?.telefone || "Telefone não informado"}{registro?.credenciadoEm && ` · chegada às ${new Date(registro.credenciadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}</p></div><div className="flex flex-wrap gap-2">{status !== "CREDENCIADO" && <button disabled={salvando === participacao.casalId} onClick={() => void salvar(participacao.casalId, { status: "CREDENCIADO" })} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"><BadgeCheck size={17} />Registrar chegada</button>}{status === "CREDENCIADO" && <button disabled={salvando === participacao.casalId} onClick={() => void salvar(participacao.casalId, { status: "AGUARDANDO", crachaEntregue: false, materialEntregue: false })} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black"><Clock3 size={17} />Desfazer</button>}<button disabled={salvando === participacao.casalId} onClick={() => void salvar(participacao.casalId, { status: "AUSENTE" })} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-black text-red-700"><UserRoundX size={17} />Ausente</button></div></div>
        <div className="mt-4 flex flex-wrap gap-3 border-t pt-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold"><input type="checkbox" checked={registro?.crachaEntregue ?? false} onChange={(e) => void salvar(participacao.casalId, { crachaEntregue: e.target.checked })} /><Check size={15} />Crachá entregue</label><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold"><input type="checkbox" checked={registro?.materialEntregue ?? false} onChange={(e) => void salvar(participacao.casalId, { materialEntregue: e.target.checked })} /><PackageCheck size={16} />Material entregue</label></div>
      </article>)}{!linhas.length && <p className="py-12 text-center text-slate-500">Nenhum casal encontrado neste filtro.</p>}</div>
    </div>
  </section>;
}
