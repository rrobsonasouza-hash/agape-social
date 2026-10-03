"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, BookOpen, Building2, CalendarClock, CalendarDays, CalendarRange,
  ClipboardList, Files, Gift, HandCoins, Landmark, LayoutDashboard, ListChecks,
  ListTree, LogOut, Menu, Settings, ShieldCheck, ShoppingCart, Wallet, X,
} from "lucide-react";
import { sair } from "@/lib/auth/client-session";
import { useAuth } from "@/modules/auth/hooks/useAuth";

type ItemMenu = { nome: string; href: string; icone: typeof LayoutDashboard };
type GrupoMenu = { titulo: string; itens: ItemMenu[] };

const operacaoAdmin: GrupoMenu[] = [
  { titulo: "Visão geral", itens: [
    { nome: "Painel Pastoral", href: "/dashboard", icone: LayoutDashboard },
  ] },
  { titulo: "Secretaria", itens: [
    { nome: "Loja", href: "/secretaria?aba=BALCAO", icone: ShoppingCart },
    { nome: "Caixa", href: "/secretaria?aba=CAIXA", icone: Wallet },
  ] },
  { titulo: "Cestas e distribuição", itens: [
    { nome: "Cestas", href: "/cestas", icone: Gift },
    { nome: "Distribuição", href: "/cestas/distribuicao", icone: ListChecks },
  ] },
  { titulo: "Financeiro", itens: [
    { nome: "Tesouraria", href: "/tesouraria", icone: Landmark },
  ] },
];

const gestaoAdmin: ItemMenu[] = [
  { nome: "Dízimos", href: "/secretaria/dizimos", icone: HandCoins },
  { nome: "Relatórios de dízimos", href: "/secretaria/dizimos/relatorios", icone: BarChart3 },
  { nome: "Agenda paroquial", href: "/secretaria/agenda", icone: CalendarRange },
  { nome: "Sacramentos", href: "/secretaria/sacramentos", icone: BookOpen },
  { nome: "Solicitações", href: "/secretaria/solicitacoes", icone: ClipboardList },
  { nome: "Documentos", href: "/secretaria/documentos", icone: Files },
  { nome: "Pauta de intenções", href: "/secretaria/intencoes", icone: CalendarDays },
  { nome: "Agenda de celebrações", href: "/secretaria/celebracoes", icone: CalendarClock },
  { nome: "Serviços da Secretaria", href: "/secretaria/servicos", icone: ListTree },
  { nome: "Administração", href: "/administracao", icone: Settings },
  { nome: "Usuários", href: "/usuarios", icone: ShieldCheck },
];

export function ModuleHeader({ titulo, cor = "blue" }: { titulo: string; cor?: "blue" | "emerald" }) {
  const { usuario } = useAuth();
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const admin = usuario?.role === "admin_plataforma" || usuario?.role === "admin_paroquia";

  const grupos: GrupoMenu[] = admin ? operacaoAdmin : usuario?.role === "atendente_secretaria" ? [
    { titulo: "Secretaria", itens: [
      { nome: "Loja", href: "/secretaria?aba=BALCAO", icone: ShoppingCart },
      { nome: "Caixa", href: "/secretaria?aba=CAIXA", icone: Wallet },
    ] },
  ] : [
    { titulo: "Financeiro", itens: [
      { nome: "Tesouraria", href: "/tesouraria", icone: Landmark },
    ] },
  ];

  function ativo(href: string) {
    const [rota, consulta] = href.split("?");
    if (pathname !== rota && !pathname.startsWith(`${rota}/`)) return false;
    if (!consulta) return true;
    const abaAtual = searchParams.get("aba");
    const abaEsperada = new URLSearchParams(consulta).get("aba");
    return pathname === rota && (abaAtual === abaEsperada || (!abaAtual && abaEsperada === "BALCAO"));
  }

  function item(itemMenu: ItemMenu) {
    const Icon = itemMenu.icone;
    return <Link key={itemMenu.href} href={itemMenu.href} onClick={() => setAberto(false)} className={`flex min-h-13 items-center gap-3 rounded-xl px-4 py-3 font-semibold ${ativo(itemMenu.href) ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}><Icon size={20}/>{itemMenu.nome}</Link>;
  }

  async function encerrar() { await sair(); router.replace("/login"); }

  return <>
    <header className="sticky top-0 z-40 border-b bg-white px-4 py-3 shadow-sm"><div className="mx-auto flex max-w-7xl items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => setAberto(true)} aria-label="Abrir menu" className="rounded-xl border p-3 text-slate-700"><Menu size={22}/></button><div><p className={`text-xs font-bold uppercase tracking-wide ${cor === "emerald" ? "text-emerald-600" : "text-blue-600"}`}>Ágape</p><h1 className="text-lg font-black text-slate-900">{titulo}</h1></div></div>{admin && <Link href="/dashboard" className="hidden items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 sm:flex"><Building2 size={18}/>Painel</Link>}</div></header>
    {aberto && <div className="fixed inset-0 z-50"><button aria-label="Fechar menu" onClick={() => setAberto(false)} className="absolute inset-0 bg-slate-950/45"/><aside className="relative flex h-full w-[85%] max-w-xs flex-col bg-white p-4 shadow-2xl"><div className="flex items-center justify-between border-b pb-4"><div><p className="font-black text-blue-700">Ágape</p><p className="text-xs text-slate-500">{usuario?.nome}</p></div><button onClick={() => setAberto(false)} className="rounded-xl p-3" aria-label="Fechar"><X/></button></div><nav className="mt-3 flex-1 space-y-4 overflow-y-auto pb-4">{grupos.map(grupo => <section key={grupo.titulo}><p className="mb-1 px-4 text-[11px] font-black uppercase tracking-wider text-slate-400">{grupo.titulo}</p><div className="space-y-1">{grupo.itens.map(item)}</div></section>)}{admin && <section className="hidden border-t pt-4 md:block"><p className="mb-1 px-4 text-[11px] font-black uppercase tracking-wider text-slate-400">Gestão e cadastros</p><div className="space-y-1">{gestaoAdmin.map(item)}</div></section>}</nav><button onClick={() => void encerrar()} className="flex min-h-13 items-center gap-3 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700"><LogOut size={20}/>Sair</button></aside></div>}
  </>;
}
