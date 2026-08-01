"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Home,
  Plus,
  Printer,
  Search,
  Undo2,
  UserX,
} from "lucide-react";
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
import { obterTokenAcesso } from "@/lib/auth/client-session";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";

const hoje = new Date().toISOString().slice(0, 10);
const normalizarBusca = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();

export default function DistribuicaoCestasPage() {
  const { paroquia } = useParoquia();
  const { listar: listarFamilias } = useFamilias();
  const { listarCampanhas } = useCestas();
  const {
    listarPorData,
    agendar,
    agendarTodas,
    remarcarTodas,
    excluirAgendadas,
    marcar,
    desfazerBaixa,
  } = useDistribuicoes();
  const [data, setData] = useState(hoje);
  const [novaData, setNovaData] = useState(hoje);
  const [campanhaId, setCampanhaId] = useState("");
  const [familiaId, setFamiliaId] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [familias, setFamilias] = useState<FamiliaDocumento[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaCestas[]>([]);
  const [lista, setLista] = useState<DistribuicaoDocumento[]>([]);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [logoParoquia, setLogoParoquia] = useState<string | null>(null);

  const carregarLista = useCallback(async () => {
    const carregada = await listarPorData(data);
    setLista(
      carregada.sort((a, b) =>
        a.familiaNome.localeCompare(b.familiaNome, "pt-BR", {
          sensitivity: "base",
        }),
      ),
    );
  }, [data, listarPorData]);

  useEffect(() => {
    Promise.all([listarFamilias(), listarCampanhas()])
      .then(([f, c]) => {
        setFamilias(
          f
            .filter((item) => item.status === "ATIVA")
            .sort((a, b) =>
              a.nomeResponsavel.localeCompare(b.nomeResponsavel, "pt-BR", {
                sensitivity: "base",
              }),
            ),
        );
        setCampanhas(c.filter((item) => item.status === "ATIVA"));
        const ativa = c.find((item) => item.status === "ATIVA");
        if (ativa) setCampanhaId(ativa.id);
      })
      .catch(() => toast.error("Não foi possível carregar os dados."));
  }, [listarCampanhas, listarFamilias]);

  useEffect(() => {
    carregarLista().catch(() =>
      toast.error("Não foi possível carregar a lista."),
    );
  }, [carregarLista]);

  useEffect(() => {
    if (!paroquia) return;
    obterTokenAcesso()
      .then(async (token) => {
        const resposta = await fetch("/api/paroquias/logo", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resposta.ok) setLogoParoquia((await resposta.json()).url);
      })
      .catch(() => setLogoParoquia(null));
  }, [paroquia]);

  const listaFiltrada = useMemo(() => {
    const termo = normalizarBusca(pesquisa);
    return termo
      ? lista.filter((item) =>
          normalizarBusca(item.familiaNome).includes(termo),
        )
      : lista;
  }, [lista, pesquisa]);
  const familiasPorId = useMemo(
    () => new Map(familias.map((familia) => [familia.id, familia])),
    [familias],
  );

  async function adicionar() {
    const familia = familias.find((item) => item.id === familiaId);
    if (!familia || !campanhaId)
      return toast.error("Selecione a campanha e a família.");
    try {
      await agendar({
        data,
        familiaId,
        familiaNome: familia.nomeResponsavel,
        campanhaId,
        quantidade: 1,
        status: "AGENDADA",
      });
      setFamiliaId("");
      await carregarLista();
      toast.success("Família adicionada à lista.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível adicionar.",
      );
    }
  }

  async function moverAgendadas() {
    const ids = lista
      .filter((item) => item.status === "AGENDADA")
      .map((item) => item.id);
    if (!ids.length)
      return toast.error("Não há famílias agendadas para mover.");
    if (!novaData) return toast.error("Informe a nova data.");
    try {
      await remarcarTodas(ids, novaData);
      await carregarLista();
      toast.success(`${ids.length} família(s) remarcada(s) para a nova data.`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível remarcar a lista.",
      );
    }
  }

  async function excluirListaAgendada() {
    const ids = lista
      .filter((item) => item.status === "AGENDADA")
      .map((item) => item.id);
    if (!ids.length)
      return toast.error("Não há famílias agendadas para excluir.");
    if (
      !window.confirm(
        `Excluir ${ids.length} família(s) agendada(s) desta data? As cestas prontas do estoque não serão alteradas.`,
      )
    )
      return;
    try {
      const resultado = await excluirAgendadas(ids);
      await carregarLista();
      toast.success(
        `${resultado.removidas} família(s) agendada(s) excluída(s) da lista.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a lista.",
      );
    }
  }

  function imprimirPendentes() {
    const pendentes = lista.filter((item) => item.status === "AGENDADA");
    if (!pendentes.length)
      return toast.error("Não há famílias pendentes para imprimir.");
    const dataFormatada = new Date(`${data}T00:00:00`).toLocaleDateString(
      "pt-BR",
      { weekday: "long", day: "2-digit", month: "long", year: "numeric" },
    );
    const escapar = (texto: string) =>
      texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    const endereco = [
      paroquia?.logradouro,
      paroquia?.numero,
      paroquia?.bairro,
      paroquia?.cidade,
      paroquia?.estado,
    ]
      .filter(Boolean)
      .join(", ");
    const cabecalho = `<header class="instituicao">${logoParoquia ? `<img src="${escapar(logoParoquia)}" alt="Logotipo da paróquia"/>` : ""}<p class="paroquia">${escapar(paroquia?.nome || "Ágape Social")}</p>${endereco ? `<p class="endereco">${escapar(endereco)}</p>` : ""}<div></div><h1>Fila de distribuição ${escapar(dataFormatada)}</h1><p class="subtitulo">Famílias pendentes de retirada · Marque o X na coluna ao lado quando a cesta for entregue.</p></header>`;
    const linhas = pendentes
      .map(
        (item, indice) =>
          `<tr><td class="numero">${indice + 1}</td><td>${escapar(item.familiaNome)}</td><td class="marca"><span></span></td></tr>`,
      )
      .join("");
    const janela = window.open("", "_blank");
    if (!janela)
      return toast.error(
        "Permita a abertura da janela de impressão para gerar o PDF.",
      );
    janela.document.write(
      `<!doctype html><html lang="pt-BR"><head><title>Fila de distribuição</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0}.instituicao{text-align:center}.instituicao img{width:74px;height:74px;object-fit:contain;margin:0 auto 7px}.paroquia{margin:0;font-size:13px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase}.endereco{margin:4px 0 0;font-size:10px;color:#555}.instituicao>div{height:1px;max-width:520px;margin:16px auto 18px;background:#111}h1{font-family:Georgia,serif;font-size:20px;margin:0 0 5px}.subtitulo{font-size:11px;color:#555;margin:0 0 18px}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;background:#f1f1f1;border:1px solid #777;padding:8px}td{border:1px solid #999;padding:10px;height:38px}.numero{width:42px;text-align:center}.marca{width:62px;text-align:center}.marca span{display:inline-block;width:19px;height:19px;border:1.5px solid #111}footer{margin-top:16px;border-top:1px solid #999;padding-top:8px;text-align:center;font-size:10px;color:#555}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${cabecalho}<table><thead><tr><th class="numero">Nº</th><th>Nome da família / responsável</th><th class="marca">X</th></tr></thead><tbody>${linhas}</tbody></table><footer>Documento emitido pelo sistema Ágape Social · Total de famílias pendentes: ${pendentes.length}</footer></body></html>`,
    );
    janela.document.close();
    janela.focus();
    window.setTimeout(() => janela.print(), 250);
  }

  async function adicionarTodas() {
    if (!campanhaId) return toast.error("Selecione a campanha.");
    try {
      const resultado = await agendarTodas(data, campanhaId);
      await carregarLista();
      toast.success(
        resultado.adicionadas > 0
          ? `${resultado.adicionadas} família(s) elegível(is) adicionada(s).`
          : "Todas as famílias elegíveis já estão na lista.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar as famílias.",
      );
    }
  }

  async function finalizar(
    item: DistribuicaoDocumento,
    status: Exclude<StatusDistribuicao, "AGENDADA">,
  ) {
    try {
      setAtualizando(item.id);
      await marcar(item.id, status);
      await carregarLista();
      toast.success(
        status === "AUSENTE"
          ? "Ausência registrada."
          : "Cesta baixada com sucesso.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível atualizar.",
      );
    } finally {
      setAtualizando(null);
    }
  }

  async function desfazer(item: DistribuicaoDocumento) {
    if (
      !window.confirm(
        `Desfazer a baixa de ${item.familiaNome}? A cesta retornará ao saldo disponível e a família voltará para a fila.`,
      )
    )
      return;
    try {
      setAtualizando(item.id);
      await desfazerBaixa(item.id);
      await carregarLista();
      toast.success(
        "Baixa desfeita; cesta devolvida ao saldo e família reaberta na fila.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível desfazer a baixa.",
      );
    } finally {
      setAtualizando(null);
    }
  }

  const agendadas = lista.filter((item) => item.status === "AGENDADA").length;
  const retiradas = lista.filter(
    (item) =>
      item.status === "RETIRADA" || item.status === "ENTREGUE_DOMICILIO",
  ).length;
  const ausentes = lista.filter((item) => item.status === "AUSENTE").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distribuição de Cestas"
        description="Lista rápida de retirada e entrega por data."
      />
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Aguardando", value: agendadas },
          { label: "Recebidas", value: retiradas },
          { label: "Ausentes", value: ausentes },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <p className="text-3xl font-bold">{item.value}</p>
            <p className="text-sm text-slate-500">{item.label}</p>
          </div>
        ))}
      </section>

      <FormSection
        title="Preparar lista"
        description="Primeiro selecione a data da fila que será exibida abaixo. Depois inclua as famílias previstas."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <TextField
            label="Data da lista de distribuição"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Campanha para inclusão
            <select
              value={campanhaId}
              onChange={(e) => setCampanhaId(e.target.value)}
              className="rounded-lg border px-4 py-3"
            >
              <option value="">Selecione a campanha</option>
              {campanhas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Família para inclusão
            <select
              value={familiaId}
              onChange={(e) => setFamiliaId(e.target.value)}
              className="rounded-lg border px-4 py-3"
            >
              <option value="">Selecione a família</option>
              {familias
                .filter((f) => !f.beneficioBloqueado)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nomeResponsavel}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={adicionar}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white"
          >
            <Plus size={18} /> Adicionar selecionada
          </button>
          <button
            type="button"
            onClick={adicionarTodas}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 hover:bg-blue-100"
          >
            <Plus size={18} /> Adicionar todas as elegíveis
          </button>
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-200 pt-4">
          <div className="mr-2">
            <p className="text-sm font-semibold text-slate-800">
              Remarcar famílias agendadas
            </p>
            <p className="text-xs text-slate-500">
              Move apenas as famílias que ainda estão como agendadas nesta
              lista.
            </p>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Nova data para remarcação
            <input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="rounded-lg border px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={() => void moverAgendadas()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Remarcar agendadas
          </button>
        </div>
      </FormSection>

      {agendadas > 0 && (
        <section className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-red-900">
              Excluir lista agendada desta data
            </p>
            <p className="text-sm text-red-700">
              Remove somente as {agendadas} família(s) ainda agendadas. As
              cestas prontas não serão removidas do estoque.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void excluirListaAgendada()}
            className="rounded-lg border border-red-300 bg-white px-4 py-3 font-semibold text-red-700 hover:bg-red-100"
          >
            Excluir agendadas
          </button>
        </section>
      )}

      <section className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Fila de distribuição exibida
          </p>
          <h2 className="text-xl font-bold text-slate-900">
            {new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </h2>
        </div>
        <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-semibold text-blue-700 shadow-sm">
          {lista.length} família(s) na data
        </span>
      </section>

      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={20}
        />
        <input
          type="search"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Localizar família na fila..."
          className="w-full rounded-lg border bg-white py-3 pl-12 pr-4"
        />
      </div>

      {agendadas > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={imprimirPendentes}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer size={18} /> Imprimir pendentes
          </button>
        </div>
      )}

      <div className="space-y-3">
        {listaFiltrada.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">
                {item.familiaNome.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {item.familiaNome}
                </p>
                <div className="mt-1 grid grid-cols-2 gap-x-5 text-xs text-slate-600">
                  <span>
                    <b className="mr-1 text-slate-500">CPF:</b>
                    {familiasPorId.get(item.familiaId)?.cpf || "Não informado"}
                  </span>
                  <span>
                    <b className="mr-1 text-slate-500">RG:</b>
                    {familiasPorId.get(item.familiaId)?.rg || "Não informado"}
                  </span>
                </div>
                <StatusBadge status={item.status} />
                <Link
                  href={`/familias/${item.familiaId}`}
                  className="mt-2 inline-flex text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline"
                >
                  Abrir cadastro da família
                </Link>
              </div>
            </div>
            {item.status === "AGENDADA" ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  disabled={atualizando === item.id}
                  onClick={() => finalizar(item, "RETIRADA")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  <CheckCircle2 size={18} /> Retirada
                </button>
                <button
                  disabled={atualizando === item.id}
                  onClick={() => finalizar(item, "AUSENTE")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  <UserX size={18} /> Ausente
                </button>
                <button
                  disabled={atualizando === item.id}
                  onClick={() => finalizar(item, "ENTREGUE_DOMICILIO")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  <Home size={18} /> Em casa
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-400">
                  Atendimento finalizado
                </span>
                {(item.status === "RETIRADA" ||
                  item.status === "ENTREGUE_DOMICILIO") && (
                  <button
                    disabled={atualizando === item.id}
                    onClick={() => void desfazer(item)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Undo2 size={17} /> Desfazer baixa
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {listaFiltrada.length === 0 && (
          <div className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">
            Nenhuma família nesta lista.
          </div>
        )}
      </div>
    </div>
  );
}
