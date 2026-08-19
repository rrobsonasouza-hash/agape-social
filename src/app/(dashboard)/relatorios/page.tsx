"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CalendarCheck,
  ClipboardCheck,
  Gift,
  PackageCheck,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";

import { FormSection } from "@/components/forms/FormSection";
import { TextField } from "@/components/forms/TextField";
import { PageHeader } from "@/components/ui/PageHeader";
import { useRelatorios } from "@/modules/relatorios/hooks/useRelatorios";
import { RelatorioMensal } from "@/modules/relatorios/types/relatorio-mensal";

const mesAtual = new Date().toISOString().slice(0, 7);

export default function RelatoriosPage() {
  const { gerarMensal } = useRelatorios();
  const [mes, setMes] = useState(mesAtual);
  const [relatorio, setRelatorio] = useState<RelatorioMensal | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    gerarMensal(mes)
      .then(setRelatorio)
      .catch((error) => {
        console.error("Erro ao gerar relatório:", error);
        toast.error("Não foi possível gerar o relatório.");
      })
      .finally(() => setCarregando(false));
  }, [gerarMensal, mes]);

  const moeda = (valor: number) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const dataCorteFormatada = relatorio
    ? new Date(`${relatorio.dataCorte}T00:00:00`).toLocaleDateString("pt-BR")
    : "";

  const indicadores = relatorio
    ? [
        { label: "Famílias atendidas", value: relatorio.familiasAtendidas, icon: UserCheck, color: "text-green-700" },
        { label: "Cestas entregues", value: relatorio.cestasEntregues, icon: PackageCheck, color: "text-blue-700" },
        { label: "Ausências no mês", value: relatorio.ausencias, icon: UserX, color: "text-amber-700" },
        { label: "Faltas acumuladas", value: relatorio.faltasAcumuladas, icon: AlertTriangle, color: "text-orange-700" },
        { label: "Bloqueadas na data", value: relatorio.familiasBloqueadas, icon: Ban, color: "text-red-700" },
        { label: "Visitas realizadas", value: relatorio.visitasRealizadas, icon: CalendarCheck, color: "text-violet-700" },
        { label: "Entradas por doação", value: relatorio.entradasPorDoacao, icon: Gift, color: "text-pink-700" },
        { label: "Investimento da paróquia", value: moeda(relatorio.investimentoParoquia), icon: ShoppingCart, color: "text-slate-700" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Indicadores mensais e históricos para apoiar as decisões da atuação pastoral."
      />

      <FormSection
        title="Período"
        description="O resultado operacional considera o mês escolhido; riscos e faltas são acumulados até a data de corte."
      >
        <div className="flex flex-wrap items-end gap-5">
          <div className="w-full max-w-xs">
            <TextField
              label="Mês"
              type="month"
              value={mes}
              onChange={(event) => setMes(event.target.value)}
            />
          </div>
          {relatorio && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <span className="block text-xs font-semibold uppercase tracking-wide text-blue-700">Data de corte do histórico</span>
              <strong>{dataCorteFormatada}</strong>
            </div>
          )}
        </div>
      </FormSection>

      {carregando ? (
        <div className="py-16 text-center text-slate-500">Consolidando dados...</div>
      ) : relatorio ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {indicadores.map((indicador) => {
              const Icon = indicador.icon;
              return (
                <div key={indicador.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <Icon className={indicador.color} />
                  <p className="mt-3 text-3xl font-bold text-slate-900">{indicador.value}</p>
                  <p className="text-sm text-slate-500">{indicador.label}</p>
                </div>
              );
            })}
          </section>

          <FormSection
            title="Painel de decisão"
            description={`Situação acumulada das famílias até ${dataCorteFormatada}.`}
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Comparecimento no mês", value: `${relatorio.taxaComparecimento.toFixed(1)}%`, detail: `${relatorio.familiasAtendidas} família(s) atendida(s)`, icon: TrendingUp, tone: "border-emerald-200 bg-emerald-50 text-emerald-800" },
                { label: "Em alerta", value: relatorio.familiasEmAlerta, detail: "1 ausência consecutiva", icon: AlertTriangle, tone: "border-amber-200 bg-amber-50 text-amber-800" },
                { label: "Próximas do bloqueio", value: relatorio.familiasProximasBloqueio, detail: "2 ausências consecutivas", icon: UserX, tone: "border-orange-200 bg-orange-50 text-orange-800" },
                { label: "Sem baixa", value: relatorio.pendenciasDeBaixa, detail: `Agendamentos até ${dataCorteFormatada}`, icon: ClipboardCheck, tone: "border-blue-200 bg-blue-50 text-blue-800" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.label} className={`rounded-xl border p-4 ${item.tone}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <Icon size={20} />
                    </div>
                    <p className="mt-3 text-3xl font-bold">{item.value}</p>
                    <p className="mt-1 text-xs opacity-80">{item.detail}</p>
                  </article>
                );
              })}
            </div>

            {(relatorio.familiasBloqueadas > 0 ||
              relatorio.familiasProximasBloqueio > 0 ||
              relatorio.pendenciasDeBaixa > 0 ||
              relatorio.taxaComparecimento < 85) && (
              <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
                <p className="font-bold">Prioridades sugeridas</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {relatorio.familiasBloqueadas > 0 && <li>Avaliar as {relatorio.familiasBloqueadas} família(s) bloqueada(s) e programar contato ou visita pastoral.</li>}
                  {relatorio.familiasProximasBloqueio > 0 && <li>Contatar as {relatorio.familiasProximasBloqueio} família(s) com duas ausências consecutivas antes da próxima distribuição.</li>}
                  {relatorio.pendenciasDeBaixa > 0 && <li>Regularizar {relatorio.pendenciasDeBaixa} agendamento(s) passado(s) que continuam sem baixa.</li>}
                  {relatorio.taxaComparecimento < 85 && <li>Revisar comunicação, data e logística: o comparecimento do mês está abaixo de 85%.</li>}
                </ul>
              </div>
            )}
          </FormSection>

          <FormSection
            title="Desempenho das campanhas"
            description="Produção e entrega de cestas no mês selecionado."
          >
            {relatorio.campanhas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                Nenhuma movimentação de campanha neste período.
              </div>
            ) : (
              <div className="space-y-5">
                {relatorio.campanhas.map((campanha) => (
                  <div key={campanha.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{campanha.nome}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Meta: {campanha.meta} • Produzidas/recebidas: {campanha.cestasProduzidas} • Entregues: {campanha.cestasEntregues}
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                        {campanha.percentual.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${campanha.percentual}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          <div className="grid gap-6 xl:grid-cols-2">
            <FormSection
              title="Histórico de ausências"
              description={`Faltas acumuladas até ${dataCorteFormatada}, com destaque para a sequência atual.`}
            >
              {relatorio.familiasComAusencias.length ? (
                <ul className="divide-y divide-slate-100">
                  {relatorio.familiasComAusencias.map((familia) => (
                    <li key={familia.familiaId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <Link href={`/familias/${familia.familiaId}`} className="font-medium text-slate-900 hover:text-blue-700 hover:underline">
                          {familia.nome}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          No mês: {familia.quantidadeNoMes} · Acumuladas: {familia.totalAteCorte} · Última: {new Date(`${familia.ultimaAusencia}T00:00:00`).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          familia.consecutivas >= 3
                            ? "bg-red-100 text-red-800"
                            : familia.consecutivas === 2
                              ? "bg-orange-100 text-orange-800"
                              : familia.consecutivas === 1
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {familia.consecutivas} consecutiva(s)
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Nenhuma ausência registrada até a data de corte.</p>
              )}
            </FormSection>

            <FormSection
              title="Famílias bloqueadas na data de corte"
              description="Situação reconstruída pelo histórico até o período selecionado."
            >
              {relatorio.familiasBloqueadasDetalhes.length ? (
                <ul className="divide-y divide-slate-100">
                  {relatorio.familiasBloqueadasDetalhes.map((familia) => (
                    <li key={familia.id} className="flex justify-between gap-4 py-3">
                      <Link href={`/familias/${familia.id}`} className="font-medium text-slate-900 hover:text-blue-700 hover:underline">
                        {familia.nome}
                      </Link>
                      <span className="text-sm text-red-700">{familia.faltas} consecutivas</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Nenhuma família bloqueada nesta data.</p>
              )}
            </FormSection>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Os indicadores operacionais consideram o mês selecionado. O histórico de faltas, os alertas e os bloqueios são calculados desde o início dos registros até {dataCorteFormatada}.
          </div>
        </>
      ) : null}
    </div>
  );
}
