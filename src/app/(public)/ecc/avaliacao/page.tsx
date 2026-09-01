"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, HeartHandshake, Mail, Phone, ShieldCheck, Star } from "lucide-react";
import { maskTelefone } from "@/lib/formatters/masks";

const areas = ["Acolhida", "Círculos", "Cozinha", "Liturgia", "Secretaria", "Compras", "Limpeza", "Canto", "Coordenação"];
type Localizado = { casalId: string; casalNome: string; encontroNome: string; confirmacao: string; avaliacaoAtual: { avaliacao: number; testemunho: string; interesseTrabalhar: boolean; areasInteresse: string[] } | null };

export default function AvaliacaoPublicaEccPage() { return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-slate-100 text-slate-500">Abrindo avaliação...</main>}><AvaliacaoPublica /></Suspense>; }

function AvaliacaoPublica() {
  const params = useSearchParams(); const encontroId = params.get("encontro") ?? ""; const token = params.get("token") ?? "";
  const [contato, setContato] = useState(""); const [localizado, setLocalizado] = useState<Localizado | null>(null);
  const [avaliacao, setAvaliacao] = useState(0); const [testemunho, setTestemunho] = useState("");
  const [interesse, setInteresse] = useState(false); const [areasInteresse, setAreasInteresse] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false); const [erro, setErro] = useState(""); const [concluido, setConcluido] = useState(false);

  async function requisicao(body: Record<string, unknown>) {
    const resposta = await fetch("/api/ecc/avaliacao-publica", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ encontroId, token, contato, ...body }) });
    const dados = await resposta.json(); if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a avaliação."); return dados;
  }
  async function buscar(event: FormEvent) {
    event.preventDefault(); setCarregando(true); setErro("");
    try {
      const resposta = await requisicao({ acao: "buscar" }) as Localizado; setLocalizado(resposta);
      if (resposta.avaliacaoAtual) { setAvaliacao(resposta.avaliacaoAtual.avaliacao); setTestemunho(resposta.avaliacaoAtual.testemunho); setInteresse(resposta.avaliacaoAtual.interesseTrabalhar); setAreasInteresse(resposta.avaliacaoAtual.areasInteresse); }
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível localizar o casal."); }
    finally { setCarregando(false); }
  }
  async function enviar(event: FormEvent) {
    event.preventDefault(); if (!localizado) return; setCarregando(true); setErro("");
    try { await requisicao({ acao: "enviar", casalId: localizado.casalId, confirmacao: localizado.confirmacao, avaliacao, testemunho, interesseTrabalhar: interesse, areasInteresse }); setConcluido(true); }
    catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível enviar a avaliação."); }
    finally { setCarregando(false); }
  }
  function alterarContato(valor: string) { setContato(valor.includes("@") || /[a-z]/i.test(valor) ? valor : maskTelefone(valor)); }

  return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-violet-950 via-blue-900 to-blue-600 p-4 sm:p-6"><section className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"><header className="bg-slate-950 px-6 py-7 text-center text-white"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-600"><HeartHandshake size={30} /></span><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-violet-300">Encontro de Casais com Cristo</p><h1 className="mt-1 text-2xl font-black">Como foi essa experiência?</h1></header><div className="p-6 sm:p-8">
    {concluido ? <div className="py-6 text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-700"><BadgeCheck size={42} /></span><h2 className="mt-5 text-2xl font-black">Avaliação enviada!</h2><p className="mt-2 text-slate-600">Obrigado por compartilharem esse momento. A coordenação recebeu a resposta do casal.</p></div>
    : localizado ? <form onSubmit={enviar}><button type="button" onClick={() => { setLocalizado(null); setErro(""); }} className="inline-flex items-center gap-1 text-sm font-bold text-blue-700"><ArrowLeft size={16} />Corrigir contato</button><div className="mt-4 rounded-2xl bg-violet-50 p-4 text-center"><strong className="text-lg">{localizado.casalNome}</strong><p className="mt-1 text-sm text-slate-600">{localizado.encontroNome}</p></div>
      <fieldset className="mt-6 text-center"><legend className="mx-auto text-sm font-black text-slate-800">Avaliação geral do encontro</legend><div className="mt-3 flex justify-center gap-2">{[1,2,3,4,5].map((valor) => <button key={valor} type="button" onClick={() => setAvaliacao(valor)} aria-label={`${valor} estrelas`} className={`rounded-xl p-2 ${valor <= avaliacao ? "bg-amber-100 text-amber-500" : "bg-slate-100 text-slate-300"}`}><Star size={30} fill={valor <= avaliacao ? "currentColor" : "none"} /></button>)}</div><p className="mt-2 text-xs text-slate-500">{avaliacao ? `${avaliacao} de 5 estrelas` : "Toque nas estrelas para avaliar"}</p></fieldset>
      <label className="mt-6 grid gap-2 text-sm font-black text-slate-800">Testemunho ou comentário<textarea value={testemunho} onChange={(event) => setTestemunho(event.target.value)} maxLength={4000} placeholder="Contem como foi a experiência do casal..." className="min-h-32 rounded-xl border p-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
      <label className="mt-5 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-950"><input type="checkbox" className="mt-1" checked={interesse} onChange={(event) => { setInteresse(event.target.checked); if (!event.target.checked) setAreasInteresse([]); }} /><span>Gostaríamos de trabalhar em um próximo ECC<span className="mt-1 block text-xs font-normal">Isso demonstra interesse; a coordenação fará contato antes de qualquer cadastro.</span></span></label>
      {interesse && <fieldset className="mt-5"><legend className="text-sm font-black text-slate-800">Em quais áreas gostariam de ajudar?</legend><div className="mt-2 flex flex-wrap gap-2">{areas.map((area) => <label key={area} className={`cursor-pointer rounded-full border px-3 py-2 text-xs font-bold ${areasInteresse.includes(area) ? "border-blue-600 bg-blue-600 text-white" : "text-slate-600"}`}><input type="checkbox" className="sr-only" checked={areasInteresse.includes(area)} onChange={(event) => setAreasInteresse(event.target.checked ? [...areasInteresse, area] : areasInteresse.filter((item) => item !== area))} />{area}</label>)}</div></fieldset>}
      {erro && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{erro}</p>}<button disabled={carregando || avaliacao === 0} className="mt-6 w-full rounded-xl bg-violet-600 px-5 py-3.5 font-black text-white disabled:opacity-50">{carregando ? "Enviando..." : "Enviar avaliação do casal"}</button><p className="mt-3 text-center text-xs text-slate-500">A avaliação pode ser revisada usando novamente este mesmo link.</p>
    </form>
    : <form onSubmit={buscar}><div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900"><ShieldCheck className="mt-0.5 shrink-0" size={20} /><p><strong>Não é necessário entrar no sistema.</strong><br />Informe um contato usado na inscrição para localizar o casal.</p></div><label className="mt-6 grid gap-2 text-sm font-black text-slate-800">Telefone com DDD ou e-mail<div className="relative"><span className="absolute left-3 top-3 text-slate-400">{contato.includes("@") ? <Mail size={20} /> : <Phone size={20} />}</span><input required autoFocus value={contato} onChange={(event) => alterarContato(event.target.value)} placeholder="(00) 00000-0000 ou email@exemplo.com" className="w-full rounded-xl border py-3 pl-11 pr-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div></label>{erro && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{erro}</p>}<button disabled={carregando || !contato.trim()} className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-black text-white disabled:opacity-50">{carregando ? "Localizando casal..." : "Continuar"}</button></form>}
  </div></section></main>;
}
