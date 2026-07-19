"use client";
import { Bell, Building2, LogOut, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { roleLabels } from "@/config/roles";
import { obterTokenAcesso, sair } from "@/lib/auth/client-session";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";
import { ParoquiaDocumento } from "@/modules/paroquias/types/paroquia-documento";

export function Topbar() {
  const { usuario } = useAuth(); const { buscarContexto, limparContexto } = useParoquia(false); const [paroquia, setParoquia] = useState<ParoquiaDocumento | null>(null); const [logoUrl,setLogoUrl]=useState<string|null>(null); const router = useRouter();
  useEffect(() => { buscarContexto().then(async atual=>{setParoquia(atual);try{const token=await obterTokenAcesso();if(!token||!atual)return;const resposta=await fetch("/api/paroquias/logo",{headers:{Authorization:`Bearer ${token}`}});if(resposta.ok)setLogoUrl((await resposta.json()).url);}catch{setLogoUrl(null);}}).catch(() => {setParoquia(null);setLogoUrl(null);}); }, [buscarContexto]);
  async function trocarParoquia() { await limparContexto(); router.push("/central"); }
  async function encerrarSessao() { try { if (usuario?.role === "admin_plataforma") await limparContexto(); await sair(); router.replace("/login"); } catch { toast.error("Não foi possível encerrar a sessão."); } }
  return <header className="flex h-16 items-center justify-between border-b bg-white pl-16 pr-3 md:px-6"><div className="flex min-w-0 items-center gap-3">{logoUrl&&<div role="img" aria-label={`Logotipo ${paroquia?.nome||"da paróquia"}`} className="h-10 w-10 shrink-0 rounded-lg border bg-white bg-contain bg-center bg-no-repeat" style={{backgroundImage:`url(${JSON.stringify(logoUrl)})`}}/>}<div className="min-w-0"><h2 className="text-lg font-semibold text-gray-800 sm:text-xl">Ágape Social</h2><p className="max-w-40 truncate text-xs text-gray-500 sm:max-w-none sm:text-sm">{paroquia?.nome || "Gestão pastoral"}</p></div></div><div className="flex items-center gap-1 sm:gap-4">{usuario?.role === "admin_plataforma" && <button type="button" onClick={() => void trocarParoquia()} className="hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-blue-700 md:inline-flex"><Building2 size={17} /> Trocar paróquia</button>}<button type="button" aria-label="Notificações" className="relative rounded-full p-2 transition hover:bg-gray-100"><Bell size={20} /></button><div className="flex items-center gap-2"><UserCircle size={30} className="text-blue-700 sm:h-[34px] sm:w-[34px]" /><div className="hidden text-right sm:block"><p className="text-sm font-medium">{usuario?.nome}</p><p className="text-xs text-gray-500">{usuario ? roleLabels[usuario.role] : ""}</p></div></div><button type="button" onClick={() => void encerrarSessao()} title="Sair" aria-label="Sair" className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700"><LogOut size={20} /></button></div></header>;
}
