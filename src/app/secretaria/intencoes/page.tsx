"use client";

import { FormEvent,useState } from "react";
import { CalendarDays,Printer,Search } from "lucide-react";
import toast from "react-hot-toast";
import { ProtectedArea } from "@/components/auth/ProtectedArea";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { obterTokenAcesso } from "@/lib/auth/client-session";

type Intencao={id:string;protocolo:string;tipo:string;nome:string;horario:string;observacoes:string};
type Resultado={paroquia:{nome:string};data:string;horario:string;intencoes:Intencao[]};
const hoje=()=>new Date().toLocaleDateString("en-CA",{timeZone:"America/Sao_Paulo"});
const dataBR=(v:string)=>new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});

function Conteudo(){
  const[filtro,setFiltro]=useState({data:hoje(),horario:""});const[dados,setDados]=useState<Resultado|null>(null);const[carregando,setCarregando]=useState(false);
  async function buscar(e?:FormEvent){e?.preventDefault();setCarregando(true);try{const token=await obterTokenAcesso();const params=new URLSearchParams({data:filtro.data});if(filtro.horario)params.set("horario",filtro.horario);const resposta=await fetch(`/api/secretaria/intencoes?${params}`,{headers:{Authorization:`Bearer ${token}`}});const json=await resposta.json();if(!resposta.ok)throw new Error(json.erro);setDados(json);}catch(e){toast.error(e instanceof Error?e.message:"Não foi possível carregar as intenções.");}finally{setCarregando(false);}}
  const grupos=dados?.intencoes.reduce<Record<string,Intencao[]>>((acc,item)=>{(acc[item.tipo]??=[]).push(item);return acc;},{})??{};
  return <main className="min-h-screen bg-slate-100 print:bg-white"><div className="print:hidden"><ModuleHeader titulo="Pauta de intenções"/></div><div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 print:max-w-none print:p-0"><section className="rounded-2xl border bg-white p-5 shadow-sm print:hidden"><div className="mb-4 flex items-center gap-2"><CalendarDays className="text-violet-600"/><div><h2 className="text-xl font-black">Preparar pauta para o celebrante</h2><p className="text-sm text-slate-500">Selecione a celebração para reunir todas as intenções.</p></div></div><form onSubmit={buscar} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><label className="text-sm font-bold">Data<input type="date" value={filtro.data} onChange={e=>setFiltro({...filtro,data:e.target.value})} className="mt-1 min-h-12 w-full rounded-xl border px-3 font-normal" required/></label><label className="text-sm font-bold">Horário <span className="font-normal text-slate-500">(opcional)</span><input type="time" value={filtro.horario} onChange={e=>setFiltro({...filtro,horario:e.target.value})} className="mt-1 min-h-12 w-full rounded-xl border px-3 font-normal"/></label><button disabled={carregando} className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 font-black text-white"><Search size={18}/>{carregando?"Buscando...":"Listar intenções"}</button></form></section>
    {dados&&<><div className="flex justify-end print:hidden"><button onClick={()=>window.print()} disabled={!dados.intencoes.length} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-900 px-5 font-black text-white disabled:opacity-40"><Printer size={18}/>Imprimir pauta</button></div><article className="rounded-2xl border bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none"><header className="border-b-2 border-slate-900 pb-4 text-center"><p className="text-sm font-bold uppercase tracking-widest">{dados.paroquia.nome}</p><h1 className="mt-2 text-3xl font-black">Intenções da Santa Missa</h1><p className="mt-2 text-lg capitalize">{dataBR(dados.data)}{dados.horario&&` • ${dados.horario}`}</p></header>{dados.intencoes.length?<div className="mt-6 space-y-7">{Object.entries(grupos).map(([tipo,itens])=><section key={tipo}><h2 className="border-b pb-2 text-lg font-black uppercase">{tipo}</h2><ol className="mt-3 space-y-3">{itens.map((item,index)=><li key={item.id} className="flex gap-3"><span className="font-bold text-slate-400">{index+1}.</span><div><p className="text-lg font-semibold">{item.nome}</p>{item.observacoes&&<p className="text-sm text-slate-600">{item.observacoes}</p>}</div></li>)}</ol></section>)}</div>:<div className="py-16 text-center text-slate-500">Nenhuma intenção encontrada para a data e o horário selecionados.</div>}<footer className="mt-10 hidden border-t pt-3 text-xs text-slate-500 print:flex print:justify-between"><span>Total: {dados.intencoes.length} intenções</span><span>Impresso em {new Date().toLocaleString("pt-BR")}</span></footer></article></>}
  </div></main>;
}

export default function IntencoesPage(){return <ProtectedArea><Conteudo/></ProtectedArea>}
