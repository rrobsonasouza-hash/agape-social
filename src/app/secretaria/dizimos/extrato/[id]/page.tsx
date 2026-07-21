"use client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { ProtectedArea } from "@/components/auth/ProtectedArea";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { obterTokenAcesso } from "@/lib/auth/client-session";
import { formatMoeda } from "@/lib/formatters/masks";

type Dados = { paroquia:{nome:string;endereco:Record<string,string>|null;logoUrl:string|null}; dizimista:{id:string;nome:string;cpf:string;telefone:string;email:string}; ano:number; pagamentos:Array<{id:string;competencia:string;dataPagamento:string;valor:number;formaPagamento:string;status:"CONFIRMADO"|"CANCELADO"}> };
function data(v:string){return new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR");}

function Conteudo(){
  const { id } = useParams<{id:string}>();
  const [ano,setAno]=useState(new Date().getFullYear());
  const [dados,setDados]=useState<Dados|null>(null);
  const carregar=useCallback(async()=>{try{const token=await obterTokenAcesso();const r=await fetch(`/api/secretaria/dizimos/extrato/${id}?ano=${ano}`,{headers:{Authorization:`Bearer ${token}`}});const d=await r.json();if(!r.ok)throw new Error(d.erro);setDados(d);}catch(e){toast.error(e instanceof Error?e.message:"Não foi possível preparar o extrato.");}},[id,ano]);
  useEffect(()=>{void carregar();},[carregar]);
  const confirmados=useMemo(()=>dados?.pagamentos.filter(p=>p.status==="CONFIRMADO")??[],[dados]);
  const total=confirmados.reduce((s,p)=>s+p.valor,0);
  if(!dados)return <div className="grid min-h-screen place-items-center bg-slate-100">Preparando extrato...</div>;
  const e=dados.paroquia.endereco||{};const endereco=[e.logradouro,e.numero,e.bairro,e.cidade,e.estado].filter(Boolean).join(", ");
  return <main className="min-h-screen bg-slate-100 print:bg-white"><div className="print:hidden"><ModuleHeader titulo="Extrato anual de dízimos"/></div><div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6 print:max-w-none print:p-0"><div className="flex flex-wrap items-end justify-between gap-3 print:hidden"><Link href="/secretaria/dizimos" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 font-bold"><ArrowLeft size={18}/>Voltar</Link><div className="flex items-end gap-2"><label className="text-sm font-bold">Ano<input type="number" min="2000" max="2100" value={ano} onChange={e=>setAno(Number(e.target.value))} className="mt-1 block min-h-11 w-28 rounded-xl border px-3 font-normal"/></label><button onClick={()=>window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-black text-white"><Printer size={18}/>Imprimir ou salvar PDF</button></div></div><article className="rounded-2xl border bg-white p-8 shadow-sm print:border-0 print:p-0 print:shadow-none"><header className="border-b-2 border-slate-900 pb-5 text-center">{dados.paroquia.logoUrl&&<Image src={dados.paroquia.logoUrl} alt="Logotipo da paróquia" width={88} height={88} unoptimized className="mx-auto h-20 w-20 object-contain"/>}<p className="mt-3 text-sm font-bold uppercase tracking-widest">{dados.paroquia.nome}</p>{endereco&&<p className="text-xs text-slate-500">{endereco}</p>}<h1 className="mt-6 text-3xl font-black">Extrato Anual de Dízimos</h1><p className="mt-1 text-lg">Ano {dados.ano}</p></header><section className="mt-6 grid gap-3 sm:grid-cols-2"><p><span className="block text-xs font-bold uppercase text-slate-500">Dizimista</span><strong className="text-lg">{dados.dizimista.nome}</strong></p>{dados.dizimista.cpf&&<p><span className="block text-xs font-bold uppercase text-slate-500">CPF</span>{dados.dizimista.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,"$1.$2.$3-$4")}</p>}</section><div className="mt-7 overflow-hidden rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Competência</th><th className="p-3">Recebimento</th><th className="p-3">Forma</th><th className="p-3 text-right">Valor</th></tr></thead><tbody>{confirmados.map(p=><tr key={p.id} className="border-t"><td className="p-3 capitalize">{new Date(`${p.competencia}T12:00:00`).toLocaleDateString("pt-BR",{month:"long"})}</td><td className="p-3">{data(p.dataPagamento)}</td><td className="p-3">{p.formaPagamento}</td><td className="p-3 text-right font-bold">{formatMoeda(p.valor)}</td></tr>)}{!confirmados.length&&<tr><td colSpan={4} className="p-8 text-center text-slate-500">Nenhuma contribuição confirmada neste ano.</td></tr>}</tbody><tfoot className="border-t-2 bg-slate-50"><tr><td colSpan={3} className="p-4 font-black">Total anual</td><td className="p-4 text-right text-xl font-black text-emerald-700">{formatMoeda(total)}</td></tr></tfoot></table></div><footer className="mt-10 flex items-center justify-center gap-2 border-t pt-4 text-xs text-slate-500"><FileText size={15}/>Emitido pelo sistema Ágape Social em {new Date().toLocaleDateString("pt-BR")}</footer></article></div></main>;
}
export default function ExtratoDizimistaPage(){return <ProtectedArea><Conteudo/></ProtectedArea>}
