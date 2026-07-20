import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

const perfis=["admin_plataforma","admin_paroquia","atendente_secretaria","tesoureiro"];
const entrada=z.discriminatedUnion("acao",[
  z.object({acao:z.literal("CADASTRAR"),titularNome:z.string().trim().min(3),conjugeNome:z.string().trim().default(""),cpf:z.string().trim().refine(v=>!v||v.replace(/\D/g,"").length===11,"CPF inválido."),telefone:z.string().trim().default(""),email:z.union([z.email(),z.literal("")]).default("")}),
  z.object({acao:z.literal("PAGAR"),dizimistaId:z.string().uuid(),competencia:z.string().regex(/^\d{4}-\d{2}-01$/),dataPagamento:z.iso.date(),valor:z.number().positive(),formaPagamento:z.enum(["DINHEIRO","PIX","CARTAO","TRANSFERENCIA"]),contaId:z.string().uuid(),observacao:z.string().trim().default("")}),
]);
function erro(e:unknown){if(e instanceof ZodError)return NextResponse.json({erro:e.issues[0]?.message||"Dados inválidos.",detalhes:e.flatten().fieldErrors},{status:400});const m=e instanceof Error?e.message:"Erro interno.";return NextResponse.json({erro:m},{status:m==="UNAUTHENTICATED"?401:m==="FORBIDDEN"?403:400});}
async function contexto(req:NextRequest){const usuario=await exigirUsuarioAtivo(req);if(!perfis.includes(usuario.role))throw new Error("FORBIDDEN");return{usuario,...await resolverParoquiaDaRequisicao(req,usuario)};}

export async function GET(req:NextRequest){try{const{supabase,paroquiaId}=await contexto(req);const inicio=new Date();inicio.setDate(1);const[contas,dizimistas,pagamentos]=await Promise.all([
  supabase.from("tesouraria_contas").select("id,nome").eq("paroquia_id",paroquiaId).eq("ativa",true).order("nome"),
  supabase.from("secretaria_dizimistas").select("id,titular_nome,conjuge_nome,cpf,telefone,email,ativo").eq("paroquia_id",paroquiaId).order("titular_nome"),
  supabase.from("secretaria_dizimos_pagamentos").select("id,dizimista_id,competencia,data_pagamento,valor,forma_pagamento,observacao,secretaria_dizimistas(titular_nome,conjuge_nome),tesouraria_contas(nome)").eq("paroquia_id",paroquiaId).order("data_pagamento",{ascending:false}).limit(500)
]);for(const r of [contas,dizimistas,pagamentos])if(r.error)throw r.error;
const lista=(pagamentos.data??[]).map(p=>{const d=p.secretaria_dizimistas as unknown as {titular_nome:string;conjuge_nome:string}|null;const c=p.tesouraria_contas as unknown as {nome:string}|null;return{id:p.id,dizimistaId:p.dizimista_id,nome:[d?.titular_nome,d?.conjuge_nome].filter(Boolean).join(" e "),competencia:p.competencia,dataPagamento:p.data_pagamento,valor:Number(p.valor),formaPagamento:p.forma_pagamento,contaNome:c?.nome||"Conta",observacao:p.observacao};});
return NextResponse.json({contas:contas.data??[],dizimistas:(dizimistas.data??[]).map(d=>({id:d.id,titularNome:d.titular_nome,conjugeNome:d.conjuge_nome,cpf:d.cpf,telefone:d.telefone,email:d.email,ativo:d.ativo})),pagamentos:lista,totalMes:lista.filter(p=>p.competencia===inicio.toISOString().slice(0,7)+"-01").reduce((s,p)=>s+p.valor,0)});
}catch(e){return erro(e);}}

export async function POST(req:NextRequest){try{const{usuario,supabase,paroquiaId}=await contexto(req);const d=entrada.parse(await req.json());if(d.acao==="CADASTRAR"){const{data,error}=await supabase.from("secretaria_dizimistas").insert({paroquia_id:paroquiaId,titular_nome:d.titularNome,conjuge_nome:d.conjugeNome,cpf:d.cpf.replace(/\D/g,""),telefone:d.telefone,email:d.email}).select("id").single();if(error)throw error;return NextResponse.json({id:data.id},{status:201});}
const{data,error}=await supabase.rpc("registrar_pagamento_dizimo",{p_paroquia_id:paroquiaId,p_dizimista_id:d.dizimistaId,p_competencia:d.competencia,p_data_pagamento:d.dataPagamento,p_valor:d.valor,p_forma_pagamento:d.formaPagamento,p_conta_id:d.contaId,p_observacao:d.observacao,p_criado_por:usuario.uid});if(error)throw error;return NextResponse.json({id:data},{status:201});}catch(e){return erro(e);}}
