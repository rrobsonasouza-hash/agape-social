"use client";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { observarSessao } from "@/lib/auth/client-session";
import { AcessoRepository } from "@/modules/auth/repositories/acesso.repository";
import { perfilParaSessao, UsuarioSessao } from "@/modules/auth/types/usuario-sessao";
interface AuthContextValue { usuario: UsuarioSessao | null; carregando: boolean; erroAcesso: string; }
const AuthContext = createContext<AuthContextValue>({ usuario: null, carregando: true, erroAcesso: "" });
const repository = new AcessoRepository();
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null); const [carregando, setCarregando] = useState(true); const [erroAcesso, setErroAcesso] = useState("");
  useEffect(() => observarSessao((identidade) => { setCarregando(true); setErroAcesso(""); if (!identidade) { setUsuario(null); setCarregando(false); return; } repository.carregarPerfilSessao(identidade).then((perfil) => setUsuario(perfilParaSessao(perfil))).catch((error) => { setUsuario(null); setErroAcesso(error instanceof Error ? error.message : "Acesso não autorizado."); }).finally(() => setCarregando(false)); }), []);
  const value = useMemo(() => ({ usuario, carregando, erroAcesso }), [usuario, carregando, erroAcesso]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
