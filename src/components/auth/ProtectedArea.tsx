"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { podeAcessarRota } from "@/config/permissions";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";
import { usePermissoes } from "@/modules/permissoes/hooks/usePermissoes";
import { sair } from "@/lib/auth/client-session";
export function ProtectedArea({ children }: { children: React.ReactNode }) {
  const { usuario, carregando, erroAcesso } = useAuth(); const { buscarContexto } = useParoquia(false); const { permissoes, carregando: carregandoPermissoes } = usePermissoes(); const router = useRouter(); const pathname = usePathname();
  useEffect(() => { if (!carregando && !usuario && !erroAcesso) router.replace("/login"); }, [carregando, erroAcesso, router, usuario]);
  useEffect(() => { if (!carregando && usuario?.role === "admin_plataforma" && !pathname.startsWith("/paroquias")) buscarContexto().then((paroquia) => { if (!paroquia) router.replace("/central"); }).catch(() => router.replace("/central")); }, [buscarContexto, carregando, pathname, router, usuario]);
  if (erroAcesso) return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="max-w-md rounded-xl border bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold text-red-800">Acesso bloqueado</h1><p className="mt-3 text-slate-600">{erroAcesso}</p><button onClick={() => void sair().then(() => router.replace("/login"))} className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white">Voltar ao login</button></div></div>;
  if (carregando || carregandoPermissoes || !usuario) return <div className="flex min-h-screen items-center justify-center bg-slate-100"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" /><p className="mt-4 text-sm text-slate-500">Verificando acesso...</p></div></div>;
  if (!podeAcessarRota(usuario.role, pathname, permissoes)) return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="max-w-md rounded-xl border bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold text-slate-900">Acesso não permitido</h1><p className="mt-3 text-slate-600">Seu perfil não possui permissão para acessar esta área.</p><button onClick={() => router.replace(usuario.role === "atendente_secretaria" ? "/secretaria" : "/dashboard")} className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white">Voltar ao painel</button></div></div>;
  return children;
}
