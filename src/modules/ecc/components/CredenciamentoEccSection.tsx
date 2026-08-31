"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BadgeCheck, Check, ChevronDown, Clock3, PackageCheck, Search, UserRoundX } from "lucide-react";
import toast from "react-hot-toast";
import { useEcc } from "../hooks/useEcc";
import type { EccCredenciamentoFormData } from "../schemas/ecc.schema";
import type { EccCasal, EccCredenciamento, EccCredenciamentoStatus, EccParticipacao, EccPresencaDia } from "../types/ecc.types";

type Props = {
  encontroId: string; dataInicio: string; dataFim: string;
  participacoes: EccParticipacao[]; casais: EccCasal[]; credenciamentos: EccCredenciamento[];
  presencasDiarias: EccPresencaDia[]; casalFocoId?: string; onSaved: () => Promise<void>;
};

const nomesStatus: Record<EccCredenciamentoStatus, string> = { AGUARDANDO: "Aguardando", CREDENCIADO: "Presente", AUSENTE: "Ausente", CANCELADO: "Cancelado" };
const coresStatus: Record<EccCredenciamentoStatus, string> = { AGUARDANDO: "bg-amber-100 text-amber-800", CREDENCIADO: "bg-emerald-100 text-emerald-700", AUSENTE: "bg-red-100 text-red-700", CANCELADO: "bg-slate-100 text-slate-600" };
const circulos = ["Amarelo", "Azul", "Branco", "Laranja", "Roxo", "Verde", "Vermelho"];
const normalizar = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function diasDoEncontro(inicio: string, fim: string) {
  const dias: string[] = [];
  const atual = new Date(`${inicio}T12:00:00`);
  const limite = new Date(`${fim}T12:00:00`);
  while (atual <= limite && dias.length < 10) { dias.push(atual.toISOString().slice(0, 10)); atual.setDate(atual.getDate() + 1); }
  return dias;
}

function rotuloDia(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export function CredenciamentoEccSection({ encontroId, dataInicio, dataFim, participacoes, casais, credenciamentos, presencasDiarias, casalFocoId = "", onSaved }: Props) {
  const { registrarCredenciamento, registrarPresencaDia } = useEcc();
  const dias = useMemo(() => diasDoEncontro(dataInicio, dataFim), [dataInicio, dataFim]);
  const [dia, setDia] = useState(dias[0] ?? dataInicio);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<EccCredenciamentoStatus | "TODOS">("TODOS");
  const [salvando, setSalvando] = useState("");
  useEffect(() => setDia(dias[0] ?? dataInicio), [dataInicio, dias]);
  useEffect(() => {
    if (!casalFocoId) return;
    const participacao = participacoes.find((item) => item.casalId === casalFocoId);
    if (participacao) setBusca(participacao.casalNome);
  }, [casalFocoId, participacoes]);

  const participantes = useMemo(() => participacoes.filter((item) => !["EQUIPE", "COORDENADOR"].includes(item.classificacao)), [participacoes]);
  const registros = useMemo(() => new Map(credenciamentos.filter((item) => item.encontroId === encontroId).map((item) => [item.casalId, item])), [credenciamentos, encontroId]);
  const presencas = useMemo(() => new Map(presencasDiarias.filter((item) => item.encontroId === encontroId && item.data === dia).map((item) => [item.casalId, item])), [dia, encontroId, presencasDiarias]);
  const linhas = useMemo(() => participantes.map((participacao) => ({
    participacao, casal: casais.find((item) => item.id === participacao.casalId), registro: registros.get(participacao.casalId),
    status: registros.get(participacao.casalId)?.status ?? "AGUARDANDO" as EccCredenciamentoStatus,
  })).filter((item) => {
    const termo = normalizar(busca);
    return (!termo || normalizar(`${item.participacao.casalNome} ${item.casal?.telefone ?? ""}`).includes(termo)) && (filtro === "TODOS" || item.status === filtro);
  }).sort((a, b) => a.participacao.casalNome.localeCompare(b.participacao.casalNome, "pt-BR")), [busca, casais, filtro, participantes, registros]);

  const presentes = participantes.filter((item) => registros.get(item.casalId)?.status === "CREDENCIADO").length;
  const ausentes = participantes.filter((item) => registros.get(item.casalId)?.status === "AUSENTE").length;
  const aguardando = participantes.length - presentes - ausentes - participantes.filter((item) => registros.get(item.casalId)?.status === "CANCELADO").length;
  const presentesDia = participantes.filter((item) => presencas.get(item.casalId)?.presente === true).length;

  function dadosAtuais(casalId: string): EccCredenciamentoFormData {
    const atual = registros.get(casalId);
    return {
      encontroId, casalId, status: atual?.status ?? "AGUARDANDO", crachaEntregue: atual?.crachaEntregue ?? false,
      materialEntregue: atual?.materialEntregue ?? false, restricoesAlimentares: atual?.restricoesAlimentares ?? "",
      medicamentos: atual?.medicamentos ?? "", contatoEmergencia: atual?.contatoEmergencia ?? "",
      circulo: atual?.circulo ?? "", observacoes: atual?.observacoes ?? "",
    };
  }

  async function salvar(casalId: string, alteracoes: Partial<EccCredenciamentoFormData>) {
    const dados = { ...dadosAtuais(casalId), ...alteracoes };
    setSalvando(casalId);
    try {
      await registrarCredenciamento(dados);
      if (alteracoes.status === "CREDENCIADO" && dia) await registrarPresencaDia({ encontroId, casalId, data: dia, presente: true });
      await onSaved();
      toast.success(dados.status === "CREDENCIADO" ? "Chegada e presença do casal registradas." : "Credenciamento atualizado.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o credenciamento."); }
    finally { setSalvando(""); }
  }

  async function salvarPresenca(casalId: string, presente: boolean) {
    setSalvando(`presenca-${casalId}`);
    try { await registrarPresencaDia({ encontroId, casalId, data: dia, presente }); await onSaved(); toast.success(presente ? "Presença do dia registrada." : "Ausência do dia registrada."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível registrar a presença."); }
    finally { setSalvando(""); }
  }

  function salvarFicha(event: FormEvent<HTMLFormElement>, casalId: string) {
    event.preventDefault();
    const formulario = new FormData(event.currentTarget);
    void salvar(casalId, {
      restricoesAlimentares: String(formulario.get("restricoesAlimentares") ?? ""), medicamentos: String(formulario.get("medicamentos") ?? ""),
      contatoEmergencia: String(formulario.get("contatoEmergencia") ?? ""), circulo: String(formulario.get("circulo") ?? ""),
      observacoes: String(formulario.get("observacoes") ?? ""),
    });
  }

  return <section className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Metrica titulo="Casais esperados" valor={participantes.length} cor="text-slate-700" />
      <Metrica titulo="Chegaram" valor={presentes} cor="text-emerald-700" />
      <Metrica titulo="Aguardando" valor={aguardando} cor="text-amber-700" />
      <Metrica titulo="Ausentes" valor={ausentes} cor="text-red-700" />
      <Metrica titulo={`Presentes · ${rotuloDia(dia)}`} valor={presentesDia} cor="text-blue-700" />
    </div>

    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-xl font-black">Recepção e presença dos casais</h2><p className="text-sm text-slate-500">Registre a chegada e acompanhe a participação em cada dia do encontro.</p></div>
        <div className="flex flex-wrap gap-2">{dias.map((data) => <button type="button" key={data} onClick={() => setDia(data)} className={`rounded-xl px-4 py-2 text-sm font-black ${dia === data ? "bg-blue-600 text-white" : "border bg-white text-slate-700"}`}>{rotuloDia(data)}</button>)}</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><label className="relative min-w-56 flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm" placeholder="Buscar casal" value={busca} onChange={(e) => setBusca(e.target.value)} /></label><select className="rounded-xl border bg-white px-3 py-2.5 text-sm font-bold" value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)}><option value="TODOS">Todos</option>{Object.entries(nomesStatus).map(([valor,nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></div>

      <div className="mt-5 space-y-3">{linhas.map(({ participacao, casal, registro, status }) => {
        const presenca = presencas.get(participacao.casalId);
        return <article key={participacao.id} className={`rounded-2xl border p-4 ${status === "CREDENCIADO" ? "border-emerald-200 bg-emerald-50/40" : "bg-white"}`}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><strong>{participacao.casalNome}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-black ${coresStatus[status]}`}>{nomesStatus[status]}</span>{registro?.circulo && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-800">Círculo {registro.circulo}</span>}</div><p className="mt-1 text-xs text-slate-500">{casal?.telefone || "Telefone não informado"}{registro?.credenciadoEm && ` · chegada às ${new Date(registro.credenciadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}</p></div><div className="flex flex-wrap gap-2">{status !== "CREDENCIADO" && <button disabled={salvando === participacao.casalId} onClick={() => void salvar(participacao.casalId, { status: "CREDENCIADO" })} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"><BadgeCheck size={17} />Registrar chegada</button>}{status === "CREDENCIADO" && <button disabled={salvando === participacao.casalId} onClick={() => void salvar(participacao.casalId, { status: "AGUARDANDO", crachaEntregue: false, materialEntregue: false })} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black"><Clock3 size={17} />Desfazer</button>}<button disabled={salvando === participacao.casalId} onClick={() => void salvar(participacao.casalId, { status: "AUSENTE" })} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-black text-red-700"><UserRoundX size={17} />Ausente</button></div></div>
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-3"><button type="button" disabled={salvando === `presenca-${participacao.casalId}`} onClick={() => void salvarPresenca(participacao.casalId, true)} className={`rounded-xl px-3 py-2 text-sm font-bold ${presenca?.presente === true ? "bg-blue-600 text-white" : "border bg-white text-blue-700"}`}>Presente em {rotuloDia(dia)}</button><button type="button" disabled={salvando === `presenca-${participacao.casalId}`} onClick={() => void salvarPresenca(participacao.casalId, false)} className={`rounded-xl px-3 py-2 text-sm font-bold ${presenca && !presenca.presente ? "bg-red-600 text-white" : "border bg-white text-red-700"}`}>Ausente no dia</button><label className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold"><input type="checkbox" checked={registro?.crachaEntregue ?? false} onChange={(e) => void salvar(participacao.casalId, { crachaEntregue: e.target.checked })} /><Check size={15} />Crachá</label><label className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold"><input type="checkbox" checked={registro?.materialEntregue ?? false} onChange={(e) => void salvar(participacao.casalId, { materialEntregue: e.target.checked })} /><PackageCheck size={16} />Material</label></div>
          <details open={participacao.casalId === casalFocoId || undefined} className="mt-3 rounded-xl border bg-white"><summary className="flex cursor-pointer list-none items-center justify-between p-3 text-sm font-black text-slate-700">Ficha operacional do casal <ChevronDown size={17} /></summary><form onSubmit={(event) => salvarFicha(event, participacao.casalId)} className="grid gap-3 border-t p-4 md:grid-cols-2"><label className="grid gap-1 text-sm font-bold">Círculo<select name="circulo" defaultValue={registro?.circulo ?? ""} className="rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="">Ainda não definido</option>{circulos.map((cor) => <option key={cor} value={cor}>{cor}</option>)}</select></label><label className="grid gap-1 text-sm font-bold">Contato de emergência<input name="contatoEmergencia" defaultValue={registro?.contatoEmergencia ?? ""} placeholder="Nome e telefone" className="rounded-xl border px-3 py-2.5 font-normal" /></label><label className="grid gap-1 text-sm font-bold">Restrições alimentares<textarea name="restricoesAlimentares" defaultValue={registro?.restricoesAlimentares ?? ""} className="min-h-20 rounded-xl border px-3 py-2.5 font-normal" /></label><label className="grid gap-1 text-sm font-bold">Medicamentos e cuidados<textarea name="medicamentos" defaultValue={registro?.medicamentos ?? ""} className="min-h-20 rounded-xl border px-3 py-2.5 font-normal" /></label><label className="grid gap-1 text-sm font-bold md:col-span-2">Observações operacionais<textarea name="observacoes" defaultValue={registro?.observacoes ?? ""} className="min-h-20 rounded-xl border px-3 py-2.5 font-normal" /></label><button disabled={salvando === participacao.casalId} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white md:w-fit">Salvar ficha operacional</button></form></details>
        </article>;
      })}{!linhas.length && <p className="py-12 text-center text-slate-500">Nenhum casal encontrado neste filtro.</p>}</div>
    </div>
  </section>;
}

function Metrica({ titulo, valor, cor }: { titulo: string; valor: number; cor: string }) {
  return <article className="rounded-2xl border bg-white p-4 shadow-sm"><p className={`text-xs font-black uppercase ${cor}`}>{titulo}</p><strong className="text-3xl">{valor}</strong></article>;
}
