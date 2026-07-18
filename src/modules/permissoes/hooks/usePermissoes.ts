"use client";
import { useCallback, useEffect, useState } from "react";
import { obterTokenAcesso } from "@/lib/auth/client-session";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { permissoesPadrao, PermissoesPorPerfil } from "@/config/permissions";

async function requisicao<T>(init?: RequestInit): Promise<T> { const token = await obterTokenAcesso(); const resposta = await fetch("/api/permissoes", { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }); const dados = await resposta.json(); if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar as permissões."); return dados as T; }

export function usePermissoes() {
  const { usuario, carregando: carregandoAuth } = useAuth();
  const [permissoes, setPermissoes] = useState<PermissoesPorPerfil>(permissoesPadrao); const [carregando, setCarregando] = useState(true);
  const carregar = useCallback(async () => { setCarregando(true); try { setPermissoes(await requisicao<PermissoesPorPerfil>()); } finally { setCarregando(false); } }, []);
  const salvar = useCallback(async (novas: PermissoesPorPerfil) => { const salvas = await requisicao<PermissoesPorPerfil>({ method: "PUT", body: JSON.stringify(novas) }); setPermissoes(salvas); return salvas; }, []);
  useEffect(() => { if (!carregandoAuth && usuario) void carregar().catch(() => setCarregando(false)); else if (!carregandoAuth) setCarregando(false); }, [carregar, carregandoAuth, usuario]);
  return { permissoes, carregando, carregar, salvar };
}
