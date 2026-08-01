"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "@/components/forms/Card";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

import { useFamilias } from "@/modules/familias/hooks/useFamilias";
import { FamiliaDocumento } from "@/modules/familias/types/familia-documento";

export default function FamiliasPage() {
  const { listar } = useFamilias();

  const [familias, setFamilias] = useState<FamiliaDocumento[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [ordenacao, setOrdenacao] = useState<
    "nome-asc" | "nome-desc" | "cidade-asc" | "status-asc"
  >("nome-asc");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarFamilias() {
      try {
        const dados = await listar();
        setFamilias(dados);
      } catch (error) {
        console.error("Erro ao carregar famílias:", error);
        toast.error("Não foi possível carregar as famílias.");
      } finally {
        setCarregando(false);
      }
    }

    carregarFamilias();
  }, [listar]);

  const familiasFiltradas = useMemo(() => {
    const normalizar = (valor?: string | null) =>
      (valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR");
    const termo = normalizar(pesquisa.trim());
    const comparador = new Intl.Collator("pt-BR", {
      sensitivity: "base",
      numeric: true,
    });

    const filtradas = familias.filter((familia) => {
      if (!termo) return true;

      const nome = normalizar(familia.nomeResponsavel);
      const cpf = normalizar(familia.cpf);
      const rg = normalizar(familia.rg);
      const telefone = normalizar(familia.telefone);
      const cidade = normalizar(familia.cidade);

      return (
        nome.includes(termo) ||
        cpf.includes(termo) ||
        rg.includes(termo) ||
        telefone.includes(termo) ||
        cidade.includes(termo)
      );
    });

    return filtradas.sort((primeira, segunda) => {
      if (ordenacao === "nome-desc") {
        return comparador.compare(
          segunda.nomeResponsavel,
          primeira.nomeResponsavel,
        );
      }

      if (ordenacao === "cidade-asc") {
        const porCidade = comparador.compare(
          primeira.cidade || "\uffff",
          segunda.cidade || "\uffff",
        );

        return (
          porCidade ||
          comparador.compare(primeira.nomeResponsavel, segunda.nomeResponsavel)
        );
      }

      if (ordenacao === "status-asc") {
        const porStatus = comparador.compare(primeira.status, segunda.status);

        return (
          porStatus ||
          comparador.compare(primeira.nomeResponsavel, segunda.nomeResponsavel)
        );
      }

      return comparador.compare(
        primeira.nomeResponsavel,
        segunda.nomeResponsavel,
      );
    });
  }, [familias, ordenacao, pesquisa]);

  const colunas: DataTableColumn<FamiliaDocumento>[] = [
    {
      key: "responsavel",
      title: "Responsável",
      className: "font-medium text-slate-900",
      render: (familia) => familia.nomeResponsavel,
    },
    {
      key: "cpf",
      title: "CPF",
      render: (familia) => familia.cpf,
    },
    {
      key: "telefone",
      title: "Telefone",
      render: (familia) => familia.telefone,
    },
    {
      key: "cidade",
      title: "Cidade",
      render: (familia) => familia.cidade || "Não informada",
    },
    {
      key: "status",
      title: "Status",
      render: (familia) => <StatusBadge status={familia.status} />,
    },
    {
      key: "acoes",
      title: "Ações",
      className: "text-right",
      headerClassName: "text-right",
      render: (familia) => (
        <Link
          href={`/familias/${familia.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 font-medium text-blue-700 transition hover:bg-blue-50"
        >
          <Eye size={17} />
          Visualizar
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Famílias"
        description="Cadastro e acompanhamento das famílias atendidas pela Pastoral Social."
        actions={
          <Link
            href="/familias/nova"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Nova Família
          </Link>
        }
      />

      <Card title="Pesquisar">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={pesquisa}
            onChange={(event) => setPesquisa(event.target.value)}
            className="w-full rounded-lg border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Pesquisar por nome, CPF, RG, telefone ou cidade..."
          />
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-xl font-semibold">Famílias cadastradas</h2>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            Ordenar por
            <select
              value={ordenacao}
              onChange={(event) =>
                setOrdenacao(
                  event.target.value as
                    "nome-asc" | "nome-desc" | "cidade-asc" | "status-asc",
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="nome-asc">Nome (A–Z)</option>
              <option value="nome-desc">Nome (Z–A)</option>
              <option value="cidade-asc">Cidade (A–Z)</option>
              <option value="status-asc">Status</option>
            </select>
          </label>
        </div>
        <DataTable
          data={familiasFiltradas}
          columns={colunas}
          getRowKey={(familia) => familia.id}
          loading={carregando}
          loadingMessage="Carregando famílias..."
          emptyTitle={
            pesquisa
              ? "Nenhuma família encontrada"
              : "Nenhuma família cadastrada"
          }
          emptyDescription={
            pesquisa
              ? "Não encontramos famílias com os critérios informados. Tente alterar a pesquisa."
              : "Cadastre a primeira família para iniciar o acompanhamento da Pastoral Social."
          }
          emptyAction={
            !pesquisa ? (
              <Link
                href="/familias/nova"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={18} />
                Cadastrar primeira família
              </Link>
            ) : undefined
          }
        />
      </Card>
    </div>
  );
}
