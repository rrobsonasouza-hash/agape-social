"use client";

import { useMemo, useState, type FormEvent } from "react";
import { BadgeDollarSign, CheckCircle2, History, LockKeyhole, Plus, ReceiptText, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { useEcc } from "../hooks/useEcc";
import type { EccDespesaFormData } from "../schemas/ecc.schema";
import type { EccDespesaStatus, EccPainel } from "../types/ecc.types";

const hoje = new Date().toISOString().slice(0, 10);
const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const label = "grid gap-1 text-sm font-semibold text-slate-700";
const papeis = { INDICADO: "Indicado", ENCONTRISTA: "Encontrista", CONVIDADO: "Convidado", VISITANTE: "Visitante", EQUIPE: "Equipe", COORDENADOR: "Coordenação" } as const;

export function EncerramentoEccSection({ encontroId, dados, onSaved }: { encontroId: string; dados: EccPainel; onSaved: () => Promise<void> }) {
  const { criarDespesa, atualizarDespesa, encerrarEdicao } = useEcc();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [despesa, setDespesa] = useState<EccDespesaFormData>({ encontroId, descricao: "", fornecedor: "", valor: 0, data: hoje, status: "PENDENTE", observacoes: "" });
  const edicao = dados.encontros.find((item) => item.id === encontroId);
  const participacoes = useMemo(() => dados.participacoes.filter((item) => item.encontroId === encontroId), [dados.participacoes, encontroId]);
  const despesas = useMemo(() => dados.despesas.filter((item) => item.encontroId === encontroId), [dados.despesas, encontroId]);
  const arrecadacoes = useMemo(() => dados.arrecadacoes.filter((item) => item.encontroId === encontroId), [dados.arrecadacoes, encontroId]);
  const tarefasPendentes = dados.tarefas.filter((item) => item.encontroId === encontroId && !["CONCLUIDA", "CANCELADA"].includes(item.status)).length;
  const participantesPresentes = new Set([
    ...dados.credenciamentos.filter((item) => item.encontroId === encontroId && item.status === "CREDENCIADO").map((item) => item.casalId),
    ...dados.presencasDiarias.filter((item) => item.encontroId === encontroId && item.presente).map((item) => item.casalId),
  ]).size;
  const recebido = arrecadacoes.filter((item) => item.categoria === "VALOR" && item.status !== "CANCELADO").reduce((total, item) => total + item.valorRecebido, 0);
  const pago = despesas.filter((item) => item.status === "PAGA").reduce((total, item) => total + item.valor, 0);
  const saldo = recebido - pago;

  const historicos = useMemo(() => participacoes.map((atual) => {
    const registros = dados.participacoes.filter((item) => item.casalId === atual.casalId).map((item) => ({
      ...item, edicao: dados.encontros.find((encontro) => encontro.id === item.encontroId),
    })).filter((item) => item.edicao).sort((a, b) => (a.edicao?.numero ?? 0) - (b.edicao?.numero ?? 0));
    return { casalId: atual.casalId, nome: atual.casalNome, registros };
  }).filter((item) => item.registros.length > 1), [dados.encontros, dados.participacoes, participacoes]);

  async function salvarDespesa(event: FormEvent) {
    event.preventDefault(); setSalvando(true);
    try { await criarDespesa({ ...despesa, encontroId }); await onSaved(); setAberto(false); setDespesa({ encontroId, descricao: "", fornecedor: "", valor: 0, data: hoje, status: "PENDENTE", observacoes: "" }); toast.success("Despesa incluída no controle do encontro."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível registrar a despesa."); }
    finally { setSalvando(false); }
  }

  async function mudarDespesa(id: string, status: EccDespesaStatus) {
    const atual = despesas.find((item) => item.id === id); if (!atual) return;
    setSalvando(true);
    try { await atualizarDespesa(id, { encontroId, descricao: atual.descricao, fornecedor: atual.fornecedor, valor: atual.valor, data: atual.data, status, observacoes: atual.observacoes }); await onSaved(); toast.success(status === "PAGA" ? "Pagamento integrado à Tesouraria." : "Situação da despesa atualizada."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a despesa."); }
    finally { setSalvando(false); }
  }

  async function encerrar() {
    if (!window.confirm(`Encerrar o ${edicao?.numero ?? ""}º ECC? Os casais com presença registrada serão marcados como participantes concluídos.`)) return;
    setSalvando(true);
    try { const resposta = await encerrarEdicao(encontroId); await onSaved(); toast.success(`Edição encerrada com ${resposta.participantesConcluidos} casal(is) concluído(s).`); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível encerrar a edição."); }
    finally { setSalvando(false); }
  }

  return <div className="space-y-5">
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black"><BadgeDollarSign size={21} />Resultado financeiro do encontro</h2><p className="text-sm text-slate-500">Entradas recebidas, despesas pagas e saldo integrado ao Caixa do ECC.</p></div><button type="button" onClick={() => setAberto((valor) => !valor)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white"><Plus size={16} />Nova despesa</button></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3"><Financeiro titulo="Arrecadado" valor={recebido} cor="text-emerald-700" icon={TrendingUp} /><Financeiro titulo="Despesas pagas" valor={pago} cor="text-red-700" icon={ReceiptText} /><Financeiro titulo="Saldo do ECC" valor={saldo} cor={saldo >= 0 ? "text-blue-700" : "text-red-700"} icon={BadgeDollarSign} /></div>
      {aberto && <form onSubmit={salvarDespesa} className="mt-4 grid gap-3 rounded-xl bg-blue-50 p-4 md:grid-cols-2 lg:grid-cols-4"><label className={`${label} lg:col-span-2`}>Despesa<input required className={campo} value={despesa.descricao} onChange={(e) => setDespesa({ ...despesa, descricao: e.target.value })} /></label><label className={label}>Fornecedor<input className={campo} value={despesa.fornecedor} onChange={(e) => setDespesa({ ...despesa, fornecedor: e.target.value })} /></label><label className={label}>Data<input required type="date" className={campo} value={despesa.data} onChange={(e) => setDespesa({ ...despesa, data: e.target.value })} /></label><label className={label}>Valor (R$)<input required type="number" min="0.01" step="0.01" className={campo} value={despesa.valor || ""} onChange={(e) => setDespesa({ ...despesa, valor: Number(e.target.value) })} /></label><label className={label}>Situação<select className={campo} value={despesa.status} onChange={(e) => setDespesa({ ...despesa, status: e.target.value as EccDespesaStatus })}><option value="PENDENTE">Pagamento pendente</option><option value="PAGA">Paga</option></select></label><label className={`${label} lg:col-span-2`}>Observações<input className={campo} value={despesa.observacoes} onChange={(e) => setDespesa({ ...despesa, observacoes: e.target.value })} /></label><button disabled={salvando} className="rounded-xl bg-blue-600 px-4 py-3 font-black text-white lg:col-span-4">Registrar despesa</button></form>}
      <div className="mt-4 space-y-2">{despesas.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div><strong>{item.descricao}</strong><p className="text-xs text-slate-500">{item.fornecedor || "Fornecedor não informado"} · {new Date(`${item.data}T12:00:00`).toLocaleDateString("pt-BR")}</p></div><div className="flex items-center gap-3"><strong className="text-sm">{item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong><select disabled={salvando} className="rounded-lg border bg-white px-2 py-1.5 text-xs font-bold" value={item.status} onChange={(e) => void mudarDespesa(item.id, e.target.value as EccDespesaStatus)}><option value="PENDENTE">Pendente</option><option value="PAGA">Paga</option><option value="CANCELADA">Cancelada</option></select></div></article>)}{!despesas.length && <p className="py-5 text-center text-sm text-slate-500">Nenhuma despesa registrada.</p>}</div>
    </section>

    <section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="flex items-center gap-2 text-xl font-black"><LockKeyhole size={20} />Encerramento da edição</h2><p className="text-sm text-slate-500">{participantesPresentes} casal(is) com presença registrada · {tarefasPendentes} tarefa(s) ainda pendente(s).</p></div>{edicao?.status === "ENCERRADO" ? <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 font-black text-emerald-800"><CheckCircle2 size={18} />Edição encerrada</span> : <button type="button" disabled={salvando} onClick={() => void encerrar()} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Encerrar edição e consolidar histórico</button>}</div>{tarefasPendentes > 0 && edicao?.status !== "ENCERRADO" && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Existem tarefas pendentes. O encerramento é permitido, mas elas continuarão registradas no relatório histórico.</p>}</section>

    <section className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-xl font-black"><History size={20} />Histórico dos casais</h2><p className="text-sm text-slate-500">Evolução entre participações e trabalho nas diferentes edições.</p><div className="mt-4 grid gap-3 md:grid-cols-2">{historicos.map((item) => <article key={item.casalId} className="rounded-xl bg-slate-50 p-4"><strong>{item.nome}</strong><div className="mt-3 space-y-2 border-l-2 border-blue-200 pl-3">{item.registros.map((registro) => <div key={registro.id}><span className="text-sm font-black text-blue-800">{registro.edicao?.numero}º ECC</span><p className="text-xs text-slate-600">{papeis[registro.classificacao]} · {registro.situacao === "PARTICIPOU" ? "Participação concluída" : registro.situacao.toLocaleLowerCase("pt-BR").replace("_", " ")}</p></div>)}</div></article>)}{!historicos.length && <p className="py-6 text-center text-sm text-slate-500 md:col-span-2">O histórico comparativo aparecerá quando um casal estiver vinculado a mais de uma edição.</p>}</div></section>
  </div>;
}

function Financeiro({ titulo, valor, cor, icon: Icon }: { titulo: string; valor: number; cor: string; icon: typeof BadgeDollarSign }) {
  return <article className="rounded-xl bg-slate-50 p-4"><Icon className={cor} size={20} /><p className="mt-2 text-xs font-black uppercase text-slate-500">{titulo}</p><strong className={`text-2xl ${cor}`}>{valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></article>;
}
