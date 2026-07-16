"use client";
import { ChangeEvent, FormEvent, useState } from "react";
import { Paperclip, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/forms/Button";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useDocumentos } from "../hooks/useDocumentos";
import { formatosDocumentoPermitidos } from "../schemas/documento.schema";
import { TipoDocumento } from "../types/documento.types";
const tipos: Array<{ valor: TipoDocumento; nome: string }> = [
  { valor: "RG", nome: "RG" }, { valor: "CPF", nome: "CPF" }, { valor: "COMPROVANTE_RESIDENCIA", nome: "Comprovante de residência" }, { valor: "LAUDO_MEDICO", nome: "Laudo médico" },
  { valor: "RECEITA_MEDICA", nome: "Receita médica" }, { valor: "CERTIDAO", nome: "Certidão" }, { valor: "ENCAMINHAMENTO", nome: "Encaminhamento" }, { valor: "FOTO_RESIDENCIA", nome: "Foto da residência" }, { valor: "OUTRO", nome: "Outro" },
];
export function UploadDocumentos({ entidadeId, onConcluido }: { entidadeId: string; onConcluido: () => void | Promise<void> }) {
  const { criar } = useDocumentos(); const { usuario } = useAuth(); const [tipo, setTipo] = useState<TipoDocumento>("COMPROVANTE_RESIDENCIA"); const [observacao, setObservacao] = useState(""); const [arquivo, setArquivo] = useState<File | null>(null); const [enviando, setEnviando] = useState(false); const [chaveInput, setChaveInput] = useState(0);
  function escolher(event: ChangeEvent<HTMLInputElement>) { setArquivo(event.target.files?.[0] || null); }
  async function enviar(event: FormEvent) { event.preventDefault(); if (!arquivo || !usuario) return toast.error("Selecione um arquivo."); setEnviando(true); try { await criar({ paroquiaId: usuario.paroquiaId, entidadeTipo: "FAMILIA", entidadeId, tipo, arquivo, observacao, criadoPor: usuario.uid }); toast.success("Documento enviado com segurança."); setArquivo(null); setObservacao(""); setChaveInput((valor) => valor + 1); await onConcluido(); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível enviar o documento."); } finally { setEnviando(false); } }
  return <form onSubmit={enviar} className="mb-6 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-4"><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-slate-700">Tipo de documento<select value={tipo} onChange={(e) => setTipo(e.target.value as TipoDocumento)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-normal">{tipos.map((item) => <option key={item.valor} value={item.valor}>{item.nome}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Arquivo<input key={chaveInput} type="file" accept={formatosDocumentoPermitidos} onChange={escolher} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></label></div><label className="mt-4 block text-sm font-medium text-slate-700">Observação<input value={observacao} maxLength={500} onChange={(e) => setObservacao(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-normal" placeholder="Opcional" /></label><div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="flex items-center gap-2 text-xs text-slate-500"><Paperclip size={15} /> PDF, JPG ou PNG, até 5 MB.</p><Button type="submit" disabled={enviando || !arquivo}><Upload size={17} /> {enviando ? "Enviando..." : "Enviar documento"}</Button></div></form>;
}
