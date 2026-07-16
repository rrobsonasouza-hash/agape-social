"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  Download,
  FileText,
  ExternalLink,
  Mail,
  MapPin,
  MapPinned,
  PackageCheck,
  Pencil,
  Phone,
  Power,
  RotateCcw,
  User,
  Users,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileMetrics } from "@/components/profile/ProfileMetrics";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { Timeline } from "@/components/profile/Timeline";
import { MapaOpenStreetMap } from "@/components/maps/MapaOpenStreetMap";

import { useFamilias } from "@/modules/familias/hooks/useFamilias";
import { FamiliaDocumento } from "@/modules/familias/types/familia-documento";
import { useDocumentos } from "@/modules/documentos/hooks/useDocumentos";
import { Documento } from "@/modules/documentos/types/documento.types";
import { UploadDocumentos } from "@/modules/documentos/components/UploadDocumentos";
import { calcularDistanciaKm } from "@/lib/geo/distance";
import { pontoEstaNoPoligono } from "@/lib/geo/point-in-polygon";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";
import { useAreasPastorais } from "@/modules/areas-pastorais/hooks/useAreasPastorais";
import { AreaPastoralDocumento } from "@/modules/areas-pastorais/types/area-pastoral-documento";
import { useVisitas } from "@/modules/visitas/hooks/useVisitas";
import { VisitaDocumento } from "@/modules/visitas/types/visita-documento";
import { useCestas } from "@/modules/cestas/hooks/useCestas";
import { MovimentacaoCestas } from "@/modules/cestas/types/cestas.types";

export default function DetalhesFamiliaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { buscarPorId, alterarStatus } = useFamilias();
  const { listarPorEntidade, obterUrlVisualizacao } = useDocumentos();
  const { paroquia } = useParoquia();
  const { listar: listarAreasPastorais } = useAreasPastorais();
  const { listarPorFamilia: listarVisitasPorFamilia } = useVisitas();
  const { listarMovimentacoes } = useCestas();

  const [familia, setFamilia] =
    useState<FamiliaDocumento | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [alterandoStatus, setAlterandoStatus] =
    useState(false);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [areaPastoral, setAreaPastoral] =
    useState<AreaPastoralDocumento | null>(null);
  const [visitas, setVisitas] = useState<VisitaDocumento[]>([]);
  const [entregas, setEntregas] = useState<MovimentacaoCestas[]>([]);

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

        try {
          setVisitas(await listarVisitasPorFamilia(params.id));
        } catch (error) {
          console.error("Erro ao carregar visitas:", error);
        }

        try {
          const movimentos = await listarMovimentacoes();
          setEntregas(
            movimentos.filter(
              (movimento) =>
                movimento.familiaId === params.id &&
                movimento.tipo === "CESTA_PRONTA" &&
                movimento.operacao === "SAIDA"
            )
          );
        } catch (error) {
          console.error("Erro ao carregar benefícios:", error);
        }

        if (
          typeof dados.latitude === "number" &&
          typeof dados.longitude === "number"
        ) {
          try {
            const areas = await listarAreasPastorais();
            const areaEncontrada = areas.find(
              (area) =>
                area.ativa &&
                pontoEstaNoPoligono(
                  {
                    latitude: dados.latitude!,
                    longitude: dados.longitude!,
                  },
                  area.poligono
                )
            );
            setAreaPastoral(areaEncontrada ?? null);
          } catch (error) {
            console.error("Erro ao identificar área pastoral:", error);
          }
        }

        try {
          const documentosDaFamilia = await listarPorEntidade(
            "FAMILIA",
            params.id
          );
          setDocumentos(documentosDaFamilia);
        } catch (error) {
          console.error("Erro ao carregar documentos:", error);
          toast.error("Os documentos da família não puderam ser carregados.");
        }
      } catch (error) {
        console.error(
          "Erro ao carregar a família:",
          error
        );

        toast.error(
          "Não foi possível carregar os dados da família."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarFamilia();
  }, [buscarPorId, listarAreasPastorais, listarMovimentacoes, listarPorEntidade, listarVisitasPorFamilia, params.id, router]);

  async function abrirDocumento(documento: Documento) {
    try {
      const url = await obterUrlVisualizacao(documento.caminhoStorage);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Erro ao abrir documento:", error);
      toast.error("Não foi possível abrir o documento.");
    }
  }

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

      await alterarStatus(
        familia.id,
        novoStatus
      );

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

  const familiaAtiva =
    familia.status === "ATIVA";

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

  const subtitulo = [
    "Responsável familiar",
    familia.cidade || undefined,
  ]
    .filter(Boolean)
    .join(" • ");

  const distanciaPastoralKm =
    paroquia &&
    typeof familia.latitude === "number" &&
    typeof familia.longitude === "number"
      ? calcularDistanciaKm(
          {
            latitude: paroquia.latitude,
            longitude: paroquia.longitude,
          },
          {
            latitude: familia.latitude,
            longitude: familia.longitude,
          }
        )
      : null;

  const ultimaVisitaRealizada = visitas.find(
    (visita) => visita.status === "REALIZADA"
  );

  const formatarDataVisita = (data: string) => {
    const [ano, mes, dia] = data.split("-");
    return dia && mes && ano ? `${dia}/${mes}/${ano}` : data;
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() =>
          router.push("/familias")
        }
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition hover:text-blue-900"
      >
        <ArrowLeft size={18} />
        Voltar para famílias
      </button>

      <ProfileHeader
        title={familia.nomeResponsavel}
        subtitle={subtitulo}
        status={familia.status}
        phone={familia.telefone}
        email={familia.email || undefined}
        actions={
          <>
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
              Editar
            </Button>

            <Button
              type="button"
              disabled={alterandoStatus}
              onClick={alternarStatus}
              className={`flex items-center justify-center gap-2 ${
                familiaAtiva
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {familiaAtiva ? (
                <Power size={18} />
              ) : (
                <RotateCcw size={18} />
              )}

              {alterandoStatus
                ? "Atualizando..."
                : familiaAtiva
                  ? "Inativar"
                  : "Reativar"}
            </Button>
          </>
        }
      />

      <ProfileMetrics
        items={[
          {
            label: "Moradores",
            value:
              familia.quantidadeMoradores ||
              1,
            description:
              "Pessoas no núcleo familiar",
            icon: Users,
          },
          {
            label: "Renda familiar",
            value: rendaFormatada,
            description:
              "Renda mensal informada",
            icon: Wallet,
          },
          {
            label: "Documentos",
            value: documentos.length,
            description:
              "Arquivos anexados",
            icon: FileText,
          },
          {
            label: "Última visita",
            value: ultimaVisitaRealizada
              ? formatarDataVisita(ultimaVisitaRealizada.data)
              : "Pendente",
            description:
              "Acompanhamento pastoral",
            icon: CalendarCheck,
          },
        ]}
      />

      {!familiaAtiva && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
          <p className="font-semibold">
            Esta família está inativa.
          </p>

          <p className="mt-1 text-sm">
            O histórico foi preservado, mas ela
            não será considerada nos indicadores
            de famílias ativas.
          </p>
        </div>
      )}

      {familia.beneficioBloqueado && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
          <p className="font-semibold">Benefício bloqueado</p>
          <p className="mt-1 text-sm">
            {familia.motivoBloqueio || "A família atingiu o limite de ausências consecutivas."}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSection
          title="Dados do responsável"
          description="Informações de identificação e contato."
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
                  {familia.email ||
                    "Não informado"}
                </dd>
              </div>
            </div>
          </dl>
        </ProfileSection>

        <ProfileSection
          title="Situação familiar"
          description="Dados gerais do núcleo familiar."
        >
          <dl className="space-y-5">
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
                  {familia.quantidadeMoradores ||
                    1}
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
        </ProfileSection>
      </div>

      <ProfileSection
        title="Endereço"
        description="Localização atual da família."
      >
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

        <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <MapPinned size={20} className="shrink-0 text-blue-700" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Área pastoral
            </p>
            <p className="font-medium text-slate-900">
              {areaPastoral?.nome ?? "Fora das áreas cadastradas"}
            </p>
          </div>
        </div>

        {typeof familia.latitude === "number" &&
        typeof familia.longitude === "number" ? (
          <div className="mt-5 space-y-3">
            <MapaOpenStreetMap
              latitude={familia.latitude}
              longitude={familia.longitude}
              referenceLatitude={paroquia?.latitude}
              referenceLongitude={paroquia?.longitude}
              radiusKm={paroquia?.raioAtendimentoKm}
            />
            {distanciaPastoralKm !== null && (
              <div
                className={`rounded-lg border p-4 text-sm ${
                  distanciaPastoralKm <= paroquia!.raioAtendimentoKm
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                <p className="font-semibold">
                  {distanciaPastoralKm <= paroquia!.raioAtendimentoKm
                    ? "Família dentro da área de atendimento"
                    : "Família fora da área de atendimento"}
                </p>
                <p className="mt-1">
                  Distância em linha reta: {distanciaPastoralKm.toFixed(1)} km. Raio configurado: {paroquia!.raioAtendimentoKm} km.
                </p>
              </div>
            )}
            <a
              href={`https://www.openstreetmap.org/?mlat=${familia.latitude}&mlon=${familia.longitude}#map=18/${familia.latitude}/${familia.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition hover:text-blue-900"
            >
              <ExternalLink size={17} aria-hidden="true" />
              Abrir no OpenStreetMap
            </a>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Edite a família e marque sua localização para exibir o mapa.
          </div>
        )}
      </ProfileSection>

      <ProfileSection
        title="Documentos"
        description="RG, CPF, comprovante de residência e outros arquivos."
      >
        <UploadDocumentos
          entidadeId={params.id}
          onConcluido={async () =>
            setDocumentos(await listarPorEntidade("FAMILIA", params.id))
          }
        />
        {documentos.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {documentos.map((documento) => (
              <li
                key={documento.id ?? documento.caminhoStorage}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <FileText size={19} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {documento.nomeOriginal}
                    </p>
                    <p className="text-sm text-slate-500">
                      {documento.tipo.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => abrirDocumento(documento)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  <Download size={17} aria-hidden="true" />
                  Abrir
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
            <FileText size={36} aria-hidden="true" className="mx-auto text-slate-300" />
            <p className="mt-4 font-medium text-slate-700">
              Nenhum documento anexado.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Os documentos da família aparecerão aqui quando o envio estiver habilitado.
            </p>
          </div>
        )}
      </ProfileSection>

      <ProfileSection
        title="Linha do tempo"
        description="Histórico de atendimentos e alterações."
      >
        <Timeline
          items={[
            ...visitas.map((visita) => ({
            title: visita.objetivo,
            description:
              visita.observacoes ||
              (visita.status === "AGENDADA"
                ? "Visita pastoral agendada."
                : visita.status === "REALIZADA"
                  ? "Visita pastoral concluída."
                  : "Visita pastoral cancelada."),
            date: `${formatarDataVisita(visita.data)} às ${visita.horario}`,
            metadata: `${visita.voluntarioNome || "Responsável a definir"} • ${visita.status.toLowerCase()}`,
            icon: CalendarCheck,
            })),
            ...entregas.map((entrega) => ({
              title: "Entrega de cesta básica",
              description: `${entrega.quantidade} cesta(s) entregue(s) à família.`,
              date: formatarDataVisita(entrega.data),
              metadata: "Benefício concedido",
              icon: PackageCheck,
            })),
          ]}
          emptyTitle="Nenhum atendimento registrado até o momento."
          emptyDescription="Futuramente serão exibidas aqui as visitas, entregas de cestas, encaminhamentos e demais ações realizadas com esta família."
          emptyIcon={CalendarCheck}
        />
      </ProfileSection>
    </div>
  );
}
