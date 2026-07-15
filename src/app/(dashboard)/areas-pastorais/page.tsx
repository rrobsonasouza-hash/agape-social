"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPinned, RotateCcw, Save, Trash2, Undo2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { FormSection } from "@/components/forms/FormSection";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { TextField } from "@/components/forms/TextField";
import { MapaAreasPastorais } from "@/components/maps/MapaAreasPastorais";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAreasPastorais } from "@/modules/areas-pastorais/hooks/useAreasPastorais";
import {
  areaPastoralSchema,
  Coordenada,
} from "@/modules/areas-pastorais/schemas/area-pastoral.schema";
import { AreaPastoralDocumento } from "@/modules/areas-pastorais/types/area-pastoral-documento";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";

export default function AreasPastoraisPage() {
  const { listar, criar, remover } = useAreasPastorais();
  const { paroquia } = useParoquia();
  const [areas, setAreas] = useState<AreaPastoralDocumento[]>([]);
  const [rascunho, setRascunho] = useState<Coordenada[]>([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState("#2563eb");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregarAreas = useCallback(async () => {
    try {
      setAreas(await listar());
    } catch (error) {
      console.error("Erro ao carregar áreas pastorais:", error);
      toast.error("Não foi possível carregar as áreas pastorais.");
    } finally {
      setCarregando(false);
    }
  }, [listar]);

  useEffect(() => {
    carregarAreas();
  }, [carregarAreas]);

  function adicionarPonto(coordenada: Coordenada) {
    setRascunho((pontos) => [...pontos, coordenada]);
  }

  async function salvarArea() {
    const dados = { nome, descricao, cor, ativa: true, poligono: rascunho };
    const validacao = areaPastoralSchema.safeParse(dados);

    if (!validacao.success) {
      toast.error(validacao.error.issues[0]?.message ?? "Revise os dados da área pastoral.");
      return;
    }

    try {
      setSalvando(true);
      await criar(validacao.data);
      toast.success("Área pastoral cadastrada com sucesso!");
      setNome("");
      setDescricao("");
      setRascunho([]);
      await carregarAreas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a área pastoral.");
    } finally {
      setSalvando(false);
    }
  }

  async function removerArea(area: AreaPastoralDocumento) {
    if (!window.confirm(`Deseja remover a área “${area.nome}”?`)) return;

    try {
      await remover(area.id);
      setAreas((atuais) => atuais.filter((item) => item.id !== area.id));
      toast.success("Área pastoral removida.");
    } catch {
      toast.error("Não foi possível remover a área pastoral.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Áreas Pastorais"
        description="Organize o território de atendimento em regiões geográficas."
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <FormSection title="Nova área" description="Informe os dados e desenhe o perímetro no mapa.">
            <div className="space-y-4">
              <TextField label="Nome" value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Setor Jardim São Paulo" />
              <TextAreaField label="Descrição" rows={3} value={descricao} onChange={(event) => setDescricao(event.target.value)} />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Cor no mapa</label>
                <input type="color" value={cor} onChange={(event) => setCor(event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                Clique no mapa para marcar os limites da área. São necessários pelo menos três pontos.
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRascunho((pontos) => pontos.slice(0, -1))} disabled={rascunho.length === 0} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40">
                  <Undo2 size={16} /> Desfazer
                </button>
                <button type="button" onClick={() => setRascunho([])} disabled={rascunho.length === 0} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40">
                  <RotateCcw size={16} /> Limpar
                </button>
              </div>
              <p className="text-xs text-slate-500">{rascunho.length} ponto(s) marcado(s)</p>
              <Button type="button" onClick={salvarArea} disabled={salvando} className="flex w-full items-center justify-center gap-2">
                <Save size={17} /> {salvando ? "Salvando..." : "Salvar área"}
              </Button>
            </div>
          </FormSection>

          <FormSection title="Áreas cadastradas" description={`${areas.length} região(ões) configurada(s).`}>
            {carregando ? (
              <p className="text-sm text-slate-500">Carregando áreas...</p>
            ) : areas.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma área pastoral cadastrada.</p>
            ) : (
              <ul className="space-y-3">
                {areas.map((area) => (
                  <li key={area.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: area.cor }} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{area.nome}</p>
                        <p className="text-xs text-slate-500">{area.poligono.length} vértices</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removerArea(area)} className="text-slate-400 transition hover:text-red-600" aria-label={`Remover ${area.nome}`}>
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </FormSection>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <MapPinned className="text-blue-700" />
            <div>
              <h2 className="font-semibold text-slate-900">Mapa territorial</h2>
              <p className="text-sm text-slate-500">As áreas salvas permanecem visíveis enquanto você desenha.</p>
            </div>
          </div>
          <MapaAreasPastorais
            areas={areas}
            rascunho={rascunho}
            corRascunho={cor}
            centro={paroquia ? { latitude: paroquia.latitude, longitude: paroquia.longitude } : null}
            onAdicionarPonto={adicionarPonto}
          />
        </section>
      </div>
    </div>
  );
}
