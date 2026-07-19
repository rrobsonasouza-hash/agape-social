"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronDown, ChevronRight, ClipboardList, Gift, HandHeart, Handshake, HeartHandshake, History, KeyRound, Landmark, LayoutDashboard, MapPinned, Menu, Package, Route, Settings, ShieldCheck, ShoppingCart, Users, X } from "lucide-react";
import { podeAcessarRota } from "@/config/permissions";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { usePermissoes } from "@/modules/permissoes/hooks/usePermissoes";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";

type Item = { title: string; href: string; icon: typeof LayoutDashboard };
type Grupo = { id: string; title: string; icon: typeof LayoutDashboard; items: Item[] };

const painel: Item = { title: "Painel", href: "/dashboard", icon: LayoutDashboard };
const pastoral: Grupo = { id: "pastoral", title: "Pastoral Social", icon: HeartHandshake, items: [
  { title: "Famílias", href: "/familias", icon: Users }, { title: "Cestas e distribuições", href: "/cestas", icon: Gift },
  { title: "Estoque social", href: "/estoque", icon: Package }, { title: "Visitas", href: "/visitas", icon: ClipboardList },
  { title: "Voluntários", href: "/voluntarios", icon: HeartHandshake }, { title: "Doadores", href: "/doadores", icon: HandHeart },
  { title: "Parceiros", href: "/parceiros", icon: Handshake }, { title: "Áreas pastorais", href: "/areas-pastorais", icon: MapPinned },
  { title: "Rotas", href: "/rotas", icon: Route }, { title: "Relatórios pastorais", href: "/relatorios", icon: BarChart3 },
] };
const modulos: Item[] = [
  { title: "Secretaria", href: "/secretaria", icon: ShoppingCart },
  { title: "Tesouraria", href: "/tesouraria", icon: Landmark },
];
const administracao: Grupo = { id: "administracao", title: "Administração", icon: Settings, items: [
  { title: "Configurações da paróquia", href: "/administracao", icon: Settings },
  { title: "Usuários", href: "/usuarios", icon: ShieldCheck }, { title: "Perfis e acessos", href: "/perfis-acesso", icon: KeyRound },
  { title: "Auditoria", href: "/auditoria", icon: History },
] };

function rotaAtiva(pathname: string, href: string) { return pathname === href || pathname.startsWith(`${href}/`); }

export function Sidebar() {
  const pathname = usePathname(); const { usuario } = useAuth(); const { permissoes } = usePermissoes(); const { buscarContexto } = useParoquia(false);
  const [temParoquiaSelecionada, setTemParoquiaSelecionada] = useState(false); const [abertoMobile, setAbertoMobile] = useState(false); const [gruposAbertos, setGruposAbertos] = useState<string[]>(["pastoral"]);
  useEffect(() => { if (usuario?.role === "admin_plataforma") buscarContexto().then((paroquia) => setTemParoquiaSelecionada(Boolean(paroquia))).catch(() => setTemParoquiaSelecionada(false)); else setTemParoquiaSelecionada(Boolean(usuario)); }, [buscarContexto, usuario]);
  const pode = useCallback((href: string) => Boolean(usuario && !(usuario.role === "admin_plataforma" && !temParoquiaSelecionada) && podeAcessarRota(usuario.role, href, permissoes)), [usuario, permissoes, temParoquiaSelecionada]);
  const grupos = useMemo(() => [pastoral, administracao].map(grupo => ({ ...grupo, items: grupo.items.filter(item => pode(item.href)) })).filter(grupo => grupo.items.length), [pode]);
  const diretos = [painel, ...modulos].filter(item => pode(item.href));
  useEffect(() => { const grupoAtual = grupos.find(grupo => grupo.items.some(item => rotaAtiva(pathname, item.href))); if (grupoAtual) setGruposAbertos(atuais => atuais.includes(grupoAtual.id) ? atuais : [...atuais, grupoAtual.id]); setAbertoMobile(false); }, [pathname, grupos]);
  function alternarGrupo(id:string){setGruposAbertos(atuais=>atuais.includes(id)?atuais.filter(item=>item!==id):[...atuais,id]);}
  const link = (item:Item,filho=false) => { const Icon=item.icon;const ativo=rotaAtiva(pathname,item.href);return <Link key={item.href} href={item.href} aria-current={ativo?"page":undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${filho?"ml-5":""} ${ativo?"bg-blue-600 font-bold text-white shadow-sm":"text-slate-700 hover:bg-blue-50 hover:text-blue-700"}`}><Icon size={17}/><span>{item.title}</span></Link>; };
  return <><button type="button" onClick={()=>setAbertoMobile(true)} aria-label="Abrir menu" className="fixed left-3 top-3 z-40 rounded-lg border bg-white p-2 text-blue-700 shadow md:hidden"><Menu size={22}/></button>{abertoMobile&&<button type="button" aria-label="Fechar menu" onClick={()=>setAbertoMobile(false)} className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"/>}<aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white shadow-xl transition-transform md:static md:z-auto md:min-h-screen md:translate-x-0 md:shadow-none ${abertoMobile?"translate-x-0":"-translate-x-full"}`}><div className="flex items-start justify-between border-b p-5"><div><h1 className="text-xl font-bold text-blue-700">Ágape Social</h1><p className="mt-1 text-xs text-gray-500">Tecnologia a serviço da Caridade</p></div><button type="button" onClick={()=>setAbertoMobile(false)} aria-label="Fechar menu" className="rounded-lg p-1 text-slate-500 md:hidden"><X size={21}/></button></div><nav className="flex-1 space-y-2 overflow-y-auto p-3">{diretos.filter(item=>item.href==="/dashboard").map(item=>link(item))}{grupos.map(grupo=>{const Icon=grupo.icon;const aberto=gruposAbertos.includes(grupo.id);const ativo=grupo.items.some(item=>rotaAtiva(pathname,item.href));return <div key={grupo.id}><button type="button" onClick={()=>alternarGrupo(grupo.id)} aria-expanded={aberto} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold transition ${ativo?"text-blue-700":"text-slate-700 hover:bg-slate-50"}`}><Icon size={18}/><span className="flex-1">{grupo.title}</span>{aberto?<ChevronDown size={17}/>:<ChevronRight size={17}/>}</button>{aberto&&<div className="mt-1 space-y-1 border-l border-slate-200">{grupo.items.map(item=>link(item,true))}</div>}</div>})}<div className="my-2 border-t"/>{diretos.filter(item=>item.href!=="/dashboard").map(item=>link(item))}</nav></aside></>;
}
