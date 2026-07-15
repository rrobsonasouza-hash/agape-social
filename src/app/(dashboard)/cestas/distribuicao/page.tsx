"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Home, Plus, Search, UserX } from "lucide-react";
import toast from "react-hot-toast";
import { FormSection } from "@/components/forms/FormSection";
import { TextField } from "@/components/forms/TextField";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCestas } from "@/modules/cestas/hooks/useCestas";
import { CampanhaCestas } from "@/modules/cestas/types/cestas.types";
import { useDistribuicoes } from "@/modules/distribuicoes/hooks/useDistribuicoes";
import { StatusDistribuicao } from "@/modules/distribuicoes/schemas/distribuicao.schema";
import { DistribuicaoDocumento } from "@/modules/distribuicoes/types/distribuicao-documento";
import { useFamilias } from "@/modules/familias/hooks/useFamilias";
import { FamiliaDocumento } from "@/modules/familias/types/familia-documento";

const hoje = new Date().toISOString().slice(0, 10);

export default function DistribuicaoCestasPage() {
  const { listar: listarFamilias } = useFamilias();
  const { listarCampanhas } = useCestas();
  const { listarPorData, agendar, agendarTodas, marcar } = useDistribuicoes();
  const [data, setData] = useState(hoje);
  const [campanhaId, setCampanhaId] = useState("");
  const [familiaId, setFamiliaId] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [familias, setFamilias] = useState<FamiliaDocumento[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaCestas[]>([]);
  const [lista, setLista] = useState<DistribuicaoDocumento[]>([]);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  const carregarLista = useCallback(async () => {
    setLista(await listarPorData(data));
  }, [data, listarPorData]);

  useEffect(() => {
    Promise.all([listarFamilias(), listarCampanhas()]).then(([f, c]) => {
      setFamilias(f.filter((item) => item.status === "ATIVA"));
      setCampanhas(c.filter((item) => item.status === "ATIVA"));
      const ativa = c.find((item) => item.status === "ATIVA");
      if (ativa) setCampanhaId(ativa.id);
    }).catch(() => toast.error("Não foi possível carregar os dados."));
  }, [listarCampanhas, listarFamilias]);

  useEffect(() => { carregarLista().catch(() => toast.error("Não foi possível carregar a lista.")); }, [carregarLista]);

  const listaFiltrada = useMemo(() => {
    const termo = pesquisa.toLowerCase().trim();
    return termo ? lista.filter((item) => item.familiaNome.toLowerCase().includes(termo)) : lista;
  }, [lista, pesquisa]);

  async function adicionar() {
    const familia = familias.find((item) => item.id === familiaId);
    if (!familia || !campanhaId) return toast.error("Selecione a campanha e a família.");
    try {
      await agendar({ data, familiaId, familiaNome: familia.nomeResponsavel, campanhaId, quantidade: 1, status: "AGENDADA" });
      setFamiliaId(""); await carregarLista(); toast.success("Família adicionada à lista.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível adicionar."); }
  }

  async function adicionarTodas() {
    if (!campanhaId) return toast.error("Selecione a campanha.");
    try {
      const resultado = await agendarTodas(data, campanhaId);
      await carregarLista();
      toast.success(
        resultado.adicionadas > 0
          ? `${resultado.adicionadas} família(s) elegível(is) adicionada(s).`
          : "Todas as famílias elegíveis já estão na lista."
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível adicionar as famílias.");
    }
  }

  async function finalizar(item: DistribuicaoDocumento, status: Exclude<StatusDistribuicao, "AGENDADA">) {
    try {
      setAtualizando(item.id); await marcar(item.id, status); await carregarLista();
      toast.success(status === "AUSENTE" ? "Ausência registrada." : "Cesta baixada com sucesso.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar."); }
    finally { setAtualizando(null); }
  }

  const agendadas = lista.filter((item) => item.status === "AGENDADA").length;
  const retiradas = lista.filter((item) => item.status === "RETIRADA" || item.status === "ENTREGUE_DOMICILIO").length;
  const ausentes = lista.filter((item) => item.status === "AUSENTE").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Distribuição de Cestas" description="Lista rápida de retirada e entrega por data." />
      <section className="grid gap-4 sm:grid-cols-3">{[{ label: "Aguardando", value: agendadas }, { label: "Recebidas", value: retiradas }, { label: "Ausentes", value: ausentes }].map((item) => <div key={item.label} className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-3xl font-bold">{item.value}</p><p className="text-sm text-slate-500">{item.label}</p></div>)}</section>

      <FormSection title="Preparar lista" description="Selecione a data e inclua as famílias previstas. Famílias bloqueadas nunca são adicionadas.">
        <div className="grid gap-4 md:grid-cols-3"><TextField label="Data da distribuição" type="date" value={data} onChange={(e) => setData(e.target.value)} /><select value={campanhaId} onChange={(e) => setCampanhaId(e.target.value)} className="self-end rounded-lg border px-4 py-3"><option value="">Campanha</option>{campanhas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select><select value={familiaId} onChange={(e) => setFamiliaId(e.target.value)} className="self-end rounded-lg border px-4 py-3"><option value="">Selecione a família</option>{familias.filter((f) => !f.beneficioBloqueado).map((f) => <option key={f.id} value={f.id}>{f.nomeResponsavel}</option>)}</select></div><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={adicionar} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white"><Plus size={18} /> Adicionar selecionada</button><button type="button" onClick={adicionarTodas} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 hover:bg-blue-100"><Plus size={18} /> Adicionar todas as elegíveis</button></div>
      </FormSection>

      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="search" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Localizar família na fila..." className="w-full rounded-lg border bg-white py-3 pl-12 pr-4" /></div>

      <div className="space-y-3">
        {listaFiltrada.map((item) => (
          <div key={item.id} className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">{item.familiaNome.slice(0, 2).toUpperCase()}</div><div><p className="font-semibold text-slate-900">{item.familiaNome}</p><StatusBadge status={item.status} /></div></div>
            {item.status === "AGENDADA" ? <div className="grid grid-cols-3 gap-2"><button disabled={atualizando === item.id} onClick={() => finalizar(item, "RETIRADA")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white"><CheckCircle2 size={18} /> Retirada</button><button disabled={atualizando === item.id} onClick={() => finalizar(item, "AUSENTE")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white"><UserX size={18} /> Ausente</button><button disabled={atualizando === item.id} onClick={() => finalizar(item, "ENTREGUE_DOMICILIO")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"><Home size={18} /> Em casa</button></div> : <span className="text-sm text-slate-400">Atendimento finalizado</span>}
          </div>
        ))}
        {listaFiltrada.length === 0 && <div className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">Nenhuma família nesta lista.</div>}
      </div>
    </div>
  );
}
