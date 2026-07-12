"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Power,
  User,
  Users,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { Card } from "@/components/forms/Card";
import { useFamilias } from "@/modules/familias/hooks/useFamilias";
import { FamiliaDocumento } from "@/modules/familias/types/familia-documento";

export default function DetalhesFamiliaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const {
    buscarPorId,
    alterarStatus,
  } = useFamilias();

  const [familia, setFamilia] =
    useState<FamiliaDocumento | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [alterandoStatus, setAlterandoStatus] =
    useState(false);

  useEffect(() => {
    async function carregarFamilia() {
      try {
        const dados = await buscarPorId(params.id);

        if (!dados) {
          toast.error("Família não encontrada.");
          router.push("/familias");
          return;
        }

        setFamilia(dados);
      } catch (error) {
        console.error("Erro ao carregar a família:", error);

        toast.error(
          "Não foi possível carregar os dados da família."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarFamilia();
  }, [buscarPorId, params.id, router]);

  async function alternarStatus() {
    if (!familia) {
      return;
    }

    const novoStatus =
      familia.status === "ATIVA"
        ? "INATIVA"
        : "ATIVA";

    const acao =
      novoStatus === "INATIVA"
        ? "inativar"
        : "reativar";

    const confirmado = window.confirm(
      `Deseja realmente ${acao} esta família?`
    );

    if (!confirmado) {
      return;
    }

    try {
      setAlterandoStatus(true);

      await alterarStatus(familia.id, novoStatus);

      setFamilia({
        ...familia,
        status: novoStatus,
      });

      toast.success(
        novoStatus === "ATIVA"
          ? "Família reativada com sucesso!"
          : "Família inativada com sucesso!"
      );
    } catch (error) {
      console.error(
        "Erro ao alterar status da família:",
        error
      );

      toast.error(
        "Não foi possível alterar o status da família."
      );
    } finally {
      setAlterandoStatus(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-slate-500">
          Carregando dados da família...
        </p>
      </div>
    );
  }

  if (!familia) {
    return null;
  }

  const enderecoCompleto = [
    familia.logradouro,
    familia.numero,
    familia.complemento,
    familia.bairro,
    familia.cidade,
    familia.estado,
  ]
    .filter(Boolean)
    .join(", ");

  const rendaFormatada = Number(
    familia.rendaFamiliar || 0
  ).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const familiaAtiva =
    familia.status === "ATIVA";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/familias")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition hover:text-blue-900"
          >
            <ArrowLeft size={18} />
            Voltar para famílias
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            {familia.nomeResponsavel}
          </h1>

          <p className="mt-1 text-slate-500">
            Prontuário social da família.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className={`flex items-center justify-center gap-2 ${
              familiaAtiva
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
            onClick={alternarStatus}
            disabled={alterandoStatus}
          >
            <Power size={18} />

            {alterandoStatus
              ? "Alterando..."
              : familiaAtiva
                ? "Inativar Família"
                : "Reativar Família"}
          </Button>

          <Button
            type="button"
            className="flex items-center justify-center gap-2"
            onClick={() =>
              router.push(
                `/familias/${familia.id}/editar`
              )
            }
          >
            <Pencil size={18} />
            Editar Família
          </Button>
        </div>
      </div>

      {!familiaAtiva && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <strong>Família inativa.</strong>{" "}
          O histórico foi preservado, mas ela não será
          contabilizada entre as famílias ativas.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Dados do responsável">
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
                  {familia.nomeResponsavel}
                </dd>
              </div>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                CPF
              </dt>

              <dd className="font-medium text-slate-900">
                {familia.cpf}
              </dd>
            </div>

            <div className="flex items-start gap-3">
              <Phone
                size={20}
                className="mt-1 shrink-0 text-blue-600"
              />

              <div>
                <dt className="text-sm text-slate-500">
                  Telefone
                </dt>

                <dd className="font-medium text-slate-900">
                  {familia.telefone}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail
                size={20}
                className="mt-1 shrink-0 text-blue-600"
              />

              <div>
                <dt className="text-sm text-slate-500">
                  E-mail
                </dt>

                <dd className="break-all font-medium text-slate-900">
                  {familia.email || "Não informado"}
                </dd>
              </div>
            </div>
          </dl>
        </Card>

        <Card title="Situação familiar">
          <dl className="space-y-5">
            <div>
              <dt className="text-sm text-slate-500">
                Status
              </dt>

              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    familiaAtiva
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {familiaAtiva
                    ? "Ativa"
                    : "Inativa"}
                </span>
              </dd>
            </div>

            <div className="flex items-start gap-3">
              <Users
                size={20}
                className="mt-1 shrink-0 text-blue-600"
              />

              <div>
                <dt className="text-sm text-slate-500">
                  Quantidade de moradores
                </dt>

                <dd className="font-medium text-slate-900">
                  {familia.quantidadeMoradores || 1}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Wallet
                size={20}
                className="mt-1 shrink-0 text-blue-600"
              />

              <div>
                <dt className="text-sm text-slate-500">
                  Renda familiar
                </dt>

                <dd className="font-medium text-slate-900">
                  {rendaFormatada}
                </dd>
              </div>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Observações
              </dt>

              <dd className="mt-1 whitespace-pre-line text-slate-900">
                {familia.observacoes ||
                  "Nenhuma observação registrada."}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card title="Endereço">
        <div className="flex items-start gap-3">
          <MapPin
            size={22}
            className="mt-1 shrink-0 text-blue-600"
          />

          <div>
            <p className="font-medium text-slate-900">
              {enderecoCompleto ||
                "Endereço ainda não informado."}
            </p>

            {familia.cep && (
              <p className="mt-1 text-sm text-slate-500">
                CEP: {familia.cep}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card title="Linha do tempo">
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="font-medium text-slate-700">
            Nenhum atendimento registrado até o momento.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Futuramente serão exibidas aqui as visitas,
            entregas de cestas, encaminhamentos e demais
            ações realizadas com esta família.
          </p>
        </div>
      </Card>
    </div>
  );
}