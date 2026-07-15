"use client";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase/auth";
import { AcessoRepository } from "@/modules/auth/repositories/acesso.repository";
import { perfilParaSessao, UsuarioSessao } from "@/modules/auth/types/usuario-sessao";
interface AuthContextValue { usuario: UsuarioSessao | null; carregando: boolean; erroAcesso: string; }
const AuthContext = createContext<AuthContextValue>({ usuario: null, carregando: true, erroAcesso: "" });
const repository = new AcessoRepository();
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null); const [carregando, setCarregando] = useState(true); const [erroAcesso, setErroAcesso] = useState("");
  useEffect(() => onAuthStateChanged(auth, (user) => { setCarregando(true); setErroAcesso(""); if (!user) { setUsuario(null); setCarregando(false); return; } repository.carregarPerfil(user).then((perfil) => setUsuario(perfilParaSessao(perfil))).catch((error) => { setUsuario(null); setErroAcesso(error instanceof Error ? error.message : "Acesso não autorizado."); }).finally(() => setCarregando(false)); }), []);
  const value = useMemo(() => ({ usuario, carregando, erroAcesso }), [usuario, carregando, erroAcesso]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
