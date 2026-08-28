"use client";

import { useMemo, useState, type FormEvent } from "react";
import { BarChart3, CircleDollarSign, Download, PackageCheck, Pencil, Plus, Search, ShoppingCart, TriangleAlert, type LucideIcon } from "lucide-react";
import { useEcc } from "../hooks/useEcc";
import type { EccArrecadacaoFormData } from "../schemas/ecc.schema";
import type { EccArrecadacao, EccCasalDoador } from "../types/ecc.types";

const campo = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500";
const label = "text-sm font-bold text-slate-700";
const dinheiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formularioInicial(encontroId: string): EccArrecadacaoFormData {
  return { encontroId, categoria: "ALIMENTO", item: "", responsavel: "", telefone: "", unidade: "unidade", quantidadePrometida: 0, quantidadeRecebida: 0, valorPrometido: 0, valorRecebido: 0, status: "PENDENTE", observacoes: "" };
}

const nomesCategoria = { ALIMENTO: "Alimento", BEBIDA: "Bebida", VALOR: "Valor em dinheiro", OUTRO: "Outro item" } as const;
const nomesStatus = { PENDENTE: "Pendente", PARCIAL: "Recebido em parte", RECEBIDO: "Recebido", CANCELADO: "Cancelado" } as const;
const itensSugeridos = ["Arroz", "Feijão", "Óleo", "Açúcar", "Café", "Leite", "Macarrão", "Molho de tomate", "Farinha", "Sal", "Refrigerante", "Água", "Suco", "Carne", "Frango", "Legumes", "Frutas", "Pães", "Descartáveis", "Material de limpeza"];

export function ArrecadacaoEccSection({ encontroId, arrecadacoes, casaisDoadores, onSaved }: { encontroId: string; arrecadacoes: EccArrecadacao[]; casaisDoadores: EccCasalDoador[]; onSaved: () => Promise<void> }) {
  const { criarArrecadacao, atualizarArrecadacao } = useEcc();
  const [formulario, setFormulario] = useState<EccArrecadacaoFormData>(() => formularioInicial(encontroId));
  const [editando, setEditando] = useState<string>("");
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [busca, setBusca] = useState("");

  const resumo = useMemo(() => ({
    materiais: arrecadacoes.filter((item) => item.categoria !== "VALOR" && item.status !== "CANCELADO").length,
    concluidos: arrecadacoes.filter((item) => item.status === "RECEBIDO").length,
    pendentes: arrecadacoes.filter((item) => item.status === "PENDENTE" || item.status === "PARCIAL").length,
    valorPrometido: arrecadacoes.filter((item) => item.status !== "CANCELADO").reduce((total, item) => total + item.valorPrometido, 0),
    valorRecebido: arrecadacoes.filter((item) => item.status !== "CANCELADO").reduce((total, item) => total + item.valorRecebido, 0),
  }), [arrecadacoes]);

  const evolucao = useMemo(() => {
    const ativos = arrecadacoes.filter((item) => item.status !== "CANCELADO");
    const percentuais = ativos.map((item) => {
      const prometido = item.categoria === "VALOR" ? item.valorPrometido : item.quantidadePrometida;
      const recebido = item.categoria === "VALOR" ? item.valorRecebido : item.quantidadeRecebida;
      return prometido > 0 ? Math.min(100, (recebido / prometido) * 100) : 0;
    });
    const geral = percentuais.length ? Math.round(percentuais.reduce((total, valor) => total + valor, 0) / percentuais.length) : 0;
    const grupos = new Map<string, { item: string; unidade: string; categoria: EccArrecadacao["categoria"]; prometido: number; recebido: number; casais: Set<string> }>();
    for (const registro of ativos) {
      const unidade = registro.categoria === "VALOR" ? "R$" : registro.unidade;
      const chave = `${registro.categoria}|${registro.item.toLocaleLowerCase("pt-BR")}|${unidade}`;
      const atual = grupos.get(chave) ?? { item: registro.item, unidade, categoria: registro.categoria, prometido: 0, recebido: 0, casais: new Set<string>() };
      atual.prometido += registro.categoria === "VALOR" ? registro.valorPrometido : registro.quantidadePrometida;
      atual.recebido += registro.categoria === "VALOR" ? registro.valorRecebido : registro.quantidadeRecebida;
      if (registro.responsavel) atual.casais.add(registro.responsavel);
      grupos.set(chave, atual);
    }
    const itens = [...grupos.values()]
      .map((grupo) => ({ ...grupo, percentual: grupo.prometido > 0 ? Math.min(100, Math.round((grupo.recebido / grupo.prometido) * 100)) : 0 }))
      .sort((a, b) => a.percentual - b.percentual || a.item.localeCompare(b.item, "pt-BR"));
    return { geral, itens };
  }, [arrecadacoes]);

  const registrosFiltrados = useMemo(() => arrecadacoes.filter((item) => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return (filtroStatus === "TODOS" || item.status === filtroStatus)
      && (filtroCategoria === "TODAS" || item.categoria === filtroCategoria)
      && (!termo || `${item.item} ${item.responsavel}`.toLocaleLowerCase("pt-BR").includes(termo));
  }), [arrecadacoes, busca, filtroCategoria, filtroStatus]);

  function exportarRelatorio() {
    const escapar = (valor: unknown) => `"${String(valor ?? "").replaceAll('"', '""')}"`;
    const linhas = [["Categoria", "Item", "Casal doador", "Telefone", "Prometido", "Recebido", "Unidade", "Situação"], ...registrosFiltrados.map((item) => [nomesCategoria[item.categoria], item.item, item.responsavel, item.telefone, item.categoria === "VALOR" ? item.valorPrometido : item.quantidadePrometida, item.categoria === "VALOR" ? item.valorRecebido : item.quantidadeRecebida, item.categoria === "VALOR" ? "R$" : item.unidade, nomesStatus[item.status]])];
    const arquivo = new Blob(["\uFEFF", linhas.map((linha) => linha.map(escapar).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url; link.download = "doacoes-ecc.csv"; link.click(); URL.revokeObjectURL(url);
  }

  function novo() {
    setFormulario(formularioInicial(encontroId)); setEditando(""); setMensagem(""); setAberto(true);
  }

  function editar(item: EccArrecadacao) {
    setFormulario({ encontroId: item.encontroId, categoria: item.categoria, item: item.item, responsavel: item.responsavel, telefone: item.telefone, unidade: item.unidade, quantidadePrometida: item.quantidadePrometida, quantidadeRecebida: item.quantidadeRecebida, valorPrometido: item.valorPrometido, valorRecebido: item.valorRecebido, status: item.status, observacoes: item.observacoes });
    setEditando(item.id); setMensagem(""); setAberto(true);
    requestAnimationFrame(() => document.getElementById("form-arrecadacao-ecc")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault(); setSalvando(true); setMensagem("");
    try {
      if (editando) await atualizarArrecadacao(editando, formulario); else await criarArrecadacao(formulario);
      await onSaved(); setAberto(false); setEditando(""); setFormulario(formularioInicial(encontroId));
    } catch (error) { setMensagem(error instanceof Error ? error.message : "Não foi possível salvar a arrecadação."); }
    finally { setSalvando(false); }
  }

  return <section className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {([
        ["Doações combinadas", resumo.materiais, ShoppingCart], ["Doações recebidas", resumo.concluidos, PackageCheck],
        ["Pendências", resumo.pendentes, TriangleAlert], ["Valores prometidos", dinheiro.format(resumo.valorPrometido), CircleDollarSign],
        ["Valores recebidos", dinheiro.format(resumo.valorRecebido), CircleDollarSign],
      ] as Array<[string, string | number, LucideIcon]>).map(([titulo, valor, Icone]) => <article key={titulo} className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icone size={20} /></span><div><p className="text-xs font-black uppercase tracking-wide text-slate-500">{titulo}</p><strong className="text-xl text-slate-900">{valor}</strong></div></div></article>)}
    </div>

    <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
      <article className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><BarChart3 size={22} /></span><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Evolução geral</p><h2 className="text-xl font-black">Recebimento das doações</h2></div></div>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-2"><strong className="text-4xl text-slate-950">{evolucao.geral}%</strong><span className="text-sm font-bold text-slate-500">{resumo.concluidos} de {arrecadacoes.filter((item) => item.status !== "CANCELADO").length} compromisso(s) concluído(s)</span></div>
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all" style={{ width: `${evolucao.geral}%` }} /></div>
        <p className="mt-3 text-xs text-slate-500">Percentual médio recebido em cada compromisso, sem misturar quilos, litros, unidades e valores.</p>
      </article>
      <article className="rounded-2xl border bg-white p-5 shadow-sm">
        <div><p className="text-xs font-black uppercase tracking-widest text-amber-700">Atenção da coordenação</p><h2 className="mt-1 text-xl font-black">Itens com menor evolução</h2></div>
        <div className="mt-4 space-y-3">{evolucao.itens.slice(0, 5).map((grupo) => <div key={`${grupo.categoria}-${grupo.item}-${grupo.unidade}`}><div className="mb-1 flex items-center justify-between gap-3 text-sm"><div><strong>{grupo.item}</strong><span className="ml-2 text-xs text-slate-500">{grupo.casais.size} casal(is)</span></div><span className="font-black text-slate-700">{grupo.categoria === "VALOR" ? `${dinheiro.format(grupo.recebido)} / ${dinheiro.format(grupo.prometido)}` : `${grupo.recebido} / ${grupo.prometido} ${grupo.unidade}`}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${grupo.percentual >= 100 ? "bg-emerald-500" : grupo.percentual > 0 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${grupo.percentual}%` }} /></div></div>)}{!evolucao.itens.length && <p className="py-6 text-center text-sm text-slate-500">Registre as primeiras doações para acompanhar a evolução.</p>}</div>
      </article>
    </div>

    <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border bg-white p-5 shadow-sm">
      <div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Equipe de Compras</p><h2 className="mt-1 text-xl font-black">Lista de doações do encontro</h2><p className="mt-1 text-sm text-slate-500">Registre o que cada casal escolheu doar a partir da lista de alimentos, bebidas e materiais necessários.</p></div>
      <button type="button" onClick={novo} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white"><Plus size={18} /> Registrar doação</button>
    </div>

    {aberto && <form id="form-arrecadacao-ecc" onSubmit={salvar} className="grid gap-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-5 md:grid-cols-2 lg:grid-cols-4">
      <div className="md:col-span-2 lg:col-span-4"><h3 className="text-lg font-black">{editando ? "Atualizar recebimento" : "Registrar escolha do casal"}</h3><p className="text-sm text-slate-500">Escolha o casal, informe o item combinado e confirme o recebimento quando a doação chegar.</p></div>
      <label className={label}>Categoria<select className={campo} value={formulario.categoria} onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value as EccArrecadacaoFormData["categoria"] })}>{Object.entries(nomesCategoria).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></label>
      <label className={`${label} md:col-span-1 lg:col-span-2`}>{formulario.categoria === "VALOR" ? "Finalidade do valor" : "Item da lista de compras"}<input required list="itens-compras-ecc" className={campo} value={formulario.item} onChange={(e) => setFormulario({ ...formulario, item: e.target.value })} placeholder={formulario.categoria === "VALOR" ? "Ex.: compras da cozinha" : "Selecione ou digite outro item"} /><datalist id="itens-compras-ecc">{itensSugeridos.map((item) => <option key={item} value={item} />)}</datalist></label>
      <label className={label}>Casal doador<select required className={campo} value={formulario.responsavel} onChange={(e) => { const casal = casaisDoadores.find((item) => item.nome === e.target.value); setFormulario({ ...formulario, responsavel: e.target.value, telefone: casal?.telefone ?? "" }); }}><option value="">Selecione um casal de voluntários</option>{casaisDoadores.map((casal) => <option key={casal.id} value={casal.nome}>{casal.nome}</option>)}</select>{!casaisDoadores.length && <span className="text-xs font-normal text-amber-700">Cadastre o cônjuge no perfil do voluntário para formar o casal doador.</span>}</label>
      <label className={label}>Telefone<input className={campo} value={formulario.telefone} onChange={(e) => setFormulario({ ...formulario, telefone: e.target.value })} /></label>
      {formulario.categoria === "VALOR" ? <>
        <label className={label}>Valor prometido (R$)<input required min="0.01" step="0.01" type="number" className={campo} value={formulario.valorPrometido || ""} onChange={(e) => setFormulario({ ...formulario, valorPrometido: Number(e.target.value) })} /></label>
        <label className={label}>Valor recebido (R$)<input min="0" step="0.01" type="number" className={campo} value={formulario.valorRecebido || ""} onChange={(e) => setFormulario({ ...formulario, valorRecebido: Number(e.target.value) })} /></label>
      </> : <>
        <label className={label}>Quantidade prometida<input required min="0.01" step="0.01" type="number" className={campo} value={formulario.quantidadePrometida || ""} onChange={(e) => setFormulario({ ...formulario, quantidadePrometida: Number(e.target.value) })} /></label>
        <label className={label}>Quantidade recebida<input min="0" step="0.01" type="number" className={campo} value={formulario.quantidadeRecebida || ""} onChange={(e) => setFormulario({ ...formulario, quantidadeRecebida: Number(e.target.value) })} /></label>
        <label className={label}>Unidade<select className={campo} value={formulario.unidade} onChange={(e) => setFormulario({ ...formulario, unidade: e.target.value })}>{["unidade", "kg", "pacote", "caixa", "litro", "fardo", "bandeja"].map((item) => <option key={item}>{item}</option>)}</select></label>
      </>}
      <label className={`${label} md:col-span-2`}>Observações<textarea className={`${campo} min-h-20`} value={formulario.observacoes} onChange={(e) => setFormulario({ ...formulario, observacoes: e.target.value })} /></label>
      {editando && <label className={label}>Situação<select className={campo} value={formulario.status} onChange={(e) => setFormulario({ ...formulario, status: e.target.value as EccArrecadacaoFormData["status"] })}><option value="PENDENTE">Em acompanhamento</option><option value="CANCELADO">Cancelar compromisso</option></select></label>}
      {mensagem && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 md:col-span-2 lg:col-span-4">{mensagem}</p>}
      <div className="flex gap-2 md:col-span-2 lg:col-span-4"><button disabled={salvando} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{salvando ? "Salvando..." : editando ? "Salvar recebimento" : "Registrar doação combinada"}</button><button type="button" onClick={() => setAberto(false)} className="rounded-xl border bg-white px-5 py-3 text-sm font-bold">Cancelar</button></div>
    </form>}

    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_190px_190px_auto]">
        <label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por item ou casal" /></label>
        <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}><option value="TODAS">Todas as categorias</option>{Object.entries(nomesCategoria).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select>
        <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}><option value="TODOS">Todas as situações</option>{Object.entries(nomesStatus).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select>
        <button type="button" onClick={exportarRelatorio} className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-black text-blue-700"><Download size={17} /> Exportar</button>
      </div>
      <p className="mt-3 text-xs text-slate-500">{registrosFiltrados.length} registro(s) exibido(s)</p>
    </div>

    <div className="grid gap-3 md:grid-cols-2">
      {registrosFiltrados.map((item) => {
        const valor = item.categoria === "VALOR";
        const prometido = valor ? dinheiro.format(item.valorPrometido) : `${item.quantidadePrometida} ${item.unidade}`;
        const recebido = valor ? dinheiro.format(item.valorRecebido) : `${item.quantidadeRecebida} ${item.unidade}`;
        const cor = item.status === "RECEBIDO" ? "bg-emerald-100 text-emerald-800" : item.status === "CANCELADO" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800";
        return <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-xs font-black uppercase tracking-wide text-blue-700">{nomesCategoria[item.categoria]}</span><h3 className="mt-1 text-lg font-black">{item.item}</h3><p className="text-sm text-slate-500">{item.responsavel || "Responsável não informado"}{item.telefone && ` · ${item.telefone}`}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${cor}`}>{nomesStatus[item.status]}</span></div><div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm"><div><span className="text-slate-500">Prometido</span><strong className="block">{prometido}</strong></div><div><span className="text-slate-500">Recebido</span><strong className="block">{recebido}</strong></div></div>{item.observacoes && <p className="mt-3 text-sm text-slate-600">{item.observacoes}</p>}<button type="button" onClick={() => editar(item)} className="mt-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold text-blue-700"><Pencil size={16} /> Atualizar recebimento</button></article>;
      })}
      {!registrosFiltrados.length && <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500 md:col-span-2"><ShoppingCart className="mx-auto mb-3 text-blue-500" /><strong className="block text-slate-800">{arrecadacoes.length ? "Nenhuma doação encontrada nos filtros" : "A lista de doações ainda está vazia"}</strong><span className="mt-1 block text-sm">{arrecadacoes.length ? "Altere os filtros para consultar outros registros." : "Comece registrando o item escolhido por cada casal."}</span></div>}
    </div>
  </section>;
}
