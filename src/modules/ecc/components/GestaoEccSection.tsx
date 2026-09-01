"use client";

import { useMemo, useState, type FormEvent } from "react";
import { BarChart3, CheckCircle2, ClipboardCopy, ExternalLink, FileDown, FileText, HeartHandshake, Mail, MessageCircle, Plus, Printer, Star, Trash2, UploadCloud, UserPlus, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useEcc } from "../hooks/useEcc";
import { EncerramentoEccSection } from "./EncerramentoEccSection";
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
  const { criarComunicacao, criarDocumento, enviarDocumento, abrirDocumento, excluirDocumento, atualizarComunicacao, atualizarDocumento } = useEcc();
  const [formulario, setFormulario] = useState<"comunicacao" | "documento" | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [comunicacao, setComunicacao] = useState<EccComunicacaoFormData>({ encontroId, titulo: "", mensagem: "", canal: "WHATSAPP", publico: "TODOS", status: "RASCUNHO", programadaPara: "" });
  const [documento, setDocumento] = useState<EccDocumentoFormData>({ encontroId, titulo: "", categoria: "OUTRO", url: "", observacoes: "", status: "PENDENTE" });
  const [arquivoDocumento, setArquivoDocumento] = useState<File | null>(null);

  const edicao = dados.encontros.find((item) => item.id === encontroId);
  const participacoes = useMemo(() => dados.participacoes.filter((item) => item.encontroId === encontroId), [dados.participacoes, encontroId]);
  const equipe = useMemo(() => dados.equipe.filter((item) => item.encontroId === encontroId), [dados.equipe, encontroId]);
  const tarefas = useMemo(() => dados.tarefas.filter((item) => item.encontroId === encontroId), [dados.tarefas, encontroId]);
  const agenda = useMemo(() => dados.programacao.filter((item) => item.encontroId === encontroId), [dados.programacao, encontroId]);
  const visitas = useMemo(() => dados.visitas.filter((item) => item.encontroId === encontroId), [dados.visitas, encontroId]);
  const comunicacoes = useMemo(() => dados.comunicacoes.filter((item) => item.encontroId === encontroId), [dados.comunicacoes, encontroId]);
  const documentos = useMemo(() => dados.documentos.filter((item) => item.encontroId === encontroId), [dados.documentos, encontroId]);
  const credenciamentos = useMemo(() => dados.credenciamentos.filter((item) => item.encontroId === encontroId), [dados.credenciamentos, encontroId]);
  const posEncontro = useMemo(() => dados.posEncontro.filter((item) => item.encontroId === encontroId), [dados.posEncontro, encontroId]);
  const casaisParticipantes = participacoes.filter((item) => ["INDICADO", "ENCONTRISTA", "CONVIDADO", "VISITANTE"].includes(item.classificacao) && item.situacao !== "DESISTENTE");
  const confirmados = participacoes.filter((item) => ["CONFIRMADO", "PARTICIPOU"].includes(item.situacao)).length;
  const tarefasConcluidas = tarefas.filter((item) => item.status === "CONCLUIDA").length;
  const progressoTarefas = tarefas.length ? Math.round((tarefasConcluidas / tarefas.length) * 100) : 0;
  const notas = posEncontro.flatMap((item) => item.avaliacao === null ? [] : [item.avaliacao]);
  const mediaAvaliacao = notas.length ? notas.reduce((total, nota) => total + nota, 0) / notas.length : 0;
  const taxaResposta = casaisParticipantes.length ? Math.round((posEncontro.length / casaisParticipantes.length) * 100) : 0;
  const distribuicaoNotas = [5, 4, 3, 2, 1].map((nota) => ({ nota, quantidade: notas.filter((valor) => valor === nota).length }));
  const areasInteresse = [...posEncontro.flatMap((item) => item.areasInteresse).reduce((mapa, area) => mapa.set(area, (mapa.get(area) ?? 0) + 1), new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]);

  async function salvarComunicacao(event: FormEvent) {
    event.preventDefault(); setSalvando(true);
    try { await criarComunicacao({ ...comunicacao, encontroId }); toast.success("Comunicação registrada no histórico do ECC."); setFormulario(null); setComunicacao({ encontroId, titulo: "", mensagem: "", canal: "WHATSAPP", publico: "TODOS", status: "RASCUNHO", programadaPara: "" }); await onSaved(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível registrar a comunicação."); }
    finally { setSalvando(false); }
  }
  async function salvarDocumento(event: FormEvent) {
    event.preventDefault(); setSalvando(true);
    try {
      if (arquivoDocumento) await enviarDocumento({ ...documento, encontroId, url: "", status: documento.status === "PENDENTE" ? "DISPONIVEL" : documento.status }, arquivoDocumento);
      else await criarDocumento({ ...documento, encontroId });
      toast.success(arquivoDocumento ? "Arquivo enviado ao cofre privado do ECC." : "Documento incluído na edição.");
      setFormulario(null); setArquivoDocumento(null);
      setDocumento({ encontroId, titulo: "", categoria: "OUTRO", url: "", observacoes: "", status: "PENDENTE" }); await onSaved();
    }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível registrar o documento."); }
    finally { setSalvando(false); }
  }
  async function mudarComunicacao(id: string, status: EccComunicacaoStatus) { try { await atualizarComunicacao(id, status); await onSaved(); toast.success("Situação da comunicação atualizada."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar."); } }
  async function mudarDocumento(id: string, status: EccDocumentoStatus) { try { await atualizarDocumento(id, status); await onSaved(); toast.success("Situação do documento atualizada."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar."); } }
  async function abrirArquivo(id: string) { try { const resposta = await abrirDocumento(id); window.open(resposta.url, "_blank", "noopener,noreferrer"); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível abrir o arquivo."); } }
  async function removerArquivo(id: string) { if (!window.confirm("Excluir este documento e seu arquivo privado?")) return; try { await excluirDocumento(id); await onSaved(); toast.success("Documento excluído."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível excluir o documento."); } }
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
  function exportarPosEncontro() {
    const linhas: unknown[][] = [["Casal", "Avaliação", "Testemunho", "Interesse em servir", "Áreas", "Acompanhamento pastoral", "Observações do acompanhamento", "Situação"]];
    for (const item of posEncontro) linhas.push([item.casalNome, item.avaliacao ?? "", item.testemunho, item.interesseTrabalhar ? "Sim" : "Não", item.areasInteresse.join(", "), item.acompanhamentoNecessario ? "Sim" : "Não", item.acompanhamentoObservacoes, item.status]);
    baixarCsv(`ecc-${edicao?.numero ?? "edicao"}-pos-encontro.csv`, linhas);
  }

  return <section className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><Users className="text-blue-600" /><p className="mt-3 text-xs font-black uppercase text-slate-500">Confirmações</p><strong className="text-3xl">{confirmados}/{participacoes.length}</strong><p className="text-sm text-slate-500">casais confirmados</p></article>
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><CheckCircle2 className="text-emerald-600" /><p className="mt-3 text-xs font-black uppercase text-slate-500">Plano de ação</p><strong className="text-3xl">{progressoTarefas}%</strong><p className="text-sm text-slate-500">{tarefasConcluidas} de {tarefas.length} tarefas</p></article>
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><MessageCircle className="text-amber-600" /><p className="mt-3 text-xs font-black uppercase text-slate-500">Comunicações</p><strong className="text-3xl">{comunicacoes.length}</strong><p className="text-sm text-slate-500">{comunicacoes.filter((item) => item.status === "ENVIADA").length} enviadas</p></article>
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><FileText className="text-violet-600" /><p className="mt-3 text-xs font-black uppercase text-slate-500">Documentos</p><strong className="text-3xl">{documentos.length}</strong><p className="text-sm text-slate-500">{documentos.filter((item) => item.status === "DISPONIVEL").length} disponíveis</p></article>
    </div>

    {dados.podeGerenciarPosEncontro && <article className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-xl font-black"><HeartHandshake size={21} />Decisões do pós-encontro</h2><p className="text-sm text-slate-500">Transforme as respostas dos casais em acompanhamento e planejamento para a próxima edição.</p></div><button type="button" onClick={exportarPosEncontro} disabled={!posEncontro.length} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black text-violet-700 disabled:opacity-50"><FileDown size={16} />Exportar respostas</button></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-xl bg-violet-50 p-4"><MessageCircle className="text-violet-700" size={20} /><p className="mt-2 text-xs font-black uppercase text-slate-500">Adesão</p><strong className="text-2xl">{taxaResposta}%</strong><p className="text-xs text-slate-500">{posEncontro.length} de {casaisParticipantes.length} casais</p></div><div className="rounded-xl bg-amber-50 p-4"><Star className="text-amber-500" size={20} /><p className="mt-2 text-xs font-black uppercase text-slate-500">Avaliação média</p><strong className="text-2xl">{mediaAvaliacao ? mediaAvaliacao.toFixed(1) : "—"}</strong><p className="text-xs text-slate-500">de 5 estrelas</p></div><div className="rounded-xl bg-rose-50 p-4"><HeartHandshake className="text-rose-600" size={20} /><p className="mt-2 text-xs font-black uppercase text-slate-500">Cuidado pastoral</p><strong className="text-2xl">{posEncontro.filter((item) => item.acompanhamentoNecessario && item.status !== "CONCLUIDO").length}</strong><p className="text-xs text-slate-500">acompanhamentos abertos</p></div><div className="rounded-xl bg-emerald-50 p-4"><UserPlus className="text-emerald-700" size={20} /><p className="mt-2 text-xs font-black uppercase text-slate-500">Próximos voluntários</p><strong className="text-2xl">{posEncontro.filter((item) => item.interesseTrabalhar).length}</strong><p className="text-xs text-slate-500">casais interessados</p></div></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2"><div><h3 className="text-sm font-black text-slate-800">Distribuição das avaliações</h3><div className="mt-3 space-y-2">{distribuicaoNotas.map((item) => { const percentual = notas.length ? Math.round((item.quantidade / notas.length) * 100) : 0; return <div key={item.nota} className="grid grid-cols-[72px_1fr_48px] items-center gap-2 text-xs"><span className="font-bold text-slate-600">{item.nota} estrela{item.nota > 1 ? "s" : ""}</span><span className="h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${percentual}%` }} /></span><strong className="text-right">{item.quantidade}</strong></div>; })}</div></div><div><h3 className="text-sm font-black text-slate-800">Áreas com maior interesse</h3><div className="mt-3 flex flex-wrap gap-2">{areasInteresse.map(([area, quantidade]) => <span key={area} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">{area} · {quantidade}</span>)}{!areasInteresse.length && <p className="text-sm text-slate-500">Nenhuma área indicada até o momento.</p>}</div></div></div>
      {posEncontro.some((item) => item.avaliacao !== null && item.avaliacao <= 2) && <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><strong>Atenção da coordenação:</strong> existem avaliações de 1 ou 2 estrelas. Consulte a exportação e os testemunhos para entender os pontos de melhoria.</p>}
    </article>}

    <EncerramentoEccSection encontroId={encontroId} dados={dados} onSaved={onSaved} />

    <div className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black"><Mail size={20} />Central de comunicação</h2><p className="text-sm text-slate-500">Prepare mensagens e mantenha o histórico por público e canal.</p></div><button onClick={() => setFormulario(formulario === "comunicacao" ? null : "comunicacao")} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white"><Plus size={16} className="mr-1 inline" />Nova mensagem</button></div>
        {formulario === "comunicacao" && <form onSubmit={salvarComunicacao} className="mt-5 grid gap-3 rounded-xl bg-blue-50 p-4 sm:grid-cols-2"><label className={`${label} sm:col-span-2`}>Assunto<input required className={campo} value={comunicacao.titulo} onChange={(e) => setComunicacao({ ...comunicacao, titulo: e.target.value })} /></label><label className={label}>Canal<select className={campo} value={comunicacao.canal} onChange={(e) => setComunicacao({ ...comunicacao, canal: e.target.value as EccComunicacaoFormData["canal"] })}>{Object.entries(nomesCanal).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label><label className={label}>Público<select className={campo} value={comunicacao.publico} onChange={(e) => setComunicacao({ ...comunicacao, publico: e.target.value as EccComunicacaoFormData["publico"] })}>{Object.entries(nomesPublico).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label><label className={`${label} sm:col-span-2`}>Mensagem<textarea required className={`${campo} min-h-28`} value={comunicacao.mensagem} onChange={(e) => setComunicacao({ ...comunicacao, mensagem: e.target.value })} /></label><label className={label}>Situação<select className={campo} value={comunicacao.status} onChange={(e) => setComunicacao({ ...comunicacao, status: e.target.value as EccComunicacaoFormData["status"] })}>{Object.entries(nomesComunicacao).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label><label className={label}>Programar para<input type="datetime-local" className={campo} value={comunicacao.programadaPara} onChange={(e) => setComunicacao({ ...comunicacao, programadaPara: e.target.value })} /></label><button disabled={salvando} className="rounded-xl bg-blue-600 px-4 py-3 font-black text-white sm:col-span-2">Registrar comunicação</button></form>}
        <div className="mt-4 space-y-2">{comunicacoes.map((item) => <div key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{item.titulo}</strong><p className="text-xs text-slate-500">{nomesCanal[item.canal]} · {nomesPublico[item.publico]}</p></div><select className="rounded-lg border bg-white px-2 py-1.5 text-xs font-bold" value={item.status} onChange={(e) => void mudarComunicacao(item.id, e.target.value as EccComunicacaoStatus)}>{Object.entries(nomesComunicacao).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></div><p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{item.mensagem}</p><button type="button" onClick={() => void navigator.clipboard.writeText(item.mensagem).then(() => toast.success("Mensagem copiada."))} className="mt-3 inline-flex items-center gap-1 text-xs font-black text-blue-700"><ClipboardCopy size={14} />Copiar mensagem</button></div>)}{!comunicacoes.length && <p className="py-8 text-center text-sm text-slate-500">Nenhuma comunicação registrada.</p>}</div>
      </article>

      <article className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black"><FileText size={20} />Documentos da edição</h2><p className="text-sm text-slate-500">Controle fichas, listas, termos, roteiros e materiais.</p></div><button onClick={() => setFormulario(formulario === "documento" ? null : "documento")} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white"><Plus size={16} className="mr-1 inline" />Novo documento</button></div>
        {formulario === "documento" && <form onSubmit={salvarDocumento} className="mt-5 grid gap-3 rounded-xl bg-violet-50 p-4 sm:grid-cols-2">
          <label className={`${label} sm:col-span-2`}>Documento<input required className={campo} value={documento.titulo} onChange={(e) => setDocumento({ ...documento, titulo: e.target.value })} /></label>
          <label className={label}>Categoria<select className={campo} value={documento.categoria} onChange={(e) => setDocumento({ ...documento, categoria: e.target.value as EccDocumentoFormData["categoria"] })}>{Object.entries(nomesCategoria).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label>
          <label className={label}>Situação<select className={campo} value={documento.status} onChange={(e) => setDocumento({ ...documento, status: e.target.value as EccDocumentoFormData["status"] })}>{Object.entries(nomesDocumento).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label>
          <label className={`${label} sm:col-span-2`}>Enviar arquivo privado<span className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-violet-300 bg-white p-4 text-violet-800"><UploadCloud size={24} /><span><strong>{arquivoDocumento?.name || "Selecionar arquivo"}</strong><small className="block font-normal text-slate-500">PDF, Word, Excel, JPG ou PNG · máximo 10 MB</small></span><input type="file" className="sr-only" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(e) => setArquivoDocumento(e.target.files?.[0] ?? null)} /></span></label>
          <div className="sm:col-span-2 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200" />ou informe um link externo<span className="h-px flex-1 bg-slate-200" /></div>
          <label className={`${label} sm:col-span-2`}>Link externo opcional<input type="url" disabled={!!arquivoDocumento} className={`${campo} disabled:bg-slate-100`} placeholder="https://..." value={documento.url} onChange={(e) => setDocumento({ ...documento, url: e.target.value })} /></label>
          <label className={`${label} sm:col-span-2`}>Observações<textarea className={`${campo} min-h-20`} value={documento.observacoes} onChange={(e) => setDocumento({ ...documento, observacoes: e.target.value })} /></label>
          <button disabled={salvando} className="rounded-xl bg-blue-600 px-4 py-3 font-black text-white disabled:opacity-50 sm:col-span-2">{salvando ? "Salvando documento..." : arquivoDocumento ? "Enviar para o cofre privado" : documento.url ? "Registrar link externo" : "Registrar documento pendente"}</button>
        </form>}
        <div className="mt-4 space-y-2">{documentos.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><strong>{item.titulo}</strong><p className="text-xs text-slate-500">{nomesCategoria[item.categoria]}{item.nomeArquivo && ` · ${item.nomeArquivo}`}{item.tamanhoBytes > 0 && ` · ${(item.tamanhoBytes / 1024 / 1024).toFixed(1)} MB`}{item.observacoes && ` · ${item.observacoes}`}</p><button type="button" onClick={() => void abrirArquivo(item.id)} className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blue-700"><ExternalLink size={14} />{item.caminhoStorage ? "Abrir arquivo protegido" : "Abrir link externo"}</button></div><div className="flex items-center gap-2"><select className="rounded-lg border bg-white px-2 py-1.5 text-xs font-bold" value={item.status} onChange={(e) => void mudarDocumento(item.id, e.target.value as EccDocumentoStatus)}>{Object.entries(nomesDocumento).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select><button type="button" title="Excluir documento" onClick={() => void removerArquivo(item.id)} className="rounded-lg border border-red-200 p-2 text-red-700"><Trash2 size={15} /></button></div></div>)}{!documentos.length && <p className="py-8 text-center text-sm text-slate-500">Nenhum documento registrado.</p>}</div>
      </article>
    </div>

    <article className="rounded-2xl border bg-white p-5 shadow-sm print:border-0 print:shadow-none"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-xl font-black"><BarChart3 size={20} />Relatórios da edição</h2><p className="text-sm text-slate-500">Exporte dados operacionais ou imprima o resumo gerencial.</p></div><div className="flex flex-wrap gap-2 print:hidden"><button onClick={exportarCasais} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-black"><FileDown size={16} />Casais CSV</button><button onClick={exportarOperacao} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-black"><FileDown size={16} />Operação CSV</button><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white"><Printer size={16} />Imprimir resumo</button></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Casais na edição</p><strong className="text-2xl">{participacoes.length}</strong></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Credenciados</p><strong className="text-2xl">{credenciamentos.filter((item) => item.status === "CREDENCIADO").length}</strong></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Equipe mobilizada</p><strong className="text-2xl">{equipe.length}</strong></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Cronograma</p><strong className="text-2xl">{agenda.length}</strong></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Visitas realizadas</p><strong className="text-2xl">{visitas.filter((item) => item.status === "REALIZADA").length}/{visitas.length}</strong></div></div>
    </article>
  </section>;
}
