"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, HeartPulse, Palette, Printer, Search, Utensils } from "lucide-react";
import toast from "react-hot-toast";
import { useEcc } from "../hooks/useEcc";
import type { EccCredenciamentoFormData } from "../schemas/ecc.schema";
import type { EccCredenciamento, EccParticipacao } from "../types/ecc.types";

type Props = {
  encontroId: string;
  encontroNome: string;
  participacoes: EccParticipacao[];
  credenciamentos: EccCredenciamento[];
  onSaved: () => Promise<void>;
};

const circulos = ["Amarelo", "Azul", "Branco", "Laranja", "Roxo", "Verde", "Vermelho"] as const;
const papeisDeEquipe = new Set(["EQUIPE", "COORDENADOR"]);
const estilosCirculo: Record<string, { ponto: string; fundo: string; texto: string }> = {
  Amarelo: { ponto: "bg-yellow-400", fundo: "border-yellow-200 bg-yellow-50", texto: "text-yellow-900" },
  Azul: { ponto: "bg-blue-600", fundo: "border-blue-200 bg-blue-50", texto: "text-blue-900" },
  Branco: { ponto: "border border-slate-300 bg-white", fundo: "border-slate-200 bg-white", texto: "text-slate-800" },
  Laranja: { ponto: "bg-orange-500", fundo: "border-orange-200 bg-orange-50", texto: "text-orange-900" },
  Roxo: { ponto: "bg-violet-600", fundo: "border-violet-200 bg-violet-50", texto: "text-violet-900" },
  Verde: { ponto: "bg-emerald-600", fundo: "border-emerald-200 bg-emerald-50", texto: "text-emerald-900" },
  Vermelho: { ponto: "bg-red-600", fundo: "border-red-200 bg-red-50", texto: "text-red-900" },
  "Sem círculo": { ponto: "bg-slate-400", fundo: "border-dashed border-slate-300 bg-slate-50", texto: "text-slate-800" },
};

type Linha = {
  participacao: EccParticipacao;
  registro?: EccCredenciamento;
  circulo: string;
};

function escaparHtml(valor: string) {
  return valor.replace(/[&<>'"]/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[caractere] ?? caractere);
}

function valorCsv(valor: string) {
  return `"${valor.replace(/"/g, '""')}"`;
}

export function CirculosEccSection({ encontroId, encontroNome, participacoes, credenciamentos, onSaved }: Props) {
  const { registrarCredenciamento } = useEcc();
  const [busca, setBusca] = useState("");
  const [filtroCirculo, setFiltroCirculo] = useState("TODOS");
  const [salvando, setSalvando] = useState("");

  const registros = useMemo(() => new Map(credenciamentos.filter((item) => item.encontroId === encontroId).map((item) => [item.casalId, item])), [credenciamentos, encontroId]);
  const linhas = useMemo<Linha[]>(() => participacoes
    .filter((item) => item.encontroId === encontroId && !papeisDeEquipe.has(item.classificacao) && item.situacao !== "DESISTENTE")
    .map((participacao) => {
      const registro = registros.get(participacao.casalId);
      return { participacao, registro, circulo: registro?.circulo || "Sem círculo" };
    })
    .sort((a, b) => a.participacao.casalNome.localeCompare(b.participacao.casalNome, "pt-BR")), [encontroId, participacoes, registros]);

  const exibidas = linhas.filter((item) => {
    const correspondeBusca = item.participacao.casalNome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"));
    return correspondeBusca && (filtroCirculo === "TODOS" || item.circulo === filtroCirculo);
  });
  const semCirculo = linhas.filter((item) => item.circulo === "Sem círculo").length;
  const comRestricao = linhas.filter((item) => item.registro?.restricoesAlimentares.trim()).length;
  const comMedicamentos = linhas.filter((item) => item.registro?.medicamentos.trim()).length;
  const semEmergencia = linhas.filter((item) => !item.registro?.contatoEmergencia.trim()).length;

  function dadosAtuais(item: Linha, circulo: string): EccCredenciamentoFormData {
    return {
      encontroId,
      casalId: item.participacao.casalId,
      status: item.registro?.status ?? "AGUARDANDO",
      crachaEntregue: item.registro?.crachaEntregue ?? false,
      materialEntregue: item.registro?.materialEntregue ?? false,
      restricoesAlimentares: item.registro?.restricoesAlimentares ?? "",
      medicamentos: item.registro?.medicamentos ?? "",
      contatoEmergencia: item.registro?.contatoEmergencia ?? "",
      circulo,
      observacoes: item.registro?.observacoes ?? "",
    };
  }

  async function trocarCirculo(item: Linha, circulo: string) {
    setSalvando(item.participacao.casalId);
    try {
      await registrarCredenciamento(dadosAtuais(item, circulo));
      await onSaved();
      toast.success(circulo ? `${item.participacao.casalNome} foi direcionado ao círculo ${circulo}.` : "Círculo removido; o casal voltou para as pendências.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar o círculo.");
    } finally { setSalvando(""); }
  }

  function baixarCsv() {
    const cabecalho = ["Casal", "Círculo", "Situação", "Restrições alimentares", "Medicamentos e cuidados", "Contato de emergência", "Observações"];
    const corpo = exibidas.map((item) => [
      item.participacao.casalNome, item.circulo, item.participacao.situacao,
      item.registro?.restricoesAlimentares ?? "", item.registro?.medicamentos ?? "",
      item.registro?.contatoEmergencia ?? "", item.registro?.observacoes ?? "",
    ]);
    const conteudo = [cabecalho, ...corpo].map((linha) => linha.map(valorCsv).join(";")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`\ufeff${conteudo}`], { type: "text/csv;charset=utf-8" }));
    link.download = `circulos-${encontroNome.toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/gi, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function imprimir() {
    const janela = window.open("", "_blank", "width=1000,height=720");
    if (!janela) return toast.error("Permita a abertura de janelas para imprimir a lista.");
    const grupos = [...circulos, "Sem círculo"].map((circulo) => ({ circulo, itens: exibidas.filter((item) => item.circulo === circulo) })).filter((grupo) => grupo.itens.length);
    janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Círculos · ${escaparHtml(encontroNome)}</title><style>body{font-family:Arial,sans-serif;color:#172033;margin:32px}h1{margin-bottom:4px}h2{border-bottom:2px solid #1d4ed8;padding-bottom:6px;margin-top:28px}p{margin:4px 0}.casal{padding:10px 0;border-bottom:1px solid #ddd}.alerta{color:#9a3412;font-size:13px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Imprimir</button><h1>${escaparHtml(encontroNome)}</h1><p>Lista de círculos e cuidados especiais · ${new Date().toLocaleDateString("pt-BR")}</p>${grupos.map((grupo) => `<h2>Círculo ${escaparHtml(grupo.circulo)} · ${grupo.itens.length} casal(is)</h2>${grupo.itens.map((item) => `<div class="casal"><strong>${escaparHtml(item.participacao.casalNome)}</strong>${item.registro?.restricoesAlimentares ? `<p class="alerta">Alimentação: ${escaparHtml(item.registro.restricoesAlimentares)}</p>` : ""}${item.registro?.medicamentos ? `<p class="alerta">Medicamentos/cuidados: ${escaparHtml(item.registro.medicamentos)}</p>` : ""}<p>Emergência: ${escaparHtml(item.registro?.contatoEmergencia || "não informado")}</p></div>`).join("")}`).join("")}</body></html>`);
    janela.document.close();
    janela.focus();
  }

  return <section className="space-y-5">
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 to-blue-700 p-6 text-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-blue-200">Organização dos encontristas</p><h2 className="mt-2 text-2xl font-black">Círculos e cuidados especiais</h2><p className="mt-2 max-w-2xl text-sm text-blue-100">Distribua os casais, encontre pendências e entregue às equipes uma lista segura das necessidades operacionais.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={baixarCsv} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-black hover:bg-white/20"><Download size={17} />Baixar planilha</button><button type="button" onClick={imprimir} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-blue-800"><Printer size={17} />Imprimir lista</button></div></div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metrica icon={Palette} titulo="Sem círculo" valor={semCirculo} destaque={semCirculo > 0 ? "text-amber-700" : "text-emerald-700"} apoio="Casais que precisam ser distribuídos" />
      <Metrica icon={Utensils} titulo="Restrições" valor={comRestricao} destaque="text-orange-700" apoio="Cuidados com alimentação" />
      <Metrica icon={HeartPulse} titulo="Medicamentos" valor={comMedicamentos} destaque="text-red-700" apoio="Casais com cuidados registrados" />
      <Metrica icon={AlertTriangle} titulo="Contato pendente" valor={semEmergencia} destaque={semEmergencia > 0 ? "text-amber-700" : "text-emerald-700"} apoio="Sem contato de emergência" />
    </div>

    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-black">Distribuição por círculo</h2><p className="mt-1 text-sm text-slate-500">A mudança é salva imediatamente e não altera os demais dados da ficha operacional.</p></div><div className="flex min-w-64 flex-1 flex-wrap justify-end gap-2"><label className="relative min-w-56 max-w-md flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Localizar casal" className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm" /></label><select value={filtroCirculo} onChange={(event) => setFiltroCirculo(event.target.value)} className="rounded-xl border bg-white px-3 py-2.5 text-sm font-bold"><option value="TODOS">Todos os círculos</option>{[...circulos, "Sem círculo"].map((circulo) => <option key={circulo}>{circulo}</option>)}</select></div></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">{[...circulos, "Sem círculo"].map((circulo) => {
        const itens = exibidas.filter((item) => item.circulo === circulo);
        if (!itens.length && (filtroCirculo !== "TODOS" || busca)) return null;
        const estilo = estilosCirculo[circulo];
        return <article key={circulo} className={`rounded-2xl border p-4 ${estilo.fundo}`}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className={`h-5 w-5 rounded-full ${estilo.ponto}`} /><h3 className={`font-black ${estilo.texto}`}>{circulo === "Sem círculo" ? circulo : `Círculo ${circulo}`}</h3></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm">{itens.length} casal(is)</span></div><div className="mt-3 space-y-2">{itens.map((item) => <div key={item.participacao.id} className="rounded-xl border bg-white p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><strong className="text-sm">{item.participacao.casalNome}</strong><p className="mt-0.5 text-xs text-slate-500">{item.participacao.situacao.toLocaleLowerCase("pt-BR").replace("_", " ")}</p></div><select aria-label={`Círculo de ${item.participacao.casalNome}`} disabled={salvando === item.participacao.casalId} value={item.registro?.circulo ?? ""} onChange={(event) => void trocarCirculo(item, event.target.value)} className="rounded-lg border bg-white px-2.5 py-2 text-xs font-bold disabled:opacity-50"><option value="">Sem círculo</option>{circulos.map((cor) => <option key={cor}>{cor}</option>)}</select></div>{(item.registro?.restricoesAlimentares || item.registro?.medicamentos || !item.registro?.contatoEmergencia) && <div className="mt-2 flex flex-wrap gap-1.5">{item.registro?.restricoesAlimentares && <span className="rounded-full bg-orange-100 px-2 py-1 text-[11px] font-bold text-orange-800">Restrição alimentar</span>}{item.registro?.medicamentos && <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-bold text-red-800">Medicamento/cuidado</span>}{!item.registro?.contatoEmergencia && <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">Emergência pendente</span>}</div>}</div>)}{!itens.length && <p className="rounded-xl bg-white/70 py-6 text-center text-sm text-slate-500">Nenhum casal neste círculo.</p>}</div></article>;
      })}</div>
    </div>

    <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-700"><HeartPulse size={20} /></span><div><h2 className="text-xl font-black">Central de cuidados</h2><p className="text-sm text-slate-500">Informações para alimentação, acolhida e primeiros cuidados.</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{linhas.filter((item) => item.registro?.restricoesAlimentares || item.registro?.medicamentos || item.registro?.contatoEmergencia).map((item) => <article key={item.participacao.id} className="rounded-xl border p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{item.participacao.casalNome}</strong><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">{item.circulo}</span></div>{item.registro?.restricoesAlimentares && <p className="mt-3 text-sm"><span className="font-black text-orange-700">Alimentação:</span> {item.registro.restricoesAlimentares}</p>}{item.registro?.medicamentos && <p className="mt-2 text-sm"><span className="font-black text-red-700">Medicamentos/cuidados:</span> {item.registro.medicamentos}</p>}{item.registro?.contatoEmergencia && <p className="mt-2 text-sm"><span className="font-black text-slate-700">Emergência:</span> {item.registro.contatoEmergencia}</p>}</article>)}{!linhas.some((item) => item.registro?.restricoesAlimentares || item.registro?.medicamentos || item.registro?.contatoEmergencia) && <p className="py-10 text-center text-sm text-slate-500 md:col-span-2">Nenhum cuidado especial informado até o momento.</p>}</div></div>
  </section>;
}

function Metrica({ icon: Icon, titulo, valor, destaque, apoio }: { icon: typeof Palette; titulo: string; valor: number; destaque: string; apoio: string }) {
  return <article className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl bg-slate-50 ${destaque}`}><Icon size={20} /></span><div><p className="text-xs font-black uppercase tracking-wide text-slate-500">{titulo}</p><strong className={`text-3xl ${destaque}`}>{valor}</strong></div></div><p className="mt-2 text-xs text-slate-500">{apoio}</p></article>;
}
