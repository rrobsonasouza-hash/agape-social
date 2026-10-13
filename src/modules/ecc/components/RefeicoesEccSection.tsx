"use client";

import { AlertTriangle, Clock3, MapPin, Pencil, Plus, Utensils, Users, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useEcc } from "../hooks/useEcc";
import type { EccRefeicaoFormData } from "../schemas/ecc.schema";
import type { EccCredenciamento, EccEquipe, EccParticipacao, EccRefeicao, EccRefeicaoPublico, EccRefeicaoStatus } from "../types/ecc.types";

const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const label = "grid gap-1 text-sm font-semibold text-slate-700";
const tipos = { CAFE_MANHA: "Café da manhã", ALMOCO: "Almoço", CAFE_TARDE: "Café da tarde", JANTAR: "Jantar", CEIA: "Ceia", OUTRO: "Outra refeição" } as const;
const publicos = { TODOS: "Participantes e equipe", PARTICIPANTES: "Somente participantes", EQUIPE: "Somente equipe" } as const;
const situacoes = { PLANEJADA: "Planejada", CONFIRMADA: "Confirmada", SERVIDA: "Servida", CANCELADA: "Cancelada" } as const;

function novoFormulario(encontroId: string, dataInicio: string): EccRefeicaoFormData {
  return { encontroId, tipo: "ALMOCO", titulo: "Almoço", data: dataInicio, hora: "12:00", local: "", publico: "TODOS", quantidadePrevista: 0, cardapio: "", responsavel: "", status: "PLANEJADA", observacoes: "" };
}

type Props = {
  encontroId: string; dataInicio: string; dataFim: string; refeicoes: EccRefeicao[];
  participacoes: EccParticipacao[]; equipes: EccEquipe[]; credenciamentos: EccCredenciamento[];
  onSaved: () => Promise<void> | void;
};

export function RefeicoesEccSection({ encontroId, dataInicio, dataFim, refeicoes, participacoes, equipes, credenciamentos, onSaved }: Props) {
  const { criarRefeicao, atualizarRefeicao } = useEcc();
  const [form, setForm] = useState<EccRefeicaoFormData>(() => novoFormulario(encontroId, dataInicio));
  const [editando, setEditando] = useState("");
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const participantes = useMemo(() => participacoes.filter((item) => ["INDICADO", "ENCONTRISTA", "CONVIDADO", "VISITANTE"].includes(item.classificacao) && ["CONFIRMADO", "PARTICIPOU"].includes(item.situacao)).length * 2, [participacoes]);
  const equipe = useMemo(() => new Set(equipes.filter((item) => item.status !== "INDISPONIVEL").map((item) => item.voluntarioId)).size, [equipes]);
  const estimativa = (publico: EccRefeicaoPublico) => publico === "PARTICIPANTES" ? participantes : publico === "EQUIPE" ? equipe : participantes + equipe;
  const restricoes = useMemo(() => credenciamentos.filter((item) => item.encontroId === encontroId && item.restricoesAlimentares.trim()), [credenciamentos, encontroId]);

  function abrirNova() {
    const inicial = novoFormulario(encontroId, dataInicio);
    setForm({ ...inicial, quantidadePrevista: estimativa("TODOS") });
    setEditando(""); setAberto(true);
  }
  function editar(item: EccRefeicao) {
    setForm({ encontroId: item.encontroId, tipo: item.tipo, titulo: item.titulo, data: item.data, hora: item.hora, local: item.local, publico: item.publico, quantidadePrevista: item.quantidadePrevista, cardapio: item.cardapio, responsavel: item.responsavel, status: item.status, observacoes: item.observacoes });
    setEditando(item.id); setAberto(true);
  }
  async function salvar(event: FormEvent) {
    event.preventDefault(); setSalvando(true);
    try {
      if (editando) await atualizarRefeicao(editando, form); else await criarRefeicao(form);
      toast.success(editando ? "Refeição atualizada." : "Refeição incluída no planejamento.");
      setAberto(false); setEditando(""); await onSaved();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar a refeição."); }
    finally { setSalvando(false); }
  }
  async function mudarSituacao(item: EccRefeicao, status: EccRefeicaoStatus) {
    try {
      await atualizarRefeicao(item.id, { encontroId: item.encontroId, tipo: item.tipo, titulo: item.titulo, data: item.data, hora: item.hora, local: item.local, publico: item.publico, quantidadePrevista: item.quantidadePrevista, cardapio: item.cardapio, responsavel: item.responsavel, status, observacoes: item.observacoes });
      toast.success("Situação da refeição atualizada."); await onSaved();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a refeição."); }
  }

  return <div className="space-y-5">
    <section className="grid gap-4 md:grid-cols-3">
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><Utensils size={21} /></span><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Refeições</p><strong className="text-3xl">{refeicoes.length}</strong></div></div><p className="mt-3 text-sm text-slate-500">Planejadas nesta edição</p></article>
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Users size={21} /></span><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Estimativa atual</p><strong className="text-3xl">{participantes + equipe}</strong></div></div><p className="mt-3 text-sm text-slate-500">{participantes} participantes · {equipe} integrantes da equipe</p></article>
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-700"><AlertTriangle size={21} /></span><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Restrições</p><strong className="text-3xl">{restricoes.length}</strong></div></div><p className="mt-3 text-sm text-slate-500">Cuidados alimentares cadastrados</p></article>
    </section>

    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">COZINHA E ALIMENTAÇÃO</p><h2 className="mt-1 text-xl font-black">Planejamento das refeições</h2><p className="mt-1 text-sm text-slate-500">Organize horários, cardápio, quantidade e responsável. Compras e tarefas continuam vinculadas às suas áreas próprias.</p></div><button onClick={abrirNova} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white"><Plus size={17} />Nova refeição</button></div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">{refeicoes.map((item) => <article key={item.id} className={`rounded-2xl border p-4 ${item.status === "CANCELADA" ? "bg-slate-50 opacity-70" : "bg-white"}`}><div className="flex items-start justify-between gap-3"><div><span className="text-xs font-black uppercase tracking-wider text-blue-700">{tipos[item.tipo]}</span><h3 className="mt-1 text-lg font-black">{item.titulo}</h3></div><button aria-label={`Editar ${item.titulo}`} onClick={() => editar(item)} className="rounded-lg border p-2 text-slate-600"><Pencil size={16} /></button></div><div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600"><span className="inline-flex items-center gap-1"><Clock3 size={15} />{new Date(`${item.data}T12:00:00`).toLocaleDateString("pt-BR")} · {item.hora}</span>{item.local && <span className="inline-flex items-center gap-1"><MapPin size={15} />{item.local}</span>}<span className="inline-flex items-center gap-1"><Users size={15} />{item.quantidadePrevista} pessoas</span></div><p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><b>Cardápio:</b> {item.cardapio}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div className="text-xs text-slate-500">{publicos[item.publico]}{item.responsavel ? ` · ${item.responsavel}` : ""}</div><select aria-label={`Situação de ${item.titulo}`} value={item.status} onChange={(event) => void mudarSituacao(item, event.target.value as EccRefeicaoStatus)} className="rounded-lg border bg-white px-2.5 py-2 text-xs font-bold">{Object.entries(situacoes).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></div></article>)}{!refeicoes.length && <p className="py-12 text-center text-sm text-slate-500 lg:col-span-2">Nenhuma refeição planejada. Cadastre o primeiro almoço, jantar ou café desta edição.</p>}</div>
    </section>

    {restricoes.length > 0 && <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5"><h2 className="font-black text-orange-950">Cuidados alimentares informados</h2><p className="mt-1 text-sm text-orange-800">Resumo vindo do credenciamento para consulta da equipe de cozinha.</p><div className="mt-3 grid gap-2 md:grid-cols-2">{restricoes.map((item) => <div key={item.id} className="rounded-xl bg-white p-3 text-sm"><strong>{item.casalNome}</strong><p className="mt-1 text-orange-800">{item.restricoesAlimentares}</p></div>)}</div></section>}

    {aberto && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4"><form onSubmit={salvar} className="my-6 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">REFEIÇÕES DO ECC</p><h2 className="mt-1 text-2xl font-black">{editando ? "Editar refeição" : "Nova refeição"}</h2></div><button type="button" aria-label="Fechar" onClick={() => setAberto(false)} className="rounded-lg border p-2"><X size={18} /></button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className={label}>Tipo<select className={campo} value={form.tipo} onChange={(e) => { const tipo = e.target.value as EccRefeicaoFormData["tipo"]; setForm({ ...form, tipo, titulo: tipos[tipo] }); }}>{Object.entries(tipos).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></label><label className={label}>Nome<input className={campo} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></label><label className={label}>Data<input type="date" min={dataInicio} max={dataFim} className={campo} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required /></label><label className={label}>Horário<input type="time" className={campo} value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} required /></label><label className={label}>Público<select className={campo} value={form.publico} onChange={(e) => { const publico = e.target.value as EccRefeicaoPublico; setForm({ ...form, publico, quantidadePrevista: estimativa(publico) }); }}>{Object.entries(publicos).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></label><label className={label}>Quantidade prevista<div className="flex gap-2"><input type="number" min="0" className={campo} value={form.quantidadePrevista} onChange={(e) => setForm({ ...form, quantidadePrevista: Number(e.target.value) })} /><button type="button" onClick={() => setForm({ ...form, quantidadePrevista: estimativa(form.publico) })} className="shrink-0 rounded-xl border px-3 text-xs font-bold text-blue-700">Atualizar</button></div></label><label className={label}>Local<input className={campo} value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder="Salão, refeitório..." /></label><label className={label}>Responsável<input className={campo} value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Equipe ou coordenador" /></label><label className={`${label} md:col-span-2`}>Cardápio<textarea className={`${campo} min-h-28`} value={form.cardapio} onChange={(e) => setForm({ ...form, cardapio: e.target.value })} placeholder="Prato principal, acompanhamentos, sobremesa e bebidas" required /></label><label className={label}>Situação<select className={campo} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EccRefeicaoStatus })}>{Object.entries(situacoes).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></label><label className={label}>Observações<input className={campo} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setAberto(false)} className="rounded-xl border px-4 py-3 text-sm font-bold">Cancelar</button><button disabled={salvando} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{salvando ? "Salvando..." : "Salvar refeição"}</button></div></form></div>}
  </div>;
}
