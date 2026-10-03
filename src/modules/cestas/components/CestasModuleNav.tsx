"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, ListChecks } from "lucide-react";

const itens = [
  { href: "/cestas", label: "Campanhas e cestas", icon: Gift },
  { href: "/cestas/distribuicao", label: "Distribuição", icon: ListChecks },
];

export function CestasModuleNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação de cestas e distribuição"
      className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-2 shadow-sm"
    >
      {itens.map((item) => {
        const Icon = item.icon;
        const ativo =
          item.href === "/cestas"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 text-center text-xs font-bold transition sm:flex-row sm:gap-2 sm:text-sm ${
              ativo
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <Icon className="shrink-0" size={19} />
            <span className="leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
