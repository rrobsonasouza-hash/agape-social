"use client";

import { BadgeCheck, Clock3, MessageCircle, Send, Users } from "lucide-react";
import type { EccCasal, EccParticipacao, EccParticipacaoSituacao } from "../types/ecc.types";

const status: Record<EccParticipacaoSituacao, string> = {
  CONVIDADO: "Convite enviado", INSCRITO: "Aceitou / inscrito", CONFIRMADO: "Participação confirmada",
  LISTA_ESPERA: "Lista de espera", DESISTENTE: "Recusou / desistiu", PARTICIPOU: "Participação concluída",
};
const papeisParticipantes = ["INDICADO", "ENCONTRISTA", "CONVIDADO", "VISITANTE"];

function dataHora(valor: string) {
  return valor ? new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "";
}

function whatsapp(telefone: string, casal: string, encontro: string) {
  const numero = telefone.replace(/\D/g, "");
  if (!numero) return "";
  const destino = numero.startsWith("55") ? numero : `55${numero}`;
  const mensagem = encodeURIComponent(`Olá, ${casal}! Gostaríamos de conversar sobre o convite para o ${encontro}.`);
  return `https://wa.me/${destino}?text=${mensagem}`;
}

export function ConvitesEccSection({ participacoes, casais, capacidade, encontroNome, busca = "", salvando, onSituacao, onConvite }: {
  participacoes: EccParticipacao[];
  casais: EccCasal[];
  capacidade: number;
  encontroNome: string;
  busca?: string;
  salvando: string;
  onSituacao: (item: EccParticipacao, situacao: EccParticipacaoSituacao) => void;
  onConvite: (item: EccParticipacao) => void;
}) {
  const participantes = participacoes.filter((item) => papeisParticipantes.includes(item.classificacao));
  const confirmados = participantes.filter((item) => ["CONFIRMADO", "PARTICIPOU"].includes(item.situacao)).length;
  const espera = participantes.filter((item) => item.situacao === "LISTA_ESPERA").length;
  const convitesPendentes = participantes.filter((item) => !item.conviteEnviadoEm).length;
  const restantes = capacidade > 0 ? Math.max(capacidade - confirmados, 0) : null;

  return <div className="mt-4 space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Indicador icon={Users} titulo="Vagas" valor={capacidade > 0 ? `${confirmados}/${capacidade}` : `${confirmados}`} apoio={capacidade > 0 ? `${restantes} disponível(is)` : "Sem limite definido"} />
      <Indicador icon={Send} titulo="A convidar" valor={`${convitesPendentes}`} apoio="Convite ainda não registrado" />
      <Indicador icon={BadgeCheck} titulo="Confirmados" valor={`${confirmados}`} apoio="Casais participantes" />
      <Indicador icon={Clock3} titulo="Espera" valor={`${espera}`} apoio="Aguardando liberação de vaga" />
    </div>

    <div className="grid gap-3">
      {participacoes.filter((item) => item.casalNome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))).map((item) => {
        const casal = casais.find((registro) => registro.id === item.casalId);
        const linkWhatsapp = whatsapp(casal?.telefone ?? "", item.casalNome, encontroNome);
        const servico = !papeisParticipantes.includes(item.classificacao);
        return <article key={item.id} className={`rounded-xl border p-4 ${servico ? "bg-amber-50/60" : "bg-slate-50"}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <strong>{item.casalNome}</strong>
              <p className="mt-1 text-xs text-slate-500">Incluído em {new Date(item.inscritoEm).toLocaleDateString("pt-BR")} · {servico ? "trabalha no encontro e não ocupa vaga" : "casal participante"}</p>
            </div>
            <select disabled={salvando === `participacao-${item.id}`} className="rounded-xl border bg-white px-3 py-2 text-sm font-bold" value={item.situacao} onChange={(event) => onSituacao(item, event.target.value as EccParticipacaoSituacao)}>
              {Object.entries(status).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {linkWhatsapp && <a href={linkWhatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 font-bold text-emerald-700"><MessageCircle size={15} />Abrir WhatsApp</a>}
            {!item.conviteEnviadoEm ? <button type="button" disabled={salvando === `convite-${item.id}`} onClick={() => onConvite(item)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 font-bold text-white disabled:opacity-50"><Send size={15} />Marcar convite enviado</button> : <span className="rounded-lg bg-blue-100 px-3 py-2 font-semibold text-blue-800">Convite: {dataHora(item.conviteEnviadoEm)}</span>}
            {item.respostaEm && <span className="rounded-lg bg-white px-3 py-2 text-slate-600">Resposta: {dataHora(item.respostaEm)}</span>}
            {item.confirmadoEm && <span className="rounded-lg bg-emerald-100 px-3 py-2 font-semibold text-emerald-800">Confirmado: {dataHora(item.confirmadoEm)}</span>}
          </div>
        </article>;
      })}
      {!participacoes.length && <p className="py-10 text-center text-slate-500">Nenhum casal incluído nesta edição.</p>}
    </div>
  </div>;
}

function Indicador({ icon: Icon, titulo, valor, apoio }: { icon: typeof Users; titulo: string; valor: string; apoio: string }) {
  return <div className="rounded-xl border bg-white p-3"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500"><Icon size={15} />{titulo}</div><strong className="mt-1 block text-2xl text-slate-900">{valor}</strong><span className="text-xs text-slate-500">{apoio}</span></div>;
}
