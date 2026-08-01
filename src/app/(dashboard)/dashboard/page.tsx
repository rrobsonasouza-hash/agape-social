"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  Package,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { Card } from "@/components/forms/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

import { useDashboard } from "@/modules/dashboard/hooks/useDashboard";
import { DashboardResumo } from "@/modules/dashboard/types/dashboard.types";

const resumoInicial: DashboardResumo = {
  familiasAtivas: 0,
  familiasInativas: 0,
  totalFamilias: 0,
  familiasCadastradasMes: 0,
  cadastrosIncompletos: 0,

  voluntariosAtivos: 0,
  voluntariosInativos: 0,
  totalVoluntarios: 0,

  cestasDisponiveis: 0,
  campanhasAtivas: 0,
  distribuicoesAgendadas: 0,
  proximasDistribuicoes: 0,
  proximaDataDistribuicao: null,
  distribuicoesEntreguesMes: 0,
  distribuicoesAusentesMes: 0,
  campanhas: [],
  distribuicoesPorMes: [],

  ultimasFamilias: [],
};

export default function DashboardPage() {
  const { buscarResumo } = useDashboard();

  const [resumo, setResumo] = useState<DashboardResumo>(resumoInicial);

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const dados = await buscarResumo();

        setResumo(dados);
      } catch (error) {
        console.error("Erro ao carregar o Dashboard:", error);

        toast.error("Não foi possível carregar os indicadores.");
      } finally {
        setCarregando(false);
      }
    }

    carregarDashboard();
  }, [buscarResumo]);

  function formatarData(data: Date | null) {
    if (!data) {
      return "Data não informada";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(data);
  }

  function formatarDia(data: string | null) {
    if (!data) return "Nenhuma distribuição futura";

    const [ano, mes, dia] = data.split("-").map(Number);

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(new Date(ano, mes - 1, dia));
  }

  const maiorVolume = Math.max(
    1,
    ...resumo.distribuicoesPorMes.flatMap((mes) => [
      mes.entregues,
      mes.ausentes,
    ]),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel Pastoral"
        description="Acompanhe os principais indicadores e as atividades da Pastoral Social."
      />

      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
              Visão de hoje
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              A caridade organizada começa pela prioridade certa.
            </h2>
            <p className="mt-3 leading-6 text-blue-100">
              Veja o que exige atenção agora e acompanhe o impacto das
              distribuições da sua paróquia.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs text-blue-100">Próxima lista</p>
              <p className="mt-1 text-xl font-bold">
                {carregando
                  ? "..."
                  : formatarDia(resumo.proximaDataDistribuicao)}
              </p>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs text-blue-100">Agendadas</p>
              <p className="mt-1 text-xl font-bold">
                {carregando ? "..." : resumo.proximasDistribuicoes}
              </p>
            </div>
            <div className="col-span-2 rounded-xl bg-amber-400/20 px-4 py-3 backdrop-blur sm:col-span-1">
              <p className="text-xs text-amber-100">Cadastros pendentes</p>
              <p className="mt-1 text-xl font-bold">
                {carregando ? "..." : resumo.cadastrosIncompletos}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/familias"
          className="group rounded-2xl border border-amber-200 bg-amber-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="font-semibold text-amber-950">
                Cadastros para revisar
              </p>
              <p className="mt-1 text-sm leading-5 text-amber-800">
                {carregando
                  ? "Carregando..."
                  : `${resumo.cadastrosIncompletos} família(s) sem dados essenciais de contato ou identificação.`}
              </p>
            </div>
          </div>
        </Link>
        <Link
          href="/estoque"
          className="group rounded-2xl border border-emerald-200 bg-emerald-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <Package size={24} />
            </div>
            <div>
              <p className="font-semibold text-emerald-950">
                Estoque de cestas
              </p>
              <p className="mt-1 text-sm leading-5 text-emerald-800">
                {carregando
                  ? "Carregando..."
                  : `${resumo.cestasDisponiveis} cesta(s) prontas disponíveis para as próximas listas.`}
              </p>
            </div>
          </div>
        </Link>
        <Link
          href="/cestas/distribuicao"
          className="group rounded-2xl border border-blue-200 bg-blue-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <CalendarDays size={24} />
            </div>
            <div>
              <p className="font-semibold text-blue-950">
                Distribuições em aberto
              </p>
              <p className="mt-1 text-sm leading-5 text-blue-800">
                {carregando
                  ? "Carregando..."
                  : `${resumo.distribuicoesAgendadas} cesta(s) aguardando retirada ou entrega.`}
              </p>
            </div>
          </div>
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <Card>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700">
                Impacto
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Entregas nos últimos meses
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Cestas retiradas ou entregues em comparação às ausências.
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="flex h-56 items-end justify-between gap-3 border-b border-slate-200 pb-7">
            {resumo.distribuicoesPorMes.map((mes) => (
              <div
                key={mes.rotulo}
                className="flex h-full flex-1 items-end justify-center gap-1.5"
              >
                <div className="group relative flex h-full flex-1 items-end">
                  <div
                    style={{
                      height: `${(mes.entregues / maiorVolume) * 100}%`,
                    }}
                    className="min-h-1 w-full rounded-t-md bg-blue-600 transition group-hover:bg-blue-700"
                    title={`${mes.entregues} entrega(s)`}
                  />
                </div>
                <div className="group relative flex h-full flex-1 items-end">
                  <div
                    style={{ height: `${(mes.ausentes / maiorVolume) * 100}%` }}
                    className="min-h-1 w-full rounded-t-md bg-amber-400 transition group-hover:bg-amber-500"
                    title={`${mes.ausentes} ausência(s)`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between gap-3 text-center text-xs font-medium text-slate-500">
            {resumo.distribuicoesPorMes.map((mes) => (
              <span key={mes.rotulo} className="flex-1 capitalize">
                {mes.rotulo}
              </span>
            ))}
          </div>
          <div className="mt-5 flex gap-5 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <i className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Entregues
            </span>
            <span className="flex items-center gap-2">
              <i className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Ausentes
            </span>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Resultado do mês
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Distribuições
          </h2>
          <div className="mt-7 space-y-5">
            <div>
              <div className="flex items-end justify-between">
                <span className="text-sm text-slate-600">
                  Entregas concluídas
                </span>
                <strong className="text-3xl text-emerald-700">
                  {carregando ? "..." : resumo.distribuicoesEntreguesMes}
                </strong>
              </div>
              <div className="mt-2 h-2 rounded-full bg-emerald-100">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min(100, (resumo.distribuicoesEntreguesMes / Math.max(1, resumo.distribuicoesEntreguesMes + resumo.distribuicoesAusentesMes)) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-end justify-between">
                <span className="text-sm text-slate-600">
                  Ausências registradas
                </span>
                <strong className="text-3xl text-amber-600">
                  {carregando ? "..." : resumo.distribuicoesAusentesMes}
                </strong>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Use a fila de distribuição para acompanhar e reagendar quando
                necessário.
              </p>
            </div>
          </div>
          <Link
            href="/cestas/distribuicao"
            className="mt-8 inline-flex font-semibold text-blue-700 hover:underline"
          >
            Abrir fila de distribuição
          </Link>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Campanhas em andamento
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Acompanhe metas, arrecadação e saldo disponível de cada campanha.
            </p>
          </div>
          <Link
            href="/cestas"
            className="font-medium text-blue-700 hover:underline"
          >
            Gerenciar campanhas
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {resumo.campanhas.length === 0 && !carregando ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-slate-500 lg:col-span-3">
              Ainda não há campanhas ativas. Crie uma campanha para acompanhar
              metas e estoque.
            </div>
          ) : (
            resumo.campanhas.slice(0, 3).map((campanha) => {
              const percentual = campanha.metaCestas
                ? Math.min(
                    100,
                    (campanha.recebidas / campanha.metaCestas) * 100,
                  )
                : 0;
              return (
                <Link
                  key={campanha.id}
                  href="/cestas"
                  className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex justify-between gap-3">
                    <p className="font-semibold text-slate-900">
                      {campanha.nome}
                    </p>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                      {Math.round(percentual)}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Meta de {campanha.metaCestas} cestas
                  </p>
                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <strong className="block text-base text-slate-900">
                        {campanha.recebidas}
                      </strong>
                      <span className="text-slate-500">Recebidas</span>
                    </div>
                    <div>
                      <strong className="block text-base text-slate-900">
                        {campanha.distribuidas}
                      </strong>
                      <span className="text-slate-500">Entregues</span>
                    </div>
                    <div>
                      <strong className="block text-base text-emerald-700">
                        {campanha.saldo}
                      </strong>
                      <span className="text-slate-500">Saldo</span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Famílias</h2>

          <p className="mt-1 text-sm text-slate-500">
            Visão geral das famílias cadastradas e acompanhadas.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Famílias Ativas"
            value={carregando ? "..." : resumo.familiasAtivas}
            description="Em acompanhamento"
            icon={UserCheck}
          />

          <DashboardCard
            title="Famílias Inativas"
            value={carregando ? "..." : resumo.familiasInativas}
            description="Histórico preservado"
            icon={UserMinus}
          />

          <DashboardCard
            title="Total de Famílias"
            value={carregando ? "..." : resumo.totalFamilias}
            description="Todos os cadastros"
            icon={Users}
          />

          <DashboardCard
            title="Cadastros no Mês"
            value={carregando ? "..." : resumo.familiasCadastradasMes}
            description="Novas famílias"
            icon={CalendarPlus}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Voluntários</h2>

          <p className="mt-1 text-sm text-slate-500">
            Pessoas que colaboram com as atividades pastorais.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <DashboardCard
            title="Voluntários Ativos"
            value={carregando ? "..." : resumo.voluntariosAtivos}
            description="Disponíveis para atuação"
            icon={UserCheck}
          />

          <DashboardCard
            title="Voluntários Inativos"
            value={carregando ? "..." : resumo.voluntariosInativos}
            description="Histórico preservado"
            icon={UserMinus}
          />

          <DashboardCard
            title="Total de Voluntários"
            value={carregando ? "..." : resumo.totalVoluntarios}
            description="Todos os cadastros"
            icon={Users}
          />
        </div>

        <div className="text-right">
          <Link
            href="/voluntarios"
            className="font-medium text-blue-700 transition hover:text-blue-900 hover:underline"
          >
            Ver todos os voluntários
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <WelcomeCard />

        <Card title="Últimas famílias cadastradas">
          {carregando ? (
            <div className="py-10 text-center text-slate-500">
              Carregando famílias...
            </div>
          ) : resumo.ultimasFamilias.length === 0 ? (
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
            <div className="divide-y divide-slate-100">
              {resumo.ultimasFamilias.map((familia) => (
                <Link
                  key={familia.id}
                  href={`/familias/${familia.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg px-2 py-4 transition first:pt-0 last:pb-0 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {familia.nomeResponsavel}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {familia.cidade}
                      {" • "}
                      {formatarData(familia.createdAt)}
                    </p>
                  </div>

                  <StatusBadge status={familia.status} />
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4 text-right">
            <Link
              href="/familias"
              className="font-medium text-blue-700 transition hover:text-blue-900 hover:underline"
            >
              Ver todas as famílias
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
