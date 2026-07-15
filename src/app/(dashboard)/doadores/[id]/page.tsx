"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, CalendarClock, Gift, Pencil, Power, RotateCcw, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/forms/Button";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileMetrics } from "@/components/profile/ProfileMetrics";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { Timeline } from "@/components/profile/Timeline";
import { useDoadores } from "@/modules/doadores/hooks/useDoadores";
import { DoadorDocumento } from "@/modules/doadores/types/doador-documento";
import { useCestas } from "@/modules/cestas/hooks/useCestas";
import { MovimentacaoCestas } from "@/modules/cestas/types/cestas.types";

const frequencias = { PONTUAL: "Pontual", EVENTUAL: "Eventual", MENSAL: "Mensal" };

export default function DetalhesDoadorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { buscarPorId, alterarStatus } = useDoadores();
  const { listarMovimentacoes } = useCestas();
  const [doador, setDoador] = useState<DoadorDocumento | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [doacoes, setDoacoes] = useState<MovimentacaoCestas[]>([]);

  useEffect(() => {
    buscarPorId(params.id).then((dados) => {
      if (!dados) { toast.error("Doador não encontrado."); router.push("/doadores"); return; }
      setDoador(dados);
    }).catch(() => toast.error("Não foi possível carregar o doador.")).finally(() => setCarregando(false));
  }, [buscarPorId, params.id, router]);

  useEffect(() => {
    listarMovimentacoes()
      .then((movimentos) =>
        setDoacoes(
          movimentos
            .filter((movimento) => movimento.doadorId === params.id)
            .sort((a, b) => b.data.localeCompare(a.data))
        )
      )
      .catch(() => setDoacoes([]));
  }, [listarMovimentacoes, params.id]);

  async function alternar() {
    if (!doador) return;
    const status = doador.status === "ATIVO" ? "INATIVO" : "ATIVO";
    try { await alterarStatus(doador.id, status); setDoador({ ...doador, status }); toast.success("Status atualizado!"); }
    catch { toast.error("Não foi possível alterar o status."); }
  }

  if (carregando) return <div className="py-16 text-center text-slate-500">Carregando doador...</div>;
  if (!doador) return null;

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => router.push("/doadores")} className="inline-flex items-center gap-2 text-sm font-medium text-blue-700"><ArrowLeft size={18} /> Voltar para doadores</button>
      <ProfileHeader
        title={doador.nome}
        subtitle={doador.tipoPessoa === "FISICA" ? "Pessoa física" : "Pessoa jurídica"}
        status={doador.status}
        phone={doador.telefone}
        email={doador.email || undefined}
        actions={<><Button onClick={() => router.push(`/doadores/${doador.id}/editar`)} className="flex items-center gap-2"><Pencil size={18} /> Editar</Button><Button onClick={alternar} className={`flex items-center gap-2 ${doador.status === "ATIVO" ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"}`}>{doador.status === "ATIVO" ? <Power size={18} /> : <RotateCcw size={18} />}{doador.status === "ATIVO" ? "Inativar" : "Reativar"}</Button></>}
      />
      <ProfileMetrics items={[
        { label: "Perfil", value: doador.tipoPessoa === "FISICA" ? "Pessoa física" : "Organização", icon: doador.tipoPessoa === "FISICA" ? UserRound : Building2 },
        { label: "Frequência", value: frequencias[doador.frequencia], icon: CalendarClock },
        { label: "Interesse", value: doador.interesseDoacao, icon: Gift },
        { label: "Doações", value: doacoes.length, icon: Gift },
      ]} />
      <ProfileSection title="Dados do relacionamento" description="Identificação e preferências do doador.">
        <dl className="grid gap-5 md:grid-cols-2"><div><dt className="text-sm text-slate-500">CPF ou CNPJ</dt><dd className="font-medium text-slate-900">{doador.documento}</dd></div><div><dt className="text-sm text-slate-500">Frequência</dt><dd className="font-medium text-slate-900">{frequencias[doador.frequencia]}</dd></div><div className="md:col-span-2"><dt className="text-sm text-slate-500">Observações</dt><dd className="mt-1 whitespace-pre-line text-slate-700">{doador.observacoes || "Nenhuma observação registrada."}</dd></div></dl>
      </ProfileSection>
      <ProfileSection title="Histórico de doações" description="Contribuições e campanhas apoiadas.">
        <Timeline
          items={doacoes.map((doacao) => ({
            title: doacao.tipo === "CESTA_PRONTA" ? "Doação de cestas prontas" : `Doação de ${doacao.itemNome}`,
            description: `${doacao.quantidade} ${doacao.tipo === "CESTA_PRONTA" ? "cesta(s)" : doacao.unidade}`,
            date: doacao.data.split("-").reverse().join("/"),
            metadata: doacao.valorTotal ? doacao.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : undefined,
            icon: Gift,
          }))}
          emptyTitle="Nenhuma doação registrada até o momento."
          emptyDescription="As contribuições vinculadas a este doador aparecerão aqui."
        />
      </ProfileSection>
    </div>
  );
}
