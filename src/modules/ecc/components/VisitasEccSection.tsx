"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CalendarCheck, CheckCircle2, ClipboardList, Pencil, Plus, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { useEcc } from "../hooks/useEcc";
import type { EccVisitaFormData } from "../schemas/ecc.schema";
import type { EccCasal, EccParticipacao, EccVisita, EccVisitaStatus, EccVoluntarioResumo } from "../types/ecc.types";

type Props = {
  encontroId: string;
  participacoes: EccParticipacao[];
  casais: EccCasal[];
  voluntarios: EccVoluntarioResumo[];
  visitas: EccVisita[];
  onSaved: () => Promise<void>;
};

const hoje = new Date().toISOString().slice(0, 10);
const questionarioVazio = {
  motivoParticipacao: "", expectativas: "", participacaoParoquial: "", filhosCuidados: "",
  restricoesAlimentares: "", necessidadesAcessibilidade: "", contatoEmergencia: "",
  observacoesPastorais: "", consentimentoInformacoes: false,
};
const vazio = (encontroId: string): EccVisitaFormData => ({
  encontroId, casalId: "", visitadorVoluntarioId: "", dataAgendada: hoje, horaAgendada: "19:00",
  dataRealizada: "", retornoData: "", status: "AGENDADA", questionario: questionarioVazio, observacoes: "",
});
const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const label = "grid gap-1 text-sm font-semibold text-slate-700";
const nomesStatus: Record<EccVisitaStatus, string> = {
  PENDENTE: "Pendente", AGENDADA: "Agendada", REALIZADA: "Realizada",
  RETORNO_NECESSARIO: "Retorno necessário", CANCELADA: "Cancelada",
};
const coresStatus: Record<EccVisitaStatus, string> = {
  PENDENTE: "bg-slate-100 text-slate-700", AGENDADA: "bg-blue-100 text-blue-700",
  REALIZADA: "bg-emerald-100 text-emerald-700", RETORNO_NECESSARIO: "bg-amber-100 text-amber-800",
  CANCELADA: "bg-red-100 text-red-700",
};

export function VisitasEccSection({ encontroId, participacoes, casais, voluntarios, visitas, onSaved }: Props) {
  const { criarVisita, atualizarVisita } = useEcc();
  const [form, setForm] = useState(() => vazio(encontroId));
  const [editandoId, setEditandoId] = useState("");
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const formularioRef = useRef<HTMLDivElement>(null);
  const visitasDaEdicao = useMemo(() => visitas.filter((item) => item.encontroId === encontroId), [encontroId, visitas]);
  const casaisDaEdicao = useMemo(() => participacoes.map((item) => casais.find((casal) => casal.id === item.casalId)).filter((item): item is EccCasal => Boolean(item)), [casais, participacoes]);

  useEffect(() => { setForm(vazio(encontroId)); setEditandoId(""); setAberto(false); }, [encontroId]);
  useEffect(() => { if (aberto) requestAnimationFrame(() => formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }, [aberto, editandoId]);

  function novo() { setForm(vazio(encontroId)); setEditandoId(""); setAberto(true); }
  function editar(visita: EccVisita) {
    setForm({
      encontroId: visita.encontroId, casalId: visita.casalId, visitadorVoluntarioId: visita.visitadorVoluntarioId,
      dataAgendada: visita.dataAgendada, horaAgendada: visita.horaAgendada, dataRealizada: visita.dataRealizada,
      retornoData: visita.retornoData, status: visita.status, questionario: visita.questionario, observacoes: visita.observacoes,
    });
    setEditandoId(visita.id); setAberto(true);
  }
  function alterarStatus(status: EccVisitaStatus) {
    setForm((atual) => ({
      ...atual, status,
      dataRealizada: ["REALIZADA", "RETORNO_NECESSARIO"].includes(status) && !atual.dataRealizada ? hoje : atual.dataRealizada,
    }));
  }
  async function salvar(event: FormEvent) {
    event.preventDefault(); setSalvando(true);
    try {
      if (editandoId) await atualizarVisita(editandoId, form); else await criarVisita(form);
      toast.success(editandoId ? "Visita e questionário atualizados." : "Visita agendada para o casal.");
      setAberto(false); setEditandoId(""); setForm(vazio(encontroId)); await onSaved();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar a visita."); }
    finally { setSalvando(false); }
  }

  const realizadas = visitasDaEdicao.filter((item) => item.status === "REALIZADA").length;
  const retornos = visitasDaEdicao.filter((item) => item.status === "RETORNO_NECESSARIO").length;

  return <section className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-2xl border bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">Visitas registradas</p><strong className="text-3xl">{visitasDaEdicao.length}</strong></article>
      <article className="rounded-2xl border bg-white p-4"><p className="text-xs font-black uppercase text-emerald-700">Realizadas</p><strong className="text-3xl">{realizadas}</strong></article>
      <article className="rounded-2xl border bg-white p-4"><p className="text-xs font-black uppercase text-amber-700">Retornos necessários</p><strong className="text-3xl">{retornos}</strong></article>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5 shadow-sm"><div><h2 className="text-xl font-black">Visitas aos casais</h2><p className="text-sm text-slate-500">Agenda, acolhimento, questionário e histórico desta edição.</p></div><button type="button" onClick={novo} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white"><Plus size={17} className="mr-2 inline" />Agendar visita</button></div>

    {aberto && <div ref={formularioRef} className="scroll-mt-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black">{editandoId ? "Atualizar visita e questionário" : "Agendar visita"}</h2><p className="text-sm text-slate-500">As respostas pastorais ficam protegidas e vinculadas somente a esta edição.</p></div><button type="button" onClick={() => setAberto(false)} className="text-sm font-bold text-slate-600">Fechar</button></div>
      <form onSubmit={salvar} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className={`${label} md:col-span-2`}>Casal<select required className={campo} value={form.casalId} onChange={(e) => setForm({ ...form, casalId: e.target.value })}><option value="">Selecione</option>{casaisDaEdicao.map((casal) => <option key={casal.id} value={casal.id}>{casal.conjugeUmNome} e {casal.conjugeDoisNome}</option>)}</select></label>
          <label className={`${label} md:col-span-2`}>Casal responsável pela visita<select required className={campo} value={form.visitadorVoluntarioId} onChange={(e) => setForm({ ...form, visitadorVoluntarioId: e.target.value })}><option value="">Selecione</option>{voluntarios.map((item) => <option key={item.id} value={item.id}>{item.nome}{item.conjugeNome ? ` e ${item.conjugeNome}` : ""}</option>)}</select></label>
          <label className={label}>Data agendada<input required type="date" className={campo} value={form.dataAgendada} onChange={(e) => setForm({ ...form, dataAgendada: e.target.value })} /></label>
          <label className={label}>Horário<input type="time" className={campo} value={form.horaAgendada} onChange={(e) => setForm({ ...form, horaAgendada: e.target.value })} /></label>
          <label className={label}>Situação<select className={campo} value={form.status} onChange={(e) => alterarStatus(e.target.value as EccVisitaStatus)}>{Object.entries(nomesStatus).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></label>
          <label className={label}>Data realizada<input type="date" className={campo} value={form.dataRealizada} onChange={(e) => setForm({ ...form, dataRealizada: e.target.value })} /></label>
          {form.status === "RETORNO_NECESSARIO" && <label className={label}>Retorno previsto<input required type="date" className={campo} value={form.retornoData} onChange={(e) => setForm({ ...form, retornoData: e.target.value })} /></label>}
        </div>

        <div className="border-t border-blue-200 pt-5"><h3 className="flex items-center gap-2 font-black"><ClipboardList size={19} />Questionário da visita</h3><p className="mt-1 text-sm text-slate-500">Preencha durante ou depois da conversa com o casal.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={label}>Motivação para participar<textarea className={`${campo} min-h-24`} value={form.questionario.motivoParticipacao} onChange={(e) => setForm({ ...form, questionario: { ...form.questionario, motivoParticipacao: e.target.value } })} /></label>
          <label className={label}>Expectativas do casal<textarea className={`${campo} min-h-24`} value={form.questionario.expectativas} onChange={(e) => setForm({ ...form, questionario: { ...form.questionario, expectativas: e.target.value } })} /></label>
          <label className={label}>Participação na comunidade<textarea className={`${campo} min-h-20`} value={form.questionario.participacaoParoquial} onChange={(e) => setForm({ ...form, questionario: { ...form.questionario, participacaoParoquial: e.target.value } })} /></label>
          <label className={label}>Filhos e necessidade de cuidados<textarea className={`${campo} min-h-20`} value={form.questionario.filhosCuidados} onChange={(e) => setForm({ ...form, questionario: { ...form.questionario, filhosCuidados: e.target.value } })} /></label>
          <label className={label}>Restrições alimentares<textarea className={`${campo} min-h-20`} value={form.questionario.restricoesAlimentares} onChange={(e) => setForm({ ...form, questionario: { ...form.questionario, restricoesAlimentares: e.target.value } })} /></label>
          <label className={label}>Acessibilidade ou apoio necessário<textarea className={`${campo} min-h-20`} value={form.questionario.necessidadesAcessibilidade} onChange={(e) => setForm({ ...form, questionario: { ...form.questionario, necessidadesAcessibilidade: e.target.value } })} /></label>
          <label className={label}>Contato de emergência<input className={campo} value={form.questionario.contatoEmergencia} onChange={(e) => setForm({ ...form, questionario: { ...form.questionario, contatoEmergencia: e.target.value } })} /></label>
          <label className={label}>Observações pastorais<textarea className={`${campo} min-h-20`} value={form.questionario.observacoesPastorais} onChange={(e) => setForm({ ...form, questionario: { ...form.questionario, observacoesPastorais: e.target.value } })} /></label>
        </div>
        <label className="flex items-start gap-3 rounded-xl border bg-white p-4 text-sm"><input type="checkbox" className="mt-1" checked={form.questionario.consentimentoInformacoes} onChange={(e) => setForm({ ...form, questionario: { ...form.questionario, consentimentoInformacoes: e.target.checked } })} /><span><strong>Consentimento para registro</strong><span className="block text-slate-500">O casal autorizou o registro destas informações para organização e acompanhamento do ECC.</span></span></label>
        <label className={label}>Observações da agenda<textarea className={`${campo} min-h-20`} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></label>
        <button disabled={salvando} className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white disabled:opacity-50">{salvando ? "Salvando..." : editandoId ? "Salvar atualização" : "Agendar visita"}</button>
      </form>
    </div>}

    <div className="grid gap-3 lg:grid-cols-2">{visitasDaEdicao.map((visita) => <article key={visita.id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><strong className="text-lg">{visita.casalNome}</strong><p className="mt-1 text-sm text-slate-500">{visita.visitadorNome}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${coresStatus[visita.status]}`}>{nomesStatus[visita.status]}</span></div><div className="mt-4 flex flex-wrap gap-3 text-sm"><span className="inline-flex items-center gap-1"><CalendarCheck size={16} />{new Date(`${visita.dataAgendada}T12:00:00`).toLocaleDateString("pt-BR")}{visita.horaAgendada && ` às ${visita.horaAgendada}`}</span>{visita.dataRealizada && <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 size={16} />Realizada em {new Date(`${visita.dataRealizada}T12:00:00`).toLocaleDateString("pt-BR")}</span>}{visita.retornoData && <span className="inline-flex items-center gap-1 text-amber-700"><RotateCcw size={16} />Retorno em {new Date(`${visita.retornoData}T12:00:00`).toLocaleDateString("pt-BR")}</span>}</div><button type="button" onClick={() => editar(visita)} className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold text-blue-700"><Pencil size={16} />Abrir visita e questionário</button></article>)}{!visitasDaEdicao.length && <div className="rounded-2xl border bg-white p-10 text-center text-slate-500 lg:col-span-2">Nenhuma visita agendada nesta edição.</div>}</div>
  </section>;
}
