"use client";

import { Bell, LogOut, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { roleLabels } from "@/config/roles";
import { sair } from "@/lib/firebase/auth";
import { useAuth } from "@/modules/auth/hooks/useAuth";

export function Topbar() {
  const { usuario } = useAuth();
  const router = useRouter();

  async function encerrarSessao() {
    try { await sair(); router.replace("/login"); }
    catch { toast.error("Não foi possível encerrar a sessão."); }
  }

  return <header className="flex h-16 items-center justify-between border-b bg-white px-6"><div><h2 className="text-xl font-semibold text-gray-800">Ágape Social</h2><p className="text-sm text-gray-500">Bem-vindo à gestão pastoral</p></div><div className="flex items-center gap-4"><button type="button" aria-label="Notificações" className="relative rounded-full p-2 transition hover:bg-gray-100"><Bell size={20} /></button><div className="flex items-center gap-2"><UserCircle size={34} className="text-blue-700" /><div className="hidden text-right sm:block"><p className="text-sm font-medium">{usuario?.nome}</p><p className="text-xs text-gray-500">{usuario ? roleLabels[usuario.role] : ""}</p></div></div><button type="button" onClick={encerrarSessao} title="Sair" aria-label="Sair" className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700"><LogOut size={20} /></button></div></header>;
}
