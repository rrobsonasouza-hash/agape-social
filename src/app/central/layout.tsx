"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { useAuth } from "@/modules/auth/hooks/useAuth";

export default function CentralLayout({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth(); const router = useRouter(); const pathname = usePathname();
  useEffect(() => { if (!carregando && !usuario) router.replace("/login"); else if (!carregando && usuario?.role !== "admin_plataforma") router.replace("/dashboard"); }, [carregando, router, usuario]);
  if (carregando || usuario?.role !== "admin_plataforma") return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">Verificando acesso...</div>;
  if (pathname === "/central") return children;
  return <div className="min-h-screen bg-slate-100"><header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8"><Link href="/central" className="inline-flex items-center gap-2 font-bold text-blue-700"><Building2 size={20}/>Central de Administração</Link><Link href="/central" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50"><ArrowLeft size={18}/>Voltar ao menu</Link></div></header><main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main></div>;
}
