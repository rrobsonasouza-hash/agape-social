"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/hooks/useAuth";

export function ProtectedArea({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !usuario) router.replace("/login");
  }, [carregando, router, usuario]);

  if (carregando || !usuario) return <div className="flex min-h-screen items-center justify-center bg-slate-100"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" /><p className="mt-4 text-sm text-slate-500">Verificando acesso...</p></div></div>;
  return children;
}
