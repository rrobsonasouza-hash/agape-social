"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "@/components/forms/Card";
import {
  DataTable,
  DataTableColumn,
} from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

import { useVoluntarios } from "@/modules/voluntarios/hooks/useVoluntarios";
import { VoluntarioDocumento } from "@/modules/voluntarios/types/voluntario-documento";

export default function VoluntariosPage() {
  const { listar } = useVoluntarios();

  const [voluntarios, setVoluntarios] = useState<
    VoluntarioDocumento[]
  >([]);

  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarVoluntarios() {
      try {
        const dados = await listar();
        setVoluntarios(dados);
      } catch (error) {
        console.error(
          "Erro ao carregar voluntários:",
          error
        );

        toast.error(
          "Não foi possível carregar os voluntários."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarVoluntarios();
  }, [listar]);

  const voluntariosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return voluntarios;
    }

    return voluntarios.filter((voluntario) => {
      const nome =
        voluntario.nome?.toLowerCase() ?? "";

      const cpf =
        voluntario.cpf?.toLowerCase() ?? "";

      const telefone =
        voluntario.telefone?.toLowerCase() ?? "";

      const pastoral =
        voluntario.pastoral?.toLowerCase() ?? "";

      const funcao =
        voluntario.funcao?.toLowerCase() ?? "";

      return (
        nome.includes(termo) ||
        cpf.includes(termo) ||
        telefone.includes(termo) ||
        pastoral.includes(termo) ||
        funcao.includes(termo)
      );
    });
  }, [pesquisa, voluntarios]);

  const colunas: DataTableColumn<VoluntarioDocumento>[] = [
    {
      key: "nome",
      title: "Voluntário",
      className: "font-medium text-slate-900",
      render: (voluntario) => voluntario.nome,
    },
    {
      key: "telefone",
      title: "Telefone",
      render: (voluntario) =>
        voluntario.telefone || "Não informado",
    },
    {
      key: "pastoral",
      title: "Pastoral",
      render: (voluntario) =>
        voluntario.pastoral || "Não informada",
    },
    {
      key: "funcao",
      title: "Função",
      render: (voluntario) =>
        voluntario.funcao || "Não informada",
    },
    {
      key: "status",
      title: "Status",
      render: (voluntario) => (
        <StatusBadge status={voluntario.status} />
      ),
    },
    {
      key: "acoes",
      title: "Ações",
      className: "text-right",
      headerClassName: "text-right",
      render: (voluntario) => (
        <Link
          href={`/voluntarios/${voluntario.id}`}
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
        title="Voluntários"
        description="Cadastre e acompanhe as pessoas que colaboram com as atividades pastorais."
        actions={
          <Link
            href="/voluntarios/novo"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Novo Voluntário
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
            onChange={(event) =>
              setPesquisa(event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Pesquisar por nome, CPF, telefone, pastoral ou função..."
          />
        </div>
      </Card>

      <Card title="Voluntários cadastrados">
        <DataTable
          data={voluntariosFiltrados}
          columns={colunas}
          getRowKey={(voluntario) =>
            voluntario.id
          }
          loading={carregando}
          loadingMessage="Carregando voluntários..."
          emptyTitle={
            pesquisa
              ? "Nenhum voluntário encontrado"
              : "Nenhum voluntário cadastrado"
          }
          emptyDescription={
            pesquisa
              ? "Não encontramos voluntários com os critérios informados."
              : "Cadastre o primeiro voluntário para iniciar a gestão da equipe pastoral."
          }
          emptyAction={
            !pesquisa ? (
              <Link
                href="/voluntarios/novo"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={18} />
                Cadastrar primeiro voluntário
              </Link>
            ) : undefined
          }
        />
      </Card>
    </div>
  );
}