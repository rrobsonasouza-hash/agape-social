"use client";
import { Bell, Building2, LogOut, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { roleLabels } from "@/config/roles";
import { sair } from "@/lib/auth/client-session";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";
import { ParoquiaDocumento } from "@/modules/paroquias/types/paroquia-documento";

export function Topbar() {
  const { usuario } = useAuth(); const { buscarContexto, limparContexto } = useParoquia(false); const [paroquia, setParoquia] = useState<ParoquiaDocumento | null>(null); const router = useRouter();
  useEffect(() => { buscarContexto().then(setParoquia).catch(() => setParoquia(null)); }, [buscarContexto]);
  async function trocarParoquia() { await limparContexto(); router.push("/central"); }
  async function encerrarSessao() { try { if (usuario?.role === "admin_plataforma") await limparContexto(); await sair(); router.replace("/login"); } catch { toast.error("Não foi possível encerrar a sessão."); } }
  return <header className="flex h-16 items-center justify-between border-b bg-white px-6"><div><h2 className="text-xl font-semibold text-gray-800">Ágape Social</h2><p className="text-sm text-gray-500">{paroquia?.nome || "Gestão pastoral"}</p></div><div className="flex items-center gap-4">{usuario?.role === "admin_plataforma" && <button type="button" onClick={() => void trocarParoquia()} className="hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-blue-700 md:inline-flex"><Building2 size={17} /> Trocar paróquia</button>}<button type="button" aria-label="Notificações" className="relative rounded-full p-2 transition hover:bg-gray-100"><Bell size={20} /></button><div className="flex items-center gap-2"><UserCircle size={34} className="text-blue-700" /><div className="hidden text-right sm:block"><p className="text-sm font-medium">{usuario?.nome}</p><p className="text-xs text-gray-500">{usuario ? roleLabels[usuario.role] : ""}</p></div></div><button type="button" onClick={() => void encerrarSessao()} title="Sair" aria-label="Sair" className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700"><LogOut size={20} /></button></div></header>;
}
