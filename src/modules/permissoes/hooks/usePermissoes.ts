"use client";
import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { permissoesPadrao, PermissoesPorPerfil } from "@/config/permissions";

async function requisicao<T>(init?: RequestInit): Promise<T> { const token = await auth.currentUser?.getIdToken(); if (!token) throw new Error("Sessão expirada."); const resposta = await fetch("/api/permissoes", { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }); const dados = await resposta.json(); if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar as permissões."); return dados as T; }

export function usePermissoes() {
  const [permissoes, setPermissoes] = useState<PermissoesPorPerfil>(permissoesPadrao); const [carregando, setCarregando] = useState(true);
  const carregar = useCallback(async () => { setCarregando(true); try { setPermissoes(await requisicao<PermissoesPorPerfil>()); } finally { setCarregando(false); } }, []);
  const salvar = useCallback(async (novas: PermissoesPorPerfil) => { const salvas = await requisicao<PermissoesPorPerfil>({ method: "PUT", body: JSON.stringify(novas) }); setPermissoes(salvas); return salvas; }, []);
  useEffect(() => onAuthStateChanged(auth, (usuario) => { if (usuario) void carregar().catch(() => setCarregando(false)); else setCarregando(false); }), [carregar]);
  return { permissoes, carregando, carregar, salvar };
}
