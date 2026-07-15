"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  HandHeart,
  Package,
  Gift,
  ClipboardList,
  BarChart3,
  Settings,
  MapPinned,
  Route,
  Handshake,
  ShieldCheck,
} from "lucide-react";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Famílias",
    href: "/familias",
    icon: Users,
  },
  {
    title: "Voluntários",
    href: "/voluntarios",
    icon: HeartHandshake,
  },
  {
    title: "Doadores",
    href: "/doadores",
    icon: HandHeart,
  },
  {
    title: "Estoque",
    href: "/estoque",
    icon: Package,
  },
  {
    title: "Cestas",
    href: "/cestas",
    icon: Gift,
  },
  {
    title: "Visitas",
    href: "/visitas",
    icon: ClipboardList,
  },
  {
    title: "Parceiros",
    href: "/parceiros",
    icon: Handshake,
  },
  {
    title: "Áreas Pastorais",
    href: "/areas-pastorais",
    icon: MapPinned,
  },
  {
    title: "Rotas",
    href: "/rotas",
    icon: Route,
  },
  {
    title: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
  },
  {
    title: "Administração",
    href: "/administracao",
    icon: Settings,
  },
  {
    title: "Usuários",
    href: "/usuarios",
    icon: ShieldCheck,
  },
];

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen border-r bg-white">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-blue-700">
          Ágape Social
        </h1>

        <p className="text-xs text-gray-500 mt-1">
          Tecnologia a serviço da Caridade
        </p>
      </div>

      <nav className="p-3 space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition"
            >
              <Icon size={18} />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
