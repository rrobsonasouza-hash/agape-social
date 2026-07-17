"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/hooks/useAuth";

export default function CentralLayout({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth(); const router = useRouter();
  useEffect(() => { if (!carregando && !usuario) router.replace("/login"); else if (!carregando && usuario?.role !== "admin_plataforma") router.replace("/dashboard"); }, [carregando, router, usuario]);
  if (carregando || usuario?.role !== "admin_plataforma") return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">Verificando acesso...</div>;
  return children;
}
