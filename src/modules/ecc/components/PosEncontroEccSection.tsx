"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Copy, Download, ExternalLink, HeartHandshake, MessageSquareHeart, QrCode, Star, UserPlus, Users } from "lucide-react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { useEcc } from "../hooks/useEcc";
import type { EccPosEncontroFormData } from "../schemas/ecc.schema";
import type { EccCasal, EccParticipacao, EccPosEncontro } from "../types/ecc.types";

const areas = ["Acolhida", "Círculos", "Cozinha", "Liturgia", "Secretaria", "Compras", "Limpeza", "Canto", "Coordenação"];
const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const statusLabel = {
  PENDENTE: "Pendente", RESPONDIDO: "Respondido", EM_ACOMPANHAMENTO: "Em acompanhamento",
  ENCAMINHADO_VOLUNTARIADO: "Encaminhado ao Voluntariado", CONCLUIDO: "Concluído",
};

type Props = {
  encontroId: string;
  participacoes: EccParticipacao[];
  casais: EccCasal[];
  registros: EccPosEncontro[];
  onSaved: () => Promise<void>;
  onCadastrarVoluntario: (casalId: string, posicao: "UM" | "DOIS") => void;
};

function formInicial(encontroId: string, casalId: string, registro?: EccPosEncontro): EccPosEncontroFormData {
  return {
    encontroId, casalId, avaliacao: registro?.avaliacao ?? null, testemunho: registro?.testemunho ?? "",
    acompanhamentoNecessario: registro?.acompanhamentoNecessario ?? false,
    acompanhamentoObservacoes: registro?.acompanhamentoObservacoes ?? "",
    interesseTrabalhar: registro?.interesseTrabalhar ?? false, areasInteresse: registro?.areasInteresse ?? [],
    status: registro?.status ?? "PENDENTE",
  };
}

export function PosEncontroEccSection({ encontroId, participacoes, casais, registros, onSaved, onCadastrarVoluntario }: Props) {
  const { salvarPosEncontro, obterTokenCheckin } = useEcc();
  const [casalAberto, setCasalAberto] = useState("");
  const [form, setForm] = useState<EccPosEncontroFormData | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [linkPublico, setLinkPublico] = useState(""); const [qrPublico, setQrPublico] = useState("");
  const participantes = useMemo(() => participacoes.filter((item) =>
    ["INDICADO", "ENCONTRISTA", "CONVIDADO", "VISITANTE"].includes(item.classificacao) && item.situacao !== "DESISTENTE"), [participacoes]);
  const porCasal = useMemo(() => new Map(registros.filter((item) => item.encontroId === encontroId).map((item) => [item.casalId, item])), [encontroId, registros]);
  const respondidos = participantes.filter((item) => porCasal.has(item.casalId)).length;
  const acompanhamentos = [...porCasal.values()].filter((item) => item.acompanhamentoNecessario && item.status !== "CONCLUIDO").length;
  const interessados = [...porCasal.values()].filter((item) => item.interesseTrabalhar).length;
  const avaliacoes = [...porCasal.values()].flatMap((item) => item.avaliacao === null ? [] : [item.avaliacao]);
  const media = avaliacoes.length ? avaliacoes.reduce((total, valor) => total + valor, 0) / avaliacoes.length : 0;

  useEffect(() => {
    let ativo = true;
    void obterTokenCheckin(encontroId).then(({ token }) => {
      if (!ativo) return;
      const url = `${window.location.origin}/ecc/avaliacao?encontro=${encodeURIComponent(encontroId)}&token=${encodeURIComponent(token)}`;
      setLinkPublico(url);
      return QRCode.toDataURL(url, { width: 640, margin: 3, errorCorrectionLevel: "H", color: { dark: "#4c1d95", light: "#ffffff" } });
    }).then((imagem) => { if (ativo && imagem) setQrPublico(imagem); }).catch((error) => toast.error(error instanceof Error ? error.message : "Não foi possível gerar o QR da avaliação."));
    return () => { ativo = false; };
  }, [encontroId, obterTokenCheckin]);

  async function copiarLink() { await navigator.clipboard.writeText(linkPublico); toast.success("Link da avaliação copiado."); }
  function baixarQr() { const ancora = document.createElement("a"); ancora.href = qrPublico; ancora.download = "avaliacao-pos-encontro-ecc.png"; ancora.click(); }

  function abrir(casalId: string) {
    setCasalAberto(casalId);
    setForm(formInicial(encontroId, casalId, porCasal.get(casalId)));
  }

  async function salvar(proximoStatus?: EccPosEncontroFormData["status"]) {
    if (!form) return;
    setSalvando(true);
    try {
      const status = proximoStatus ?? (form.acompanhamentoNecessario ? "EM_ACOMPANHAMENTO" : "RESPONDIDO");
      await salvarPosEncontro({ ...form, status });
      toast.success(status === "ENCAMINHADO_VOLUNTARIADO" ? "Casal encaminhado ao Voluntariado." : "Pós-encontro atualizado.");
      await onSaved();
      setForm((atual) => atual ? { ...atual, status } : atual);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar o pós-encontro."); }
    finally { setSalvando(false); }
  }

  async function encaminhar(registro: EccPosEncontro) {
    setSalvando(true);
    try {
      await salvarPosEncontro({ ...formInicial(encontroId, registro.casalId, registro), status: "ENCAMINHADO_VOLUNTARIADO" });
      toast.success("Casal encaminhado ao Voluntariado.");
      await onSaved();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível encaminhar o casal."); }
    finally { setSalvando(false); }
  }

  return <div className="space-y-5">
    <section className="rounded-2xl border bg-gradient-to-br from-violet-950 to-blue-700 p-6 text-white shadow-sm">
      <p className="text-xs font-black uppercase tracking-[.18em] text-blue-100">Continuidade pastoral</p>
      <h2 className="mt-2 text-2xl font-black">Pós-encontro</h2>
      <p className="mt-2 max-w-3xl text-sm text-blue-100">Registre o retorno dos encontristas, organize acompanhamentos e encaminhe ao Voluntariado quem deseja trabalhar nos próximos encontros.</p>
    </section>

    <section className="grid gap-4 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_180px]">
      <div><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-700"><QrCode size={23} /></span><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Resposta sem login</p><h3 className="text-xl font-black">QR Code de avaliação dos casais</h3></div></div><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Compartilhe este QR ao final do encontro. O casal informa telefone ou e-mail, confere os nomes e envia sua própria avaliação. Dados de acompanhamento pastoral continuam exclusivos da coordenação.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={!linkPublico} onClick={() => void copiarLink()} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"><Copy size={16} />Copiar link</button><a href={linkPublico || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black text-slate-700"><ExternalLink size={16} />Abrir formulário</a><button type="button" disabled={!qrPublico} onClick={baixarQr} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black text-violet-700 disabled:opacity-50"><Download size={16} />Baixar QR</button></div></div>
      <div className="grid place-items-center">{qrPublico ? <Image src={qrPublico} alt="QR Code da avaliação pós-encontro" width={640} height={640} unoptimized className="w-full max-w-40 rounded-xl" /> : <span className="text-sm text-slate-500">Gerando QR...</span>}</div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {([
        [MessageSquareHeart, "Respostas", `${respondidos}/${participantes.length}`],
        [Star, "Avaliação média", media ? `${media.toFixed(1)}/5` : "—"],
        [HeartHandshake, "Acompanhamentos", String(acompanhamentos)],
        [UserPlus, "Interessados em servir", String(interessados)],
      ] as const).map(([Icon, titulo, valor]) => <article key={titulo} className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Icon size={20} /></span><div><p className="text-xs font-black uppercase text-slate-500">{titulo}</p><strong className="text-2xl">{valor}</strong></div></div></article>)}
    </section>

    {interessados > 0 && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
      <h3 className="flex items-center gap-2 font-black text-amber-950"><Users size={19} />Fila de novos voluntários em potencial</h3>
      <p className="mt-1 text-sm text-amber-800">O interesse não transforma automaticamente o casal em voluntário. A coordenação confere os dados e conclui o vínculo.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{[...porCasal.values()].filter((item) => item.interesseTrabalhar).map((item) => {
        const casal = casais.find((registro) => registro.id === item.casalId);
        const vinculados = [casal?.voluntarioUmId, casal?.voluntarioDoisId].filter(Boolean).length;
        return <article key={item.id} className="rounded-xl bg-white p-4"><strong>{item.casalNome}</strong><p className="mt-1 text-xs text-amber-800">{item.areasInteresse.join(" · ") || "Área ainda não definida"}</p><p className="mt-2 text-xs font-bold text-slate-500">{vinculados === 2 ? "Casal já vinculado ao Voluntariado" : vinculados === 1 ? "1 cônjuge ainda precisa ser vinculado" : "Os 2 cônjuges precisam ser cadastrados"}</p><div className="mt-3 flex flex-wrap gap-2">{casal && !casal.voluntarioUmId && <button type="button" onClick={() => onCadastrarVoluntario(casal.id, "UM")} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-black text-amber-900">Cadastrar {casal.conjugeUmNome}</button>}{casal && !casal.voluntarioDoisId && <button type="button" onClick={() => onCadastrarVoluntario(casal.id, "DOIS")} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-black text-amber-900">Cadastrar {casal.conjugeDoisNome}</button>}{item.status !== "ENCAMINHADO_VOLUNTARIADO" && <button type="button" disabled={salvando} onClick={() => void encaminhar(item)} className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-black text-white">Marcar encaminhado</button>}<Link href="/voluntarios" className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-black text-amber-900">Ver Voluntariado</Link></div></article>;
      })}</div>
    </section>}

    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="text-xl font-black">Casais encontristas</h3><p className="mt-1 text-sm text-slate-500">Abra a ficha para registrar ou revisar o acompanhamento desta edição.</p>
      <div className="mt-4 space-y-3">{participantes.map((item) => {
        const registro = porCasal.get(item.casalId);
        return <article key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{item.casalNome}</strong><p className="mt-1 text-xs text-slate-500">{registro ? `${statusLabel[registro.status]}${registro.avaliacao ? ` · ${registro.avaliacao}/5 estrelas` : ""}` : "Aguardando retorno"}</p></div><button type="button" onClick={() => casalAberto === item.casalId ? setCasalAberto("") : abrir(item.casalId)} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-black text-blue-700">{casalAberto === item.casalId ? "Fechar" : registro ? "Editar ficha" : "Registrar retorno"}</button></div>
          {casalAberto === item.casalId && form && <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold text-slate-700">Avaliação do encontro<select className={campo} value={form.avaliacao ?? ""} onChange={(event) => setForm({ ...form, avaliacao: event.target.value ? Number(event.target.value) : null })}><option value="">Não informada</option>{[1,2,3,4,5].map((valor) => <option key={valor} value={valor}>{valor} estrela{valor > 1 ? "s" : ""}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-bold text-slate-700">Situação<select className={campo} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as EccPosEncontroFormData["status"] })}>{Object.entries(statusLabel).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-bold text-slate-700 md:col-span-2">Testemunho ou avaliação<textarea className={`${campo} min-h-28`} value={form.testemunho} onChange={(event) => setForm({ ...form, testemunho: event.target.value })} placeholder="O que o casal viveu, pontos fortes e sugestões..." /></label>
            <label className="flex items-start gap-3 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-900"><input type="checkbox" className="mt-1" checked={form.acompanhamentoNecessario} onChange={(event) => setForm({ ...form, acompanhamentoNecessario: event.target.checked })} /><span>Necessita acompanhamento pastoral<span className="mt-1 block text-xs font-normal">Sinaliza o casal para contato e cuidado da coordenação.</span></span></label>
            <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-900"><input type="checkbox" className="mt-1" checked={form.interesseTrabalhar} onChange={(event) => setForm({ ...form, interesseTrabalhar: event.target.checked, areasInteresse: event.target.checked ? form.areasInteresse : [] })} /><span>Tem interesse em trabalhar no próximo ECC<span className="mt-1 block text-xs font-normal">Entrará na fila de encaminhamento ao Voluntariado.</span></span></label>
            {form.acompanhamentoNecessario && <label className="grid gap-1 text-sm font-bold text-slate-700 md:col-span-2">Acompanhamento necessário<textarea required className={`${campo} min-h-24`} value={form.acompanhamentoObservacoes} onChange={(event) => setForm({ ...form, acompanhamentoObservacoes: event.target.value })} placeholder="Descreva o cuidado, responsável e próximo contato..." /></label>}
            {form.interesseTrabalhar && <fieldset className="md:col-span-2"><legend className="text-sm font-bold text-slate-700">Áreas de interesse</legend><div className="mt-2 flex flex-wrap gap-2">{areas.map((area) => <label key={area} className={`cursor-pointer rounded-full border px-3 py-2 text-xs font-bold ${form.areasInteresse.includes(area) ? "border-blue-600 bg-blue-600 text-white" : "bg-white text-slate-600"}`}><input type="checkbox" className="sr-only" checked={form.areasInteresse.includes(area)} onChange={(event) => setForm({ ...form, areasInteresse: event.target.checked ? [...form.areasInteresse, area] : form.areasInteresse.filter((itemArea) => itemArea !== area) })} />{area}</label>)}</div></fieldset>}
            <div className="flex flex-wrap gap-2 md:col-span-2"><button type="button" disabled={salvando} onClick={() => void salvar()} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{salvando ? "Salvando..." : "Salvar pós-encontro"}</button>{form.status !== "CONCLUIDO" && <button type="button" disabled={salvando} onClick={() => void salvar("CONCLUIDO")} className="rounded-xl border border-emerald-300 px-5 py-3 text-sm font-black text-emerald-700">Concluir acompanhamento</button>}</div>
          </div>}
        </article>;
      })}{!participantes.length && <p className="py-10 text-center text-sm text-slate-500">Nenhum casal participante nesta edição.</p>}</div>
    </section>
  </div>;
}
