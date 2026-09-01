"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, ShieldCheck } from "lucide-react";
import { calcularProntidaoEcc, type AbaPendenciaEcc, type NivelProntidao } from "../lib/prontidao";
import type { EccPainel } from "../types/ecc.types";

const visual: Record<NivelProntidao, { titulo: string; apoio: string; caixa: string; texto: string; barra: string; Icon: typeof CheckCircle2 }> = {
  PRONTO: { titulo: "Pronto", apoio: "Os pontos essenciais estão organizados.", caixa: "border-emerald-300 bg-emerald-50", texto: "text-emerald-800", barra: "bg-emerald-500", Icon: CheckCircle2 },
  ATENCAO: { titulo: "Atenção", apoio: "Há pendências que precisam de acompanhamento.", caixa: "border-amber-300 bg-amber-50", texto: "text-amber-900", barra: "bg-amber-500", Icon: AlertTriangle },
  CRITICO: { titulo: "Crítico", apoio: "Existem pendências que podem comprometer o encontro.", caixa: "border-red-300 bg-red-50", texto: "text-red-800", barra: "bg-red-500", Icon: AlertTriangle },
};

export function ProntidaoEccSection({ encontroId, dados, onNavigate }: { encontroId: string; dados: EccPainel; onNavigate: (aba: AbaPendenciaEcc) => void }) {
  const diagnostico = calcularProntidaoEcc(dados, encontroId);
  const geral = visual[diagnostico.nivel];
  const GeralIcon = geral.Icon;
  const dias = diagnostico.diasAteEncontro;
  const prazo = dias > 0 ? `Faltam ${dias} dia(s) para o encontro` : dias === 0 ? "O encontro começa hoje" : `O encontro começou há ${Math.abs(dias)} dia(s)`;

  return <section className="rounded-2xl border bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-700">Checklist automático</p><h2 className="mt-1 flex items-center gap-2 text-xl font-black"><ClipboardCheck size={22} />Prontidão do encontro</h2><p className="mt-1 text-sm text-slate-500">{prazo}. As pendências ficam críticas quando faltam sete dias ou menos.</p></div><div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${geral.caixa}`}><GeralIcon size={25} className={geral.texto} /><div><p className={`text-xs font-black uppercase ${geral.texto}`}>Situação geral</p><strong className={`text-xl ${geral.texto}`}>{geral.titulo}</strong></div></div></div>
    <div className="mt-5"><div className="flex items-center justify-between text-xs font-bold text-slate-600"><span>{diagnostico.percentual}% dos pontos prontos</span><span>{diagnostico.itens.filter((item) => item.nivel === "PRONTO").length}/{diagnostico.itens.length}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all ${geral.barra}`} style={{ width: `${diagnostico.percentual}%` }} /></div></div>
    <div className="mt-5 grid gap-3 lg:grid-cols-5">{diagnostico.itens.map((item) => { const estilo = visual[item.nivel]; const ItemIcon = estilo.Icon; return <article key={item.id} className={`flex min-h-52 flex-col rounded-2xl border p-4 ${estilo.caixa}`}><div className="flex items-center justify-between gap-2"><ItemIcon size={20} className={estilo.texto} /><span className={`rounded-full bg-white/80 px-2 py-1 text-[11px] font-black uppercase ${estilo.texto}`}>{estilo.titulo}</span></div><h3 className="mt-3 font-black text-slate-950">{item.titulo}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{item.descricao}</p>{item.detalhes.length > 0 && <ul className="mt-2 space-y-1 text-[11px] text-slate-500">{item.detalhes.slice(0, 3).map((detalhe) => <li key={detalhe} className="truncate">• {detalhe}</li>)}{item.detalhes.length > 3 && <li>+ {item.detalhes.length - 3} outro(s)</li>}</ul>}<button type="button" onClick={() => onNavigate(item.aba)} className="mt-auto inline-flex items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-sm">{item.nivel === "PRONTO" ? "Revisar" : "Resolver pendência"}<ArrowRight size={14} /></button></article>; })}</div>
    {diagnostico.nivel === "PRONTO" && <div className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900"><ShieldCheck className="shrink-0" size={22} /><p><strong>Operação pronta para o encontro.</strong><br />Continue acompanhando alterações de última hora em equipes, presença e arrecadações.</p></div>}
  </section>;
}
