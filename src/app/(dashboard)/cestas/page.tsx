"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PackageCheck, Plus, ShoppingCart, Target, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/forms/Button";
import { FormSection } from "@/components/forms/FormSection";
import { TextField } from "@/components/forms/TextField";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCestas } from "@/modules/cestas/hooks/useCestas";
import {
  CampanhaCestas,
  ItemCestaPadrao,
  MovimentacaoCestas,
} from "@/modules/cestas/types/cestas.types";
import { useDoadores } from "@/modules/doadores/hooks/useDoadores";
import { DoadorDocumento } from "@/modules/doadores/types/doador-documento";
import { useFamilias } from "@/modules/familias/hooks/useFamilias";
import { FamiliaDocumento } from "@/modules/familias/types/familia-documento";
import { maskMoeda, parseMoeda } from "@/lib/formatters/masks";

const hoje = new Date().toISOString().slice(0, 10);

export default function CestasPage() {
  const api = useCestas();
  const { buscarComposicao, listarCampanhas, listarMovimentacoes } = api;
  const { listar: listarDoadores } = useDoadores();
  const { listar: listarFamilias } = useFamilias();
  const [itens, setItens] = useState<ItemCestaPadrao[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaCestas[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentacaoCestas[]>([]);
  const [doadores, setDoadores] = useState<DoadorDocumento[]>([]);
  const [familias, setFamilias] = useState<FamiliaDocumento[]>([]);
  const [campanhaId, setCampanhaId] = useState("");
  const [editingCampaignId, setEditingCampaignId] = useState("");
  const [novaCampanha, setNovaCampanha] = useState({
    nome: "Campanha mensal de cestas",
    metaCestas: 50,
    dataLimite: hoje,
    status: "ATIVA" as CampanhaCestas["status"],
  });
  const [novoItem, setNovoItem] = useState({
    nome: "",
    quantidade: 1,
    unidade: "unidade",
  });
  const [entrada, setEntrada] = useState({
    tipo: "CESTA_PRONTA" as "CESTA_PRONTA" | "ITEM_AVULSO",
    origem: "DOACAO" as "DOACAO" | "COMPRA_PAROQUIA",
    doadorId: "",
    itemId: "",
    quantidade: 1,
    valorTotal: "",
    data: hoje,
  });
  const [quantidadeMontagem, setQuantidadeMontagem] = useState(1);
  const [entrega, setEntrega] = useState({ familiaId: "", quantidade: 1 });
  const [doacaoColetiva, setDoacaoColetiva] = useState({
    destino: "",
    quantidade: 1,
    data: hoje,
  });

  const carregar = useCallback(async () => {
    const [
      composicao,
      campanhasCarregadas,
      movimentosCarregados,
      doadoresCarregados,
      familiasCarregadas,
    ] = await Promise.all([
      buscarComposicao(),
      listarCampanhas(),
      listarMovimentacoes(),
      listarDoadores(),
      listarFamilias(),
    ]);
    setItens(composicao);
    setCampanhas(campanhasCarregadas);
    setMovimentos(movimentosCarregados);
    setDoadores(doadoresCarregados.filter((d) => d.status === "ATIVO"));
    setFamilias(familiasCarregadas.filter((f) => f.status === "ATIVA"));
    const ativa = campanhasCarregadas.find((c) => c.status === "ATIVA");
    setCampanhaId((atual) =>
      campanhasCarregadas.some((campanha) => campanha.id === atual)
        ? atual
        : (ativa?.id ?? campanhasCarregadas[0]?.id ?? ""),
    );
  }, [
    buscarComposicao,
    listarCampanhas,
    listarDoadores,
    listarFamilias,
    listarMovimentacoes,
  ]);

  useEffect(() => {
    carregar().catch(() =>
      toast.error("Não foi possível carregar o controle de cestas."),
    );
  }, [carregar]);

  const campanha = campanhas.find((item) => item.id === campanhaId);
  const movimentosCampanha = useMemo(
    () => movimentos.filter((m) => m.campanhaId === campanhaId),
    [campanhaId, movimentos],
  );
  const resumo = api.calcular(
    itens,
    movimentosCampanha,
    campanha?.metaCestas ?? 0,
  );

  async function adicionarItem() {
    if (!novoItem.nome.trim()) return toast.error("Informe o item.");
    const atualizados = [...itens, { id: crypto.randomUUID(), ...novoItem }];
    await api.salvarComposicao(atualizados);
    setItens(atualizados);
    setNovoItem({ nome: "", quantidade: 1, unidade: "unidade" });
    toast.success("Composição atualizada.");
  }

  function prepararNovaCampanha() {
    setEditingCampaignId("");
    setNovaCampanha({
      nome: "Campanha mensal de cestas",
      metaCestas: 50,
      dataLimite: hoje,
      status: "ATIVA",
    });
  }
  function editarCampanha(campanhaParaEditar: CampanhaCestas) {
    setEditingCampaignId(campanhaParaEditar.id);
    setNovaCampanha({
      nome: campanhaParaEditar.nome,
      metaCestas: campanhaParaEditar.metaCestas,
      dataLimite: campanhaParaEditar.dataLimite,
      status: campanhaParaEditar.status,
    });
  }
  async function salvarCampanha() {
    try {
      if (editingCampaignId) {
        await api.atualizarCampanha(editingCampaignId, novaCampanha);
        setCampanhaId(editingCampaignId);
        toast.success("Campanha atualizada.");
      } else {
        const criada = await api.criarCampanha(novaCampanha);
        setCampanhaId(criada.id);
        toast.success("Campanha criada.");
      }
      prepararNovaCampanha();
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a campanha.",
      );
    }
  }

  async function registrarEntrada() {
    if (!campanhaId) return toast.error("Crie ou selecione uma campanha.");
    const doador = doadores.find((item) => item.id === entrada.doadorId);
    const item = itens.find((registro) => registro.id === entrada.itemId);
    if (entrada.tipo === "ITEM_AVULSO" && !item)
      return toast.error("Selecione o item recebido.");
    await api.criarMovimentacao({
      ...entrada,
      valorTotal: parseMoeda(entrada.valorTotal),
      campanhaId,
      operacao: "ENTRADA",
      doadorNome: doador?.nome ?? "",
      itemNome: item?.nome ?? "",
      unidade: item?.unidade ?? "",
      observacoes: "",
      familiaId: "",
      familiaNome: "",
    });
    toast.success("Entrada registrada.");
    await carregar();
  }

  async function montarCestas() {
    if (!campanhaId) return toast.error("Selecione uma campanha.");
    try {
      await api.montarCestas(campanhaId, quantidadeMontagem);
      toast.success("Cestas montadas e estoque atualizado.");
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível montar as cestas.",
      );
    }
  }

  async function entregarCestas() {
    if (!campanhaId) return toast.error("Selecione uma campanha.");
    const familia = familias.find((item) => item.id === entrega.familiaId);
    try {
      await api.entregarCestas(
        campanhaId,
        entrega.quantidade,
        entrega.familiaId,
        familia?.nomeResponsavel ?? "",
      );
      toast.success("Entrega registrada com sucesso.");
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a entrega.",
      );
    }
  }

  async function registrarDoacaoColetiva() {
    if (!campanhaId) return toast.error("Selecione uma campanha.");
    try {
      await api.doarExcedentes(
        campanhaId,
        doacaoColetiva.quantidade,
        doacaoColetiva.destino,
        doacaoColetiva.data,
      );
      setDoacaoColetiva({ destino: "", quantidade: 1, data: hoje });
      toast.success("Doação coletiva registrada e saldo atualizado.");
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a doação coletiva.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campanhas e Cestas"
        description="Acompanhe metas, doações, estoque para montagem e compras da paróquia."
        actions={
          <Link
            href="/cestas/distribuicao"
            className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white"
          >
            Abrir lista de distribuição
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Meta", value: campanha?.metaCestas ?? 0, icon: Target },
          {
            label: "Cestas prontas",
            value: resumo.cestasProntas,
            icon: PackageCheck,
          },
          {
            label: "Podem ser montadas",
            value: resumo.cestasMontaveis,
            icon: Plus,
          },
          { label: "Faltam", value: resumo.deficit, icon: ShoppingCart },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <card.icon className="text-blue-700" />
            <p className="mt-3 text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-slate-500">{card.label}</p>
          </div>
        ))}
      </section>

      {campanha && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex justify-between text-sm font-medium text-blue-900">
            <span>{campanha.nome}</span>
            <span>
              {Math.min(
                Math.round((resumo.total / campanha.metaCestas) * 100),
                100,
              )}
              %
            </span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full bg-blue-600"
              style={{
                width: `${Math.min((resumo.total / campanha.metaCestas) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-sm text-blue-800">
            Investimento da paróquia:{" "}
            {resumo.valorParoquia.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <FormSection
          title="Gerenciar campanhas"
          description="Selecione uma campanha para operar, edite seus dados ou crie uma nova."
        >
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Campanhas criadas
              </p>
              <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                {campanhas.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${item.id === campanhaId ? "border-blue-300 bg-blue-50" : "border-slate-200"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setCampanhaId(item.id)}
                      className="min-w-0 text-left"
                    >
                      <span className="block truncate font-medium text-slate-800">
                        {item.nome}
                      </span>
                      <span className="block text-xs text-slate-500">
                        Meta: {item.metaCestas} cestas · Limite:{" "}
                        {new Date(
                          `${item.dataLimite}T12:00:00`,
                        ).toLocaleDateString("pt-BR")}{" "}
                        · {item.status === "ATIVA" ? "Ativa" : "Encerrada"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => editarCampanha(item)}
                      className="shrink-0 text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Editar
                    </button>
                  </div>
                ))}
                {!campanhas.length && (
                  <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                    Nenhuma campanha criada.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-800">
                {editingCampaignId ? "Editar campanha" : "Nova campanha"}
              </p>
              {editingCampaignId && (
                <button
                  type="button"
                  onClick={prepararNovaCampanha}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancelar edição
                </button>
              )}
            </div>
            <TextField
              label="Nome"
              value={novaCampanha.nome}
              onChange={(e) =>
                setNovaCampanha({ ...novaCampanha, nome: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Meta de cestas"
                type="number"
                value={novaCampanha.metaCestas}
                onChange={(e) =>
                  setNovaCampanha({
                    ...novaCampanha,
                    metaCestas: Number(e.target.value),
                  })
                }
              />
              <TextField
                label="Data limite"
                type="date"
                value={novaCampanha.dataLimite}
                onChange={(e) =>
                  setNovaCampanha({
                    ...novaCampanha,
                    dataLimite: e.target.value,
                  })
                }
              />
            </div>
            <select
              value={novaCampanha.status}
              onChange={(e) =>
                setNovaCampanha({
                  ...novaCampanha,
                  status: e.target.value as CampanhaCestas["status"],
                })
              }
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="ATIVA">Ativa</option>
              <option value="ENCERRADA">Encerrada</option>
            </select>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={salvarCampanha}>
                {editingCampaignId ? "Salvar alterações" : "Criar campanha"}
              </Button>
              {!editingCampaignId && (
                <button
                  type="button"
                  onClick={prepararNovaCampanha}
                  className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Composição da cesta"
          description="Informe quanto de cada item é necessário para montar uma cesta."
        >
          <div className="space-y-3">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
              >
                <span>
                  {item.nome}: {item.quantidade} {item.unidade}
                </span>
                <button
                  onClick={async () => {
                    const novos = itens.filter((i) => i.id !== item.id);
                    await api.salvarComposicao(novos);
                    setItens(novos);
                  }}
                  className="text-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              <TextField
                label="Item"
                value={novoItem.nome}
                onChange={(e) =>
                  setNovoItem({ ...novoItem, nome: e.target.value })
                }
              />
              <TextField
                label="Qtd."
                type="number"
                value={novoItem.quantidade}
                onChange={(e) =>
                  setNovoItem({
                    ...novoItem,
                    quantidade: Number(e.target.value),
                  })
                }
              />
              <TextField
                label="Unidade"
                value={novoItem.unidade}
                onChange={(e) =>
                  setNovoItem({ ...novoItem, unidade: e.target.value })
                }
              />
            </div>
            <Button type="button" onClick={adicionarItem}>
              Adicionar item
            </Button>
          </div>
        </FormSection>
      </div>

      <FormSection
        title="Registrar entrada"
        description="Lance cestas prontas, itens doados ou compras feitas pela paróquia."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <select
            value={entrada.tipo}
            onChange={(e) =>
              setEntrada({
                ...entrada,
                tipo: e.target.value as typeof entrada.tipo,
              })
            }
            className="rounded-lg border px-4 py-3"
          >
            <option value="CESTA_PRONTA">Cesta pronta</option>
            <option value="ITEM_AVULSO">Item avulso</option>
          </select>
          <select
            value={entrada.origem}
            onChange={(e) =>
              setEntrada({
                ...entrada,
                origem: e.target.value as typeof entrada.origem,
              })
            }
            className="rounded-lg border px-4 py-3"
          >
            <option value="DOACAO">Doação</option>
            <option value="COMPRA_PAROQUIA">Compra da paróquia</option>
          </select>
          {entrada.origem === "DOACAO" && (
            <select
              value={entrada.doadorId}
              onChange={(e) =>
                setEntrada({ ...entrada, doadorId: e.target.value })
              }
              className="rounded-lg border px-4 py-3"
            >
              <option value="">Doador não identificado</option>
              {doadores.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          )}
          {entrada.tipo === "ITEM_AVULSO" && (
            <select
              value={entrada.itemId}
              onChange={(e) =>
                setEntrada({ ...entrada, itemId: e.target.value })
              }
              className="rounded-lg border px-4 py-3"
            >
              <option value="">Selecione o item</option>
              {itens.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </select>
          )}
          <TextField
            label="Quantidade"
            type="number"
            min={0.01}
            value={entrada.quantidade}
            onChange={(e) =>
              setEntrada({ ...entrada, quantidade: Number(e.target.value) })
            }
          />
          <TextField
            label="Valor total"
            type="text"
            inputMode="numeric"
            value={entrada.valorTotal}
            placeholder="R$ 0,00"
            onChange={(e) =>
              setEntrada({ ...entrada, valorTotal: maskMoeda(e.target.value) })
            }
          />
          <TextField
            label="Data"
            type="date"
            value={entrada.data}
            onChange={(e) => setEntrada({ ...entrada, data: e.target.value })}
          />
        </div>
        <div className="mt-4">
          <Button type="button" onClick={registrarEntrada}>
            Registrar entrada
          </Button>
        </div>
      </FormSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <FormSection
          title="Montar cestas"
          description={`O estoque atual permite montar ${resumo.cestasMontaveis} cesta(s).`}
        >
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <TextField
                label="Quantidade a montar"
                type="number"
                min={1}
                max={resumo.cestasMontaveis}
                value={quantidadeMontagem}
                onChange={(e) => setQuantidadeMontagem(Number(e.target.value))}
              />
            </div>
            <Button
              type="button"
              onClick={montarCestas}
              disabled={resumo.cestasMontaveis === 0}
            >
              Confirmar montagem
            </Button>
          </div>
        </FormSection>
        <FormSection
          title="Entregar benefício"
          description={`Saldo disponível: ${resumo.cestasProntas} cesta(s) pronta(s).`}
        >
          <div className="space-y-4">
            <select
              value={entrega.familiaId}
              onChange={(e) =>
                setEntrega({ ...entrega, familiaId: e.target.value })
              }
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="">Selecione a família</option>
              {familias.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nomeResponsavel}
                </option>
              ))}
            </select>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <TextField
                  label="Quantidade"
                  type="number"
                  min={1}
                  max={resumo.cestasProntas}
                  value={entrega.quantidade}
                  onChange={(e) =>
                    setEntrega({
                      ...entrega,
                      quantidade: Number(e.target.value),
                    })
                  }
                />
              </div>
              <Button
                type="button"
                onClick={entregarCestas}
                disabled={resumo.cestasProntas <= 0}
              >
                Registrar entrega
              </Button>
            </div>
          </div>
        </FormSection>
        <FormSection
          title="Doar cestas excedentes"
          description={`Registre uma saída coletiva sem cadastro de família. Saldo disponível: ${resumo.cestasProntas} cesta(s).`}
        >
          <div className="space-y-4">
            <TextField
              label="Destino da doação"
              value={doacaoColetiva.destino}
              placeholder="Ex.: população em situação de vulnerabilidade"
              onChange={(e) =>
                setDoacaoColetiva({
                  ...doacaoColetiva,
                  destino: e.target.value,
                })
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Quantidade de cestas"
                type="number"
                min={1}
                max={resumo.cestasProntas}
                value={doacaoColetiva.quantidade}
                onChange={(e) =>
                  setDoacaoColetiva({
                    ...doacaoColetiva,
                    quantidade: Number(e.target.value),
                  })
                }
              />
              <TextField
                label="Data da doação"
                type="date"
                value={doacaoColetiva.data}
                onChange={(e) =>
                  setDoacaoColetiva({ ...doacaoColetiva, data: e.target.value })
                }
              />
            </div>
            <Button
              type="button"
              onClick={registrarDoacaoColetiva}
              disabled={resumo.cestasProntas <= 0}
            >
              Registrar saída por doação coletiva
            </Button>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
