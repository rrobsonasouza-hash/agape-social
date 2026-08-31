"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, HeartHandshake, Mail, Phone, ShieldCheck } from "lucide-react";
import { maskTelefone } from "@/lib/formatters/masks";

type Localizado = { casalId: string; casalNome: string; encontroNome: string; confirmacao: string };

export default function CheckinPublicoEccPage() { return <Suspense fallback={<Carregando />}><CheckinPublico /></Suspense>; }
function Carregando() { return <main className="grid min-h-screen place-items-center bg-slate-100 p-5 text-slate-500">Abrindo check-in...</main>; }

function CheckinPublico() {
  const params = useSearchParams(); const encontroId = params.get("encontro") ?? ""; const token = params.get("token") ?? "";
  const [contato, setContato] = useState(""); const [localizado, setLocalizado] = useState<Localizado | null>(null);
  const [carregando, setCarregando] = useState(false); const [erro, setErro] = useState(""); const [concluido, setConcluido] = useState(false); const [mensagem, setMensagem] = useState("");

  async function requisicao(body: Record<string, unknown>) {
    const resposta = await fetch("/api/ecc/checkin-publico", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ encontroId, token, contato, ...body }) });
    const dados = await resposta.json(); if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir o check-in."); return dados;
  }
  async function buscar(event: FormEvent) {
    event.preventDefault(); setCarregando(true); setErro("");
    try { setLocalizado(await requisicao({ acao: "buscar" }) as Localizado); }
    catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível localizar a inscrição."); }
    finally { setCarregando(false); }
  }
  async function confirmar() {
    if (!localizado) return; setCarregando(true); setErro("");
    try { const resposta = await requisicao({ acao: "confirmar", casalId: localizado.casalId, confirmacao: localizado.confirmacao }); setMensagem(String(resposta.mensagem ?? "Chegada confirmada.")); setConcluido(true); }
    catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível confirmar a chegada."); }
    finally { setCarregando(false); }
  }
  function alterarContato(valor: string) { setContato(valor.includes("@") || /[a-z]/i.test(valor) ? valor : maskTelefone(valor)); }

  return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-4 sm:p-6"><section className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"><header className="bg-slate-950 px-6 py-7 text-center text-white"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-600"><HeartHandshake size={30} /></span><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-blue-300">Encontro de Casais com Cristo</p><h1 className="mt-1 text-2xl font-black">Confirme sua chegada</h1></header><div className="p-6 sm:p-8">{concluido ? <div className="py-5 text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-700"><BadgeCheck size={42} /></span><h2 className="mt-5 text-2xl font-black text-slate-950">Check-in realizado!</h2><p className="mt-2 text-slate-600">{mensagem}</p><div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">Dirijam-se à recepção para retirar o material e receber as orientações do encontro.</div></div> : localizado ? <div><button type="button" onClick={() => { setLocalizado(null); setErro(""); }} className="inline-flex items-center gap-1 text-sm font-bold text-blue-700"><ArrowLeft size={16} />Corrigir contato</button><div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center"><p className="text-xs font-black uppercase tracking-wider text-blue-700">Inscrição localizada</p><h2 className="mt-2 text-xl font-black text-slate-950">{localizado.casalNome}</h2><p className="mt-1 text-sm text-slate-600">{localizado.encontroNome}</p></div><p className="mt-5 text-center text-sm text-slate-600">Os nomes estão corretos?</p>{erro && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{erro}</p>}<button type="button" disabled={carregando} onClick={() => void confirmar()} className="mt-4 w-full rounded-xl bg-emerald-600 px-5 py-3.5 font-black text-white disabled:opacity-50">{carregando ? "Confirmando..." : "Sim, somos nós — registrar chegada"}</button></div> : <form onSubmit={buscar}><div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900"><ShieldCheck className="mt-0.5 shrink-0" size={20} /><p><strong>Não é necessário entrar no sistema.</strong><br />Informe um dos contatos usados na inscrição.</p></div><label className="mt-6 grid gap-2 text-sm font-black text-slate-800">Telefone com DDD ou e-mail<div className="relative"><span className="absolute left-3 top-3 text-slate-400">{contato.includes("@") ? <Mail size={20} /> : <Phone size={20} />}</span><input required autoFocus inputMode={contato.includes("@") ? "email" : "text"} autoComplete="email tel" value={contato} onChange={(event) => alterarContato(event.target.value)} placeholder="(00) 00000-0000 ou email@exemplo.com" className="w-full rounded-xl border py-3 pl-11 pr-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div></label><p className="mt-2 text-xs text-slate-500">Se os dois cônjuges utilizarem contatos diferentes, informe aquele registrado no cadastro do casal.</p>{erro && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{erro}</p>}<button disabled={carregando || !contato.trim()} className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-black text-white disabled:opacity-50">{carregando ? "Localizando inscrição..." : "Continuar"}</button></form>}</div></section></main>;
}
