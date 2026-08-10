"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Copy, Link as LinkIcon, Plus, ShieldCheck, XCircle } from "lucide-react";
import { roleLabels, Role } from "@/config/roles";
import { obterTokenAcesso } from "@/lib/auth/client-session";
import { Card } from "@/components/forms/Card";
import { PageHeader } from "@/components/ui/PageHeader";

type Convite = { id: string; perfil: Role; expires_at: string; used_at: string | null; revoked_at: string | null; created_at: string };
const perfis: Exclude<Role, "admin_plataforma">[] = ["admin_paroquia", "coordenador", "operador", "voluntario", "leitor", "atendente_secretaria", "tesoureiro"];

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await obterTokenAcesso();
  const resposta = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados as T;
}

function situacao(item: Convite) {
  if (item.used_at) return ["Utilizado", "bg-emerald-100 text-emerald-700"] as const;
  if (item.revoked_at) return ["Revogado", "bg-red-100 text-red-700"] as const;
  if (new Date(item.expires_at) <= new Date()) return ["Expirado", "bg-slate-200 text-slate-700"] as const;
  return ["Pendente", "bg-amber-100 text-amber-800"] as const;
}

export default function ConvitesUsuariosPage() {
  const [convites, setConvites] = useState<Convite[]>([]); const [role, setRole] = useState<Exclude<Role, "admin_plataforma">>("admin_paroquia"); const [validadeDias, setValidadeDias] = useState(7); const [link, setLink] = useState(""); const [salvando, setSalvando] = useState(false);
  const carregar = useCallback(async () => { try { setConvites(await requisicao<Convite[]>("/api/convites-usuarios")); } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível carregar os convites."); } }, []);
  useEffect(() => { void carregar(); }, [carregar]);
  async function gerar() { setSalvando(true); try { const resultado = await requisicao<{ link: string }>("/api/convites-usuarios", { method: "POST", body: JSON.stringify({ role, validadeDias }) }); setLink(resultado.link); toast.success("Convite criado. Copie o link e envie pelo WhatsApp."); await carregar(); } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível gerar o convite."); } finally { setSalvando(false); } }
  async function copiar() { try { await navigator.clipboard.writeText(link); toast.success("Link copiado."); } catch { toast.error("Não foi possível copiar o link."); } }
  async function revogar(id: string) { try { await requisicao(`/api/convites-usuarios/${id}`, { method: "PATCH" }); toast.success("Convite revogado."); await carregar(); } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível revogar o convite."); } }
  return <div className="space-y-6"><PageHeader title="Convites por link" description="Crie um acesso com a paróquia e o perfil já definidos. A pessoa preenche seus dados e cria a própria senha." actions={<Link href="/usuarios" className="inline-flex items-center gap-2 rounded-lg border px-4 py-3 font-semibold text-slate-700"><ArrowLeft size={18}/>Voltar aos usuários</Link>} /><Card title="Novo convite"><div className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end"><label className="text-sm font-semibold">Perfil de acesso<select value={role} onChange={(e)=>setRole(e.target.value as Exclude<Role,"admin_plataforma">)} className="mt-2 w-full rounded-lg border bg-white px-4 py-3 font-normal">{perfis.map((item)=><option key={item} value={item}>{roleLabels[item]}</option>)}</select></label><label className="text-sm font-semibold">Validade<select value={validadeDias} onChange={(e)=>setValidadeDias(Number(e.target.value))} className="mt-2 w-full rounded-lg border bg-white px-4 py-3 font-normal"><option value={1}>1 dia</option><option value={7}>7 dias</option><option value={14}>14 dias</option><option value={30}>30 dias</option></select></label><button type="button" onClick={()=>void gerar()} disabled={salvando} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 font-semibold text-white disabled:opacity-60"><Plus size={18}/>{salvando?"Gerando...":"Gerar convite"}</button></div><div className="mt-5 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950"><ShieldCheck className="shrink-0" size={20}/><p>O convite pertence à paróquia selecionada no ambiente atual. O perfil é definido agora e não poderá ser alterado por quem receber o link.</p></div>{link && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><LinkIcon size={18}/>Link pronto para enviar</p><div className="mt-3 flex flex-col gap-3 sm:flex-row"><input readOnly value={link} className="w-full rounded-lg border bg-white px-4 py-3 text-sm"/><button type="button" onClick={()=>void copiar()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-3 font-semibold text-emerald-700"><Copy size={17}/>Copiar link</button></div></div>}</Card><Card title="Convites gerados"><div className="space-y-3">{convites.length === 0 ? <p className="text-sm text-slate-500">Nenhum convite foi gerado para esta paróquia.</p> : convites.map((item)=>{const [texto,cor]=situacao(item); return <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"><div><p className="font-semibold text-slate-900">{roleLabels[item.perfil]}</p><p className="mt-1 text-sm text-slate-500">Criado em {new Date(item.created_at).toLocaleDateString("pt-BR")} · válido até {new Date(item.expires_at).toLocaleDateString("pt-BR")}</p><span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${cor}`}>{texto}</span></div>{texto === "Pendente" && <button type="button" onClick={()=>void revogar(item.id)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"><XCircle size={17}/>Revogar</button>}</article>;})}</div></Card></div>;
}
