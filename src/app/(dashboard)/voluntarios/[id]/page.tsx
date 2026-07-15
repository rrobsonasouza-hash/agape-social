"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  PackageCheck,
  Pencil,
  Power,
  RotateCcw,
  User,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileMetrics } from "@/components/profile/ProfileMetrics";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { Timeline } from "@/components/profile/Timeline";

import { useVoluntarios } from "@/modules/voluntarios/hooks/useVoluntarios";
import { VoluntarioDocumento } from "@/modules/voluntarios/types/voluntario-documento";

const nomesDias = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
} as const;

function formatarData(data?: string): string | undefined {
  if (!data) {
    return undefined;
  }

  const [ano, mes, dia] = data.split("-");

  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

function calcularTempoServico(dataIngresso?: string): string {
  if (!dataIngresso) {
    return "Não informado";
  }

  const dataInicial = new Date(`${dataIngresso}T00:00:00`);

  if (Number.isNaN(dataInicial.getTime())) {
    return "Não informado";
  }

  const hoje = new Date();

  let anos = hoje.getFullYear() - dataInicial.getFullYear();
  let meses = hoje.getMonth() - dataInicial.getMonth();

  if (hoje.getDate() < dataInicial.getDate()) {
    meses -= 1;
  }

  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }

  if (anos > 0) {
    return anos === 1 ? "1 ano" : `${anos} anos`;
  }

  if (meses > 0) {
    return meses === 1 ? "1 mês" : `${meses} meses`;
  }

  return "Menos de 1 mês";
}

export default function DetalhesVoluntarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { buscarPorId, alterarStatus } = useVoluntarios();

  const [voluntario, setVoluntario] =
    useState<VoluntarioDocumento | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [alterandoStatus, setAlterandoStatus] = useState(false);

  useEffect(() => {
    async function carregarVoluntario() {
      try {
        const dados = await buscarPorId(params.id);

        if (!dados) {
          toast.error("Voluntário não encontrado.");
          router.push("/voluntarios");
          return;
        }

        setVoluntario(dados);
      } catch (error) {
        console.error("Erro ao carregar voluntário:", error);

        toast.error(
          "Não foi possível carregar os dados do voluntário."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarVoluntario();
  }, [buscarPorId, params.id, router]);

  const diasDisponiveis = useMemo(() => {
    if (!voluntario?.disponibilidade) {
      return [];
    }

    return Object.entries(voluntario.disponibilidade)
      .filter(([, disponivel]) => disponivel)
      .map(
        ([dia]) =>
          nomesDias[dia as keyof typeof nomesDias]
      );
  }, [voluntario]);

  async function mudarStatus() {
    if (!voluntario) {
      return;
    }

    const novoStatus =
      voluntario.status === "ATIVO"
        ? "INATIVO"
        : "ATIVO";

    const acao =
      novoStatus === "INATIVO"
        ? "inativar"
        : "reativar";

    const confirmado = window.confirm(
      `Deseja realmente ${acao} este voluntário?`
    );

    if (!confirmado) {
      return;
    }

    try {
      setAlterandoStatus(true);

      await alterarStatus(
        voluntario.id,
        novoStatus
      );

      setVoluntario({
        ...voluntario,
        status: novoStatus,
      });

      toast.success(
        novoStatus === "ATIVO"
          ? "Voluntário reativado com sucesso!"
          : "Voluntário inativado com sucesso!"
      );
    } catch (error) {
      console.error(
        "Erro ao alterar status do voluntário:",
        error
      );

      toast.error(
        "Não foi possível alterar o status do voluntário."
      );
    } finally {
      setAlterandoStatus(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-slate-500">
          Carregando dados do voluntário...
        </p>
      </div>
    );
  }

  if (!voluntario) {
    return null;
  }

  const voluntarioAtivo =
    voluntario.status === "ATIVO";

  const dataIngressoFormatada =
    formatarData(voluntario.dataIngresso);

  const dataNascimentoFormatada =
    formatarData(voluntario.dataNascimento);

  const tempoServico =
    calcularTempoServico(voluntario.dataIngresso);

  const subtitulo = [
    voluntario.funcao,
    voluntario.pastoral,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/voluntarios")}
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition hover:text-blue-900"
      >
        <ArrowLeft size={18} />
        Voltar para voluntários
      </button>

      <ProfileHeader
        title={voluntario.nome}
        subtitle={subtitulo}
        status={voluntario.status}
        since={dataIngressoFormatada}
        phone={voluntario.telefone}
        email={voluntario.email || undefined}
        actions={
          <>
            <Button
              type="button"
              className="flex items-center justify-center gap-2"
              onClick={() =>
                router.push(
                  `/voluntarios/${voluntario.id}/editar`
                )
              }
            >
              <Pencil size={18} />
              Editar
            </Button>

            <Button
              type="button"
              disabled={alterandoStatus}
              onClick={mudarStatus}
              className={`flex items-center justify-center gap-2 ${
                voluntarioAtivo
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {voluntarioAtivo ? (
                <Power size={18} />
              ) : (
                <RotateCcw size={18} />
              )}

              {alterandoStatus
                ? "Atualizando..."
                : voluntarioAtivo
                  ? "Inativar"
                  : "Reativar"}
            </Button>
          </>
        }
      />

      <ProfileMetrics
        items={[
          {
            label: "Famílias acompanhadas",
            value: 0,
            description: "Vínculos ativos",
            icon: Users,
          },
          {
            label: "Visitas realizadas",
            value: 0,
            description: "Histórico pastoral",
            icon: CalendarCheck,
          },
          {
            label: "Entregas realizadas",
            value: 0,
            description: "Cestas e benefícios",
            icon: PackageCheck,
          },
          {
            label: "Tempo de serviço",
            value: tempoServico,
            description: "Atuação voluntária",
            icon: Award,
          },
        ]}
      />

      {!voluntarioAtivo && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
          <p className="font-semibold">
            Este voluntário está inativo.
          </p>

          <p className="mt-1 text-sm">
            O histórico foi preservado, mas ele não será considerado nos indicadores de voluntários ativos.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSection
          title="Dados pessoais"
          description="Informações de identificação do voluntário."
        >
          <dl className="space-y-5">
            <div className="flex items-start gap-3">
              <User
                size={20}
                className="mt-1 shrink-0 text-blue-600"
              />

              <div>
                <dt className="text-sm text-slate-500">
                  Nome completo
                </dt>

                <dd className="font-medium text-slate-900">
                  {voluntario.nome}
                </dd>
              </div>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                CPF
              </dt>

              <dd className="font-medium text-slate-900">
                {voluntario.cpf}
              </dd>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays
                size={20}
                className="mt-1 shrink-0 text-blue-600"
              />

              <div>
                <dt className="text-sm text-slate-500">
                  Data de nascimento
                </dt>

                <dd className="font-medium text-slate-900">
                  {dataNascimentoFormatada ||
                    "Não informada"}
                </dd>
              </div>
            </div>
          </dl>
        </ProfileSection>

        <ProfileSection
          title="Atuação pastoral"
          description="Informações sobre o serviço realizado na paróquia."
        >
          <dl className="space-y-5">
            <div className="flex items-start gap-3">
              <BriefcaseBusiness
                size={20}
                className="mt-1 shrink-0 text-blue-600"
              />

              <div>
                <dt className="text-sm text-slate-500">
                  Pastoral ou área
                </dt>

                <dd className="font-medium text-slate-900">
                  {voluntario.pastoral ||
                    "Não informada"}
                </dd>
              </div>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Função
              </dt>

              <dd className="font-medium text-slate-900">
                {voluntario.funcao ||
                  "Não informada"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Data de ingresso
              </dt>

              <dd className="font-medium text-slate-900">
                {dataIngressoFormatada ||
                  "Não informada"}
              </dd>
            </div>
          </dl>
        </ProfileSection>
      </div>

      <ProfileSection
        title="Disponibilidade"
        description="Dias em que o voluntário normalmente está disponível."
      >
        {diasDisponiveis.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {diasDisponiveis.map((dia) => (
              <span
                key={dia}
                className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
              >
                {dia}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">
            Nenhum dia de disponibilidade foi informado.
          </p>
        )}
      </ProfileSection>

      <ProfileSection
        title="Observações"
        description="Informações adicionais sobre o voluntário."
      >
        <p className="whitespace-pre-line text-slate-700">
          {voluntario.observacoes ||
            "Nenhuma observação registrada."}
        </p>
      </ProfileSection>

      <ProfileSection
        title="Atividades"
        description="Histórico de participação e atendimentos."
      >
        <Timeline
          items={[]}
          emptyTitle="Nenhuma atividade registrada até o momento."
          emptyDescription="Futuramente serão exibidas visitas realizadas, famílias acompanhadas, entregas e outras ações."
        />
      </ProfileSection>
    </div>
  );
}
