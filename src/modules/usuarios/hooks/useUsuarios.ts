"use client";
import { useCallback } from "react";
import { UsuarioService } from "../services/usuario.service";
import { UsuarioFormData } from "../types/usuario-documento";
const service = new UsuarioService();
export function useUsuarios() { return { listar: useCallback(() => service.listar(), []), criar: useCallback((data: UsuarioFormData) => service.criar(data), []), atualizar: useCallback((id: string, data: UsuarioFormData) => service.atualizar(id, data), []), alterarStatus: useCallback((id: string, status: "PENDENTE" | "ATIVO" | "INATIVO") => service.alterarStatus(id, status), []) }; }
