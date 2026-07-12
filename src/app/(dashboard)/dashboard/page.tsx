"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import {
  CalendarPlus,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  DashboardCard,
} from "@/components/dashboard/DashboardCard";

import {
  WelcomeCard,
} from "@/components/dashboard/WelcomeCard";

import {
  Card,
} from "@/components/forms/Card";

import {
  useDashboard,
} from "@/modules/dashboard/hooks/useDashboard";

import {
  DashboardResumo,
} from "@/modules/dashboard/types/dashboard.types";

const resumoInicial: DashboardResumo = {
  familiasAtivas: 0,
  familiasInativas: 0,
  totalFamilias: 0,
  familiasCadastradasMes: 0,
  ultimasFamilias: [],
};

export default function DashboardPage() {
  const { buscarResumo } = useDashboard();

  const [resumo, setResumo] =
    useState<DashboardResumo>(resumoInicial);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const dados = await buscarResumo();
        setResumo(dados);
      } catch (error) {
        console.error(
          "Erro ao carregar o Dashboard:",
          error
        );

        toast.error(
          "Não foi possível carregar os indicadores."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDashboard();
  }, [buscarResumo]);

  function formatarData(
    data: Date | null
  ) {
    if (!data) {
      return "Data não informada";
    }

    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    ).format(data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-1 text-slate-500">
          Acompanhe os principais indicadores
          da Pastoral Social.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Famílias Ativas"
          value={
            carregando
              ? "..."
              : resumo.familiasAtivas
          }
          description="Em acompanhamento"
          icon={UserCheck}
        />

        <DashboardCard
          title="Famílias Inativas"
          value={
            carregando
              ? "..."
              : resumo.familiasInativas
          }
          description="Histórico preservado"
          icon={UserMinus}
        />

        <DashboardCard
          title="Total de Famílias"
          value={
            carregando
              ? "..."
              : resumo.totalFamilias
          }
          description="Todos os cadastros"
          icon={Users}
        />

        <DashboardCard
          title="Cadastros no Mês"
          value={
            carregando
              ? "..."
              : resumo.familiasCadastradasMes
          }
          description="Novas famílias"
          icon={CalendarPlus}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <WelcomeCard />

        <Card title="Últimas famílias cadastradas">
          {carregando ? (
            <div className="py-10 text-center text-slate-500">
              Carregando famílias...
            </div>
          ) : resumo.ultimasFamilias.length ===
            0 ? (
            <div className="py-10 text-center">
              <p className="font-medium text-slate-700">
                Nenhuma família cadastrada.
              </p>

              <Link
                href="/familias/nova"
                className="mt-3 inline-block font-medium text-blue-700 hover:underline"
              >
                Cadastrar primeira família
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {resumo.ultimasFamilias.map(
                (familia) => (
                  <Link
                    key={familia.id}
                    href={`/familias/${familia.id}`}
                    className="flex items-center justify-between gap-4 py-4 transition first:pt-0 last:pb-0 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {familia.nomeResponsavel}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {familia.cidade}
                        {" • "}
                        {formatarData(
                          familia.createdAt
                        )}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        familia.status === "ATIVA"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {familia.status === "ATIVA"
                        ? "Ativa"
                        : "Inativa"}
                    </span>
                  </Link>
                )
              )}
            </div>
          )}

          <div className="mt-6 border-t pt-4 text-right">
            <Link
              href="/familias"
              className="font-medium text-blue-700 hover:underline"
            >
              Ver todas as famílias
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}