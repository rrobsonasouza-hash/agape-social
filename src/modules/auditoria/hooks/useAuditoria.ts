"use client";
import { useCallback } from "react";
import { AuditoriaService } from "../services/auditoria.service";
import { AuditoriaEntrada } from "../types/auditoria-documento";
const service = new AuditoriaService();
export function useAuditoria() { return { listar: useCallback((limite?: number) => service.listar(limite), []), registrar: useCallback((entrada: AuditoriaEntrada) => service.registrar(entrada), []) }; }
