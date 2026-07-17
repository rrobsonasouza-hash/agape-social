"use client";
import Link from "next/link";
import { BarChart3, Building2, ClipboardList, Gift, HandHeart, Handshake, HeartHandshake, History, LayoutDashboard, MapPinned, Package, Route, Settings, ShieldCheck, Users } from "lucide-react";
import { podeAcessarRota } from "@/config/permissions";
import { useAuth } from "@/modules/auth/hooks/useAuth";
const menu = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }, { title: "Famílias", href: "/familias", icon: Users }, { title: "Voluntários", href: "/voluntarios", icon: HeartHandshake },
  { title: "Doadores", href: "/doadores", icon: HandHeart }, { title: "Estoque", href: "/estoque", icon: Package }, { title: "Cestas", href: "/cestas", icon: Gift },
  { title: "Visitas", href: "/visitas", icon: ClipboardList }, { title: "Parceiros", href: "/parceiros", icon: Handshake }, { title: "Áreas Pastorais", href: "/areas-pastorais", icon: MapPinned },
  { title: "Rotas", href: "/rotas", icon: Route }, { title: "Relatórios", href: "/relatorios", icon: BarChart3 }, { title: "Administração", href: "/administracao", icon: Settings },
  { title: "Paróquias", href: "/paroquias", icon: Building2 }, { title: "Usuários", href: "/usuarios", icon: ShieldCheck }, { title: "Auditoria", href: "/auditoria", icon: History },
];
export function Sidebar() {
  const { usuario } = useAuth(); const itens = usuario ? menu.filter((item) => podeAcessarRota(usuario.role, item.href)) : [];
  return <aside className="min-h-screen w-64 border-r bg-white"><div className="border-b p-6"><h1 className="text-xl font-bold text-blue-700">Ágape Social</h1><p className="mt-1 text-xs text-gray-500">Tecnologia a serviço da Caridade</p></div><nav className="space-y-1 p-3">{itens.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-blue-50 hover:text-blue-700"><Icon size={18} />{item.title}</Link>; })}</nav></aside>;
}
