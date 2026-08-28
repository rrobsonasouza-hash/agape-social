"use client";

import { useMemo, useState, type FormEvent } from "react";
import { BarChart3, CheckCircle2, ClipboardCopy, FileDown, FileText, Mail, MessageCircle, Plus, Printer, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useEcc } from "../hooks/useEcc";
import type { EccComunicacaoFormData, EccDocumentoFormData } from "../schemas/ecc.schema";
import type { EccPainel, EccComunicacaoStatus, EccDocumentoStatus } from "../types/ecc.types";

type Props = {
  encontroId: string;
  dados: EccPainel;
  onSaved: () => Promise<void>;
};

const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const label = "grid gap-1 text-sm font-semibold text-slate-700";
const nomesPublico = { TODOS: "Todos", PARTICIPANTES: "Casais participantes", EQUIPE: "Equipe", COORDENACAO: "Coordenação" } as const;
const nomesCanal = { WHATSAPP: "WhatsApp", EMAIL: "E-mail", AVISO: "Aviso interno" } as const;
const nomesComunicacao = { RASCUNHO: "Rascunho", PROGRAMADA: "Programada", ENVIADA: "Enviada", CANCELADA: "Cancelada" } as const;
const nomesDocumento = { PENDENTE: "Pendente", DISPONIVEL: "Disponível", ARQUIVADO: "Arquivado" } as const;
const nomesCategoria = { FICHA: "Ficha", LISTA: "Lista", ROTEIRO: "Roteiro", TERMO: "Termo", MATERIAL: "Material", OUTRO: "Outro" } as const;

function csvCampo(valor: unknown) { return `"${String(valor ?? "").replace(/"/g, '""')}"`; }
function baixarCsv(nome: string, linhas: unknown[][]) {
  const conteudo = `\uFEFF${linhas.map((linha) => linha.map(csvCampo).join(";")).join("\n")}`;
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = nome; link.click(); URL.revokeObjectURL(url);
}

export function GestaoEccSection({ encontroId, dados, onSaved }: Props) {
  const { criarComunicacao, criarDocumento, atualizarComunicacao, atualizarDocumento } = useEcc();
  const [formulario, setFormulario] = useState<"comunicacao" | "documento" | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [comunicacao, setComunicacao] = useState<EccComunicacaoFormData>({ encontroId, titulo: "", mensagem: "", canal: "WHATSAPP", publico: "TODOS", status: "RASCUNHO", programadaPara: "" });
  const [documento, setDocumento] = useState<EccDocumentoFormData>({ encontroId, titulo: "", categoria: "OUTRO", url: "", observacoes: "", status: "PENDENTE" });

  const edicao = dados.encontros.find((item) => item.id === encontroId);
  const participacoes = useMemo(() => dados.participacoes.filter((item) => item.encontroId === encontroId), [dados.participacoes, encontroId]);
  const equipe = useMemo(() => dados.equipe.filter((item) => item.encontroId === encontroId), [dados.equipe, encontroId]);
  const tarefas = useMemo(() => dados.tarefas.filter((item) => item.encontroId === encontroId), [dados.tarefas, encontroId]);
  const agenda = useMemo(() => dados.programacao.filter((item) => item.encontroId === encontroId), [dados.programacao, encontroId]);
  const visitas = useMemo(() => dados.visitas.filter((item) => item.encontroId === encontroId), [dados.visitas, encontroId]);
  const comunicacoes = useMemo(() => dados.comunicacoes.filter((item) => item.encontroId === encontroId), [dados.comunicacoes, encontroId]);
  const documentos = useMemo(() => dados.documentos.filter((item) => item.encontroId === encontroId), [dados.documentos, encontroId]);
  const confirmados = participacoes.filter((item) => ["CONFIRMADO", "PARTICIPOU"].includes(item.situacao)).length;
  const tarefasConcluidas = tarefas.filter((item) => item.status === "CONCLUIDA").length;
  const progressoTarefas = tarefas.length ? Math.round((tarefasConcluidas / tarefas.length) * 100) : 0;

  async function salvarComunicacao(event: FormEvent) {
    event.preventDefault(); setSalvando(true);
    try { await criarComunicacao({ ...comunicacao, encontroId }); toast.success("Comunicação registrada no histórico do ECC."); setFormulario(null); setComunicacao({ encontroId, titulo: "", mensagem: "", canal: "WHATSAPP", publico: "TODOS", status: "RASCUNHO", programadaPara: "" }); await onSaved(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível registrar a comunicação."); }
    finally { setSalvando(false); }
  }
  async function salvarDocumento(event: FormEvent) {
    event.preventDefault(); setSalvando(true);
    try { await criarDocumento({ ...documento, encontroId }); toast.success("Documento incluído na edição."); setFormulario(null); setDocumento({ encontroId, titulo: "", categoria: "OUTRO", url: "", observacoes: "", status: "PENDENTE" }); await onSaved(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível registrar o documento."); }
    finally { setSalvando(false); }
  }
  async function mudarComunicacao(id: string, status: EccComunicacaoStatus) { try { await atualizarComunicacao(id, status); await onSaved(); toast.success("Situação da comunicação atualizada."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar."); } }
  async function mudarDocumento(id: string, status: EccDocumentoStatus) { try { await atualizarDocumento(id, status); await onSaved(); toast.success("Situação do documento atualizada."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar."); } }
  function exportarCasais() {
    const linhas = [["Casal", "Papel", "Situação", "Telefone", "E-mail", "Cidade/UF"]];
    for (const item of participacoes) { const casal = dados.casais.find((registro) => registro.id === item.casalId); linhas.push([item.casalNome, item.classificacao, item.situacao, casal?.telefone ?? "", casal?.email ?? "", [casal?.cidade, casal?.estado].filter(Boolean).join("/")]); }
    baixarCsv(`ecc-${edicao?.numero ?? "edicao"}-casais.csv`, linhas);
  }
  function exportarOperacao() {
    const linhas = [["Tipo", "Título", "Responsável/Equipe", "Data/Prazo", "Situação"]];
    agenda.forEach((item) => linhas.push(["Cronograma", item.titulo, item.responsavelNome || item.equipe, `${item.data} ${item.horaInicio}`, item.status]));
    tarefas.forEach((item) => linhas.push(["Tarefa", item.titulo, item.responsavelNome || item.equipe, item.prazo, item.status]));
    baixarCsv(`ecc-${edicao?.numero ?? "edicao"}-operacao.csv`, linhas);
  }

  return <section className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><Users className="text-blue-600" /><p className="mt-3 text-xs font-black uppercase text-slate-500">Confirmações</p><strong className="text-3xl">{confirmados}/{participacoes.length}</strong><p className="text-sm text-slate-500">casais confirmados</p></article>
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><CheckCircle2 className="text-emerald-600" /><p className="mt-3 text-xs font-black uppercase text-slate-500">Plano de ação</p><strong className="text-3xl">{progressoTarefas}%</strong><p className="text-sm text-slate-500">{tarefasConcluidas} de {tarefas.length} tarefas</p></article>
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><MessageCircle className="text-amber-600" /><p className="mt-3 text-xs font-black uppercase text-slate-500">Comunicações</p><strong className="text-3xl">{comunicacoes.length}</strong><p className="text-sm text-slate-500">{comunicacoes.filter((item) => item.status === "ENVIADA").length} enviadas</p></article>
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><FileText className="text-violet-600" /><p className="mt-3 text-xs font-black uppercase text-slate-500">Documentos</p><strong className="text-3xl">{documentos.length}</strong><p className="text-sm text-slate-500">{documentos.filter((item) => item.status === "DISPONIVEL").length} disponíveis</p></article>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black"><Mail size={20} />Central de comunicação</h2><p className="text-sm text-slate-500">Prepare mensagens e mantenha o histórico por público e canal.</p></div><button onClick={() => setFormulario(formulario === "comunicacao" ? null : "comunicacao")} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white"><Plus size={16} className="mr-1 inline" />Nova mensagem</button></div>
        {formulario === "comunicacao" && <form onSubmit={salvarComunicacao} className="mt-5 grid gap-3 rounded-xl bg-blue-50 p-4 sm:grid-cols-2"><label className={`${label} sm:col-span-2`}>Assunto<input required className={campo} value={comunicacao.titulo} onChange={(e) => setComunicacao({ ...comunicacao, titulo: e.target.value })} /></label><label className={label}>Canal<select className={campo} value={comunicacao.canal} onChange={(e) => setComunicacao({ ...comunicacao, canal: e.target.value as EccComunicacaoFormData["canal"] })}>{Object.entries(nomesCanal).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label><label className={label}>Público<select className={campo} value={comunicacao.publico} onChange={(e) => setComunicacao({ ...comunicacao, publico: e.target.value as EccComunicacaoFormData["publico"] })}>{Object.entries(nomesPublico).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label><label className={`${label} sm:col-span-2`}>Mensagem<textarea required className={`${campo} min-h-28`} value={comunicacao.mensagem} onChange={(e) => setComunicacao({ ...comunicacao, mensagem: e.target.value })} /></label><label className={label}>Situação<select className={campo} value={comunicacao.status} onChange={(e) => setComunicacao({ ...comunicacao, status: e.target.value as EccComunicacaoFormData["status"] })}>{Object.entries(nomesComunicacao).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label><label className={label}>Programar para<input type="datetime-local" className={campo} value={comunicacao.programadaPara} onChange={(e) => setComunicacao({ ...comunicacao, programadaPara: e.target.value })} /></label><button disabled={salvando} className="rounded-xl bg-blue-600 px-4 py-3 font-black text-white sm:col-span-2">Registrar comunicação</button></form>}
        <div className="mt-4 space-y-2">{comunicacoes.map((item) => <div key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{item.titulo}</strong><p className="text-xs text-slate-500">{nomesCanal[item.canal]} · {nomesPublico[item.publico]}</p></div><select className="rounded-lg border bg-white px-2 py-1.5 text-xs font-bold" value={item.status} onChange={(e) => void mudarComunicacao(item.id, e.target.value as EccComunicacaoStatus)}>{Object.entries(nomesComunicacao).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></div><p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{item.mensagem}</p><button type="button" onClick={() => void navigator.clipboard.writeText(item.mensagem).then(() => toast.success("Mensagem copiada."))} className="mt-3 inline-flex items-center gap-1 text-xs font-black text-blue-700"><ClipboardCopy size={14} />Copiar mensagem</button></div>)}{!comunicacoes.length && <p className="py-8 text-center text-sm text-slate-500">Nenhuma comunicação registrada.</p>}</div>
      </article>

      <article className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black"><FileText size={20} />Documentos da edição</h2><p className="text-sm text-slate-500">Controle fichas, listas, termos, roteiros e materiais.</p></div><button onClick={() => setFormulario(formulario === "documento" ? null : "documento")} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white"><Plus size={16} className="mr-1 inline" />Novo documento</button></div>
        {formulario === "documento" && <form onSubmit={salvarDocumento} className="mt-5 grid gap-3 rounded-xl bg-violet-50 p-4 sm:grid-cols-2"><label className={`${label} sm:col-span-2`}>Documento<input required className={campo} value={documento.titulo} onChange={(e) => setDocumento({ ...documento, titulo: e.target.value })} /></label><label className={label}>Categoria<select className={campo} value={documento.categoria} onChange={(e) => setDocumento({ ...documento, categoria: e.target.value as EccDocumentoFormData["categoria"] })}>{Object.entries(nomesCategoria).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label><label className={label}>Situação<select className={campo} value={documento.status} onChange={(e) => setDocumento({ ...documento, status: e.target.value as EccDocumentoFormData["status"] })}>{Object.entries(nomesDocumento).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label><label className={`${label} sm:col-span-2`}>Link do arquivo<input type="url" className={campo} placeholder="https://..." value={documento.url} onChange={(e) => setDocumento({ ...documento, url: e.target.value })} /></label><label className={`${label} sm:col-span-2`}>Observações<textarea className={`${campo} min-h-20`} value={documento.observacoes} onChange={(e) => setDocumento({ ...documento, observacoes: e.target.value })} /></label><button disabled={salvando} className="rounded-xl bg-blue-600 px-4 py-3 font-black text-white sm:col-span-2">Registrar documento</button></form>}
        <div className="mt-4 space-y-2">{documentos.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><strong>{item.titulo}</strong><p className="text-xs text-slate-500">{nomesCategoria[item.categoria]}{item.observacoes && ` · ${item.observacoes}`}</p>{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-black text-blue-700">Abrir arquivo</a>}</div><select className="rounded-lg border bg-white px-2 py-1.5 text-xs font-bold" value={item.status} onChange={(e) => void mudarDocumento(item.id, e.target.value as EccDocumentoStatus)}>{Object.entries(nomesDocumento).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></div>)}{!documentos.length && <p className="py-8 text-center text-sm text-slate-500">Nenhum documento registrado.</p>}</div>
      </article>
    </div>

    <article className="rounded-2xl border bg-white p-5 shadow-sm print:border-0 print:shadow-none"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-xl font-black"><BarChart3 size={20} />Relatórios da edição</h2><p className="text-sm text-slate-500">Exporte dados operacionais ou imprima o resumo gerencial.</p></div><div className="flex flex-wrap gap-2 print:hidden"><button onClick={exportarCasais} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-black"><FileDown size={16} />Casais CSV</button><button onClick={exportarOperacao} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-black"><FileDown size={16} />Operação CSV</button><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white"><Printer size={16} />Imprimir resumo</button></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Casais na edição</p><strong className="text-2xl">{participacoes.length}</strong></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Equipe mobilizada</p><strong className="text-2xl">{equipe.length}</strong></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Cronograma</p><strong className="text-2xl">{agenda.length}</strong></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Visitas realizadas</p><strong className="text-2xl">{visitas.filter((item) => item.status === "REALIZADA").length}/{visitas.length}</strong></div></div>
    </article>
  </section>;
}
