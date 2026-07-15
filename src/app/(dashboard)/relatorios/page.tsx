"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  CalendarCheck,
  Gift,
  PackageCheck,
  ShoppingCart,
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

  const indicadores = relatorio
    ? [
        { label: "Famílias atendidas", value: relatorio.familiasAtendidas, icon: UserCheck, color: "text-green-700" },
        { label: "Cestas entregues", value: relatorio.cestasEntregues, icon: PackageCheck, color: "text-blue-700" },
        { label: "Ausências", value: relatorio.ausencias, icon: UserX, color: "text-amber-700" },
        { label: "Bloqueios atuais", value: relatorio.familiasBloqueadas, icon: Ban, color: "text-red-700" },
        { label: "Visitas realizadas", value: relatorio.visitasRealizadas, icon: CalendarCheck, color: "text-violet-700" },
        { label: "Entradas por doação", value: relatorio.entradasPorDoacao, icon: Gift, color: "text-pink-700" },
        { label: "Investimento da paróquia", value: moeda(relatorio.investimentoParoquia), icon: ShoppingCart, color: "text-slate-700" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Indicadores mensais da atuação pastoral e da distribuição de benefícios."
      />

      <FormSection title="Período" description="Selecione o mês de referência dos indicadores.">
        <div className="max-w-xs">
          <TextField label="Mês" type="month" value={mes} onChange={(event) => setMes(event.target.value)} />
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

          <FormSection title="Desempenho das campanhas" description="Produção e entrega de cestas no mês selecionado.">
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
            <FormSection title="Ausências no período" description="Famílias que não compareceram à retirada.">
              {relatorio.familiasComAusencias.length ? (
                <ul className="divide-y divide-slate-100">
                  {relatorio.familiasComAusencias.map((familia) => (
                    <li key={familia.familiaId} className="flex justify-between gap-4 py-3">
                      <span className="font-medium text-slate-900">{familia.nome}</span>
                      <span className="text-sm text-amber-700">{familia.quantidade} falta(s)</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-500">Nenhuma ausência registrada.</p>}
            </FormSection>

            <FormSection title="Famílias bloqueadas" description="Bloqueios ativos por faltas consecutivas.">
              {relatorio.familiasBloqueadasDetalhes.length ? (
                <ul className="divide-y divide-slate-100">
                  {relatorio.familiasBloqueadasDetalhes.map((familia) => (
                    <li key={familia.id} className="flex justify-between gap-4 py-3">
                      <span className="font-medium text-slate-900">{familia.nome}</span>
                      <span className="text-sm text-red-700">{familia.faltas} consecutivas</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-500">Nenhuma família bloqueada.</p>}
            </FormSection>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            “Bloqueios atuais” representa a situação cadastral no momento da consulta. Os demais indicadores respeitam o mês selecionado.
          </div>
        </>
      ) : null}
    </div>
  );
}
