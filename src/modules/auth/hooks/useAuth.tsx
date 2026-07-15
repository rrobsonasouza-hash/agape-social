"use client";

import { onAuthStateChanged } from "firebase/auth";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase/auth";
import { UsuarioSessao, usuarioFirebaseParaSessao } from "@/modules/auth/types/usuario-sessao";

interface AuthContextValue {
  usuario: UsuarioSessao | null;
  carregando: boolean;
}

const AuthContext = createContext<AuthContextValue>({ usuario: null, carregando: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setUsuario(user ? usuarioFirebaseParaSessao(user) : null);
    setCarregando(false);
  }), []);

  const value = useMemo(() => ({ usuario, carregando }), [usuario, carregando]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
