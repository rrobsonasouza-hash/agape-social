"use client";
import { useCallback } from "react";
import { EccService } from "../services/ecc.service";
import type { EccCasalFormData, EccEncontroFormData, EccEquipeFormData } from "../schemas/ecc.schema";
const service = new EccService();
export function useEcc(){
  const listar=useCallback(()=>service.listar(),[]);
  const criarEncontro=useCallback((dados:EccEncontroFormData)=>service.criarEncontro(dados),[]);
  const criarCasal=useCallback((dados:EccCasalFormData)=>service.criarCasal(dados),[]);
  const adicionarEquipe=useCallback((dados:EccEquipeFormData)=>service.adicionarEquipe(dados),[]);
  return { listar, criarEncontro, criarCasal, adicionarEquipe };
}
