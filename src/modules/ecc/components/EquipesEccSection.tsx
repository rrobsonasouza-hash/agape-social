"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CalendarClock, CheckCircle2, ClipboardCheck, HeartHandshake, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useEcc } from "../hooks/useEcc";
import type { EccEquipe, EccEquipePresenca, EccTarefa } from "../types/ecc.types";

export function EquipesEccSection({ encontroId, dataInicio, equipes, tarefas, presencas, onSaved }: {
  encontroId: string; dataInicio: string; equipes: EccEquipe[]; tarefas: EccTarefa[]; presencas: EccEquipePresenca[]; onSaved: () => Promise<void>;
}) {
  const { atualizarEquipe, registrarPresencaEquipe } = useEcc();
  const [filtro, setFiltro] = useState("TODAS");
  const [dia, setDia] = useState(dataInicio);
  const [salvando, setSalvando] = useState("");
  const nomesEquipes = useMemo(() => [...new Set(equipes.map((item) => item.equipe))].sort((a, b) => a.localeCompare(b, "pt-BR")), [equipes]);
  const exibidas = equipes.filter((item) => filtro === "TODAS" || item.equipe === filtro);
  const presencasDia = new Map(presencas.filter((item) => item.encontroId === encontroId && item.data === dia).map((item) => [item.equipeId, item]));
  const confirmados = equipes.filter((item) => ["CONFIRMADO", "PARTICIPOU"].includes(item.status)).length;
  const presentes = equipes.filter((item) => presencasDia.get(item.id)?.presente).length;
  const pendencias = tarefas.filter((item) => item.encontroId === encontroId && !["CONCLUIDA", "CANCELADA"].includes(item.status));

  async function presenca(item: EccEquipe, presente: boolean) {
    setSalvando(`presenca-${item.id}`);
    try { await registrarPresencaEquipe({ encontroId, equipeId: item.id, data: dia, presente }); await onSaved(); toast.success(presente ? "Presença da equipe registrada." : "Ausência registrada."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível registrar a presença."); }
    finally { setSalvando(""); }
  }

  async function status(item: EccEquipe, novoStatus: EccEquipe["status"]) {
    setSalvando(`status-${item.id}`);
    try { await atualizarEquipe(item.id, { encontroId, voluntarioId: item.voluntarioId, equipe: item.equipe, funcao: item.funcao, coordenador: item.coordenador, status: novoStatus, dataEscala: item.dataEscala, horaInicio: item.horaInicio, horaFim: item.horaFim, observacoes: item.observacoes }); await onSaved(); toast.success("Situação do integrante atualizada."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o integrante."); }
    finally { setSalvando(""); }
  }

  async function salvarEscala(event: FormEvent<HTMLFormElement>, item: EccEquipe) {
    event.preventDefault();
    const formulario = new FormData(event.currentTarget);
    setSalvando(`escala-${item.id}`);
    try {
      await atualizarEquipe(item.id, { encontroId, voluntarioId: item.voluntarioId, equipe: item.equipe, funcao: String(formulario.get("funcao") ?? item.funcao), coordenador: item.coordenador, status: item.status, dataEscala: String(formulario.get("dataEscala") ?? ""), horaInicio: String(formulario.get("horaInicio") ?? ""), horaFim: String(formulario.get("horaFim") ?? ""), observacoes: item.observacoes });
      await onSaved(); toast.success("Escala atualizada.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a escala."); }
    finally { setSalvando(""); }
  }

  return <section className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metrica icon={Users} titulo="Integrantes" valor={equipes.length} apoio="Voluntários escalados" /><Metrica icon={CheckCircle2} titulo="Confirmados" valor={confirmados} apoio="Equipe confirmada" /><Metrica icon={HeartHandshake} titulo="Presentes" valor={presentes} apoio={new Date(`${dia}T12:00:00`).toLocaleDateString("pt-BR")} /><Metrica icon={ClipboardCheck} titulo="Pendências" valor={pendencias.length} apoio="Tarefas das equipes" /></div>
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-black">Operação das equipes</h2><p className="text-sm text-slate-500">Acompanhe escala, confirmação, presença e andamento por equipe.</p></div><div className="flex flex-wrap gap-2"><label className="grid gap-1 text-xs font-bold text-slate-600">Dia da presença<input type="date" value={dia} onChange={(event) => setDia(event.target.value)} className="rounded-xl border px-3 py-2 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600">Visão<select value={filtro} onChange={(event) => setFiltro(event.target.value)} className="rounded-xl border bg-white px-3 py-2 text-sm"><option value="TODAS">Todas as equipes</option>{nomesEquipes.map((nome) => <option key={nome}>{nome}</option>)}</select></label></div></div>
      <div className="mt-5 space-y-5">{nomesEquipes.filter((nome) => filtro === "TODAS" || nome === filtro).map((nome) => { const integrantes = exibidas.filter((item) => item.equipe === nome); const tarefasEquipe = tarefas.filter((item) => item.encontroId === encontroId && item.equipe === nome && item.status !== "CANCELADA"); const concluidas = tarefasEquipe.filter((item) => item.status === "CONCLUIDA").length; const progresso = tarefasEquipe.length ? Math.round(concluidas / tarefasEquipe.length * 100) : 0; return <article key={nome} className="rounded-2xl border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black text-slate-900">{nome}</h3><p className="text-xs text-slate-500">{integrantes.length} integrante(s) · {concluidas}/{tarefasEquipe.length} tarefa(s) concluída(s)</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{progresso}% concluído</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progresso}%` }} /></div><div className="mt-4 grid gap-3 md:grid-cols-2">{integrantes.map((item) => { const registro = presencasDia.get(item.id); return <div key={item.id} className="rounded-xl bg-slate-50 p-3"><div className="flex flex-wrap justify-between gap-2"><div><strong className="text-sm">{item.voluntarioNome}</strong><p className="text-xs text-slate-500">{item.funcao}{item.coordenador ? " · Coordenação" : ""}</p></div><select disabled={salvando === `status-${item.id}`} value={item.status} onChange={(event) => void status(item, event.target.value as EccEquipe["status"])} className="rounded-lg border bg-white px-2 py-1.5 text-xs font-bold"><option value="CONVIDADO">Convidado</option><option value="CONFIRMADO">Confirmado</option><option value="INDISPONIVEL">Indisponível</option><option value="PARTICIPOU">Participou</option></select></div><p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-600"><CalendarClock size={14} />{item.dataEscala ? new Date(`${item.dataEscala}T12:00:00`).toLocaleDateString("pt-BR") : "Dia não definido"}{item.horaInicio && ` · ${item.horaInicio}${item.horaFim ? `–${item.horaFim}` : ""}`}</p><div className="mt-3 flex gap-2"><button disabled={salvando === `presenca-${item.id}`} onClick={() => void presenca(item, true)} className={`rounded-lg px-3 py-2 text-xs font-black ${registro?.presente ? "bg-emerald-600 text-white" : "border bg-white text-emerald-700"}`}>Presente</button><button disabled={salvando === `presenca-${item.id}`} onClick={() => void presenca(item, false)} className={`rounded-lg px-3 py-2 text-xs font-black ${registro && !registro.presente ? "bg-red-600 text-white" : "border bg-white text-red-700"}`}>Ausente</button></div><details className="mt-3 border-t pt-2"><summary className="cursor-pointer text-xs font-black text-blue-700">Editar escala</summary><form onSubmit={(event) => void salvarEscala(event, item)} className="mt-2 grid grid-cols-2 gap-2"><input name="funcao" defaultValue={item.funcao} aria-label="Função" className="col-span-2 rounded-lg border bg-white px-2 py-1.5 text-xs" /><input name="dataEscala" type="date" defaultValue={item.dataEscala} aria-label="Dia da escala" className="col-span-2 rounded-lg border bg-white px-2 py-1.5 text-xs" /><input name="horaInicio" type="time" defaultValue={item.horaInicio} aria-label="Início" className="rounded-lg border bg-white px-2 py-1.5 text-xs" /><input name="horaFim" type="time" defaultValue={item.horaFim} aria-label="Fim" className="rounded-lg border bg-white px-2 py-1.5 text-xs" /><button disabled={salvando === `escala-${item.id}`} className="col-span-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white">Salvar escala</button></form></details></div>; })}</div></article>; })}{!equipes.length && <p className="py-12 text-center text-slate-500">A equipe ainda não foi formada.</p>}</div>
    </div>
  </section>;
}

function Metrica({ icon: Icon, titulo, valor, apoio }: { icon: typeof Users; titulo: string; valor: number; apoio: string }) { return <article className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon size={20} /></span><div><p className="text-xs font-black uppercase text-slate-500">{titulo}</p><strong className="text-3xl">{valor}</strong></div></div><p className="mt-2 text-xs text-slate-500">{apoio}</p></article>; }
