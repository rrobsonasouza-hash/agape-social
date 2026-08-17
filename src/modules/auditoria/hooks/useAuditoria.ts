"use client";
import { useCallback } from "react";
import { AuditoriaService } from "../services/auditoria.service";
const service = new AuditoriaService();
export function useAuditoria() { return { listar: useCallback((limite?: number) => service.listar(limite), []) }; }
