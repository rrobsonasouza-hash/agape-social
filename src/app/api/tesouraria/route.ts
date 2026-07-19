import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirUsuarioAtivo } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";
const perfis = ["admin_plataforma","admin_paroquia","tesoureiro"];
const entrada = z.discriminatedUnion("entidade", [
  z.object({ entidade: z.literal("CONTA"), nome: z.string().trim().min(2), tipo: z.enum(["CAIXA","BANCO","CONTA_PAGAMENTO"]), banco: z.string().trim().default(""), agencia: z.string().trim().default(""), numeroConta: z.string().trim().default(""), saldoInicial: z.number() }),
  z.object({ entidade: z.literal("CATEGORIA"), nome: z.string().trim().min(2), natureza: z.enum(["RECEITA","DESPESA"]) }),
  z.object({ entidade: z.literal("MOVIMENTACAO"), contaId: z.uuid(), categoriaId: z.uuid(), tipo: z.enum(["ENTRADA","SAIDA"]), valor: z.number().positive(), data: z.iso.date(), descricao: z.string().trim().min(3) }),
]);
async function contexto(request: NextRequest) { const usuario = await exigirUsuarioAtivo(request); if (!perfis.includes(usuario.role)) throw new Error("FORBIDDEN"); return { usuario, ...(await resolverParoquiaDaRequisicao(request, usuario)) }; }
function erro(error: unknown) { const mensagem = error instanceof Error ? error.message : "Erro interno."; return NextResponse.json({ erro: mensagem }, { status: mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : 400 }); }

export async function GET(request: NextRequest) { try { const { supabase, paroquiaId } = await contexto(request); const inicioMes = new Date(); inicioMes.setDate(1); const [contas, categorias, movimentos] = await Promise.all([
  supabase.from("tesouraria_contas").select("id,nome,tipo,banco,agencia,numero_conta,saldo_inicial,ativa").eq("paroquia_id", paroquiaId).order("nome"),
  supabase.from("tesouraria_categorias").select("id,nome,natureza,ativa").eq("paroquia_id", paroquiaId).order("nome"),
  supabase.from("tesouraria_movimentacoes").select("id,conta_id,categoria_id,tipo,valor,data,descricao,origem,status,tesouraria_contas(nome),tesouraria_categorias(nome)").eq("paroquia_id", paroquiaId).order("data", { ascending: false }).order("created_at", { ascending: false }).limit(300),
]); if (contas.error) throw contas.error; if (categorias.error) throw categorias.error; if (movimentos.error) throw movimentos.error;
  const listaMovimentos = (movimentos.data ?? []).map((item) => ({ id:item.id, contaId:item.conta_id, contaNome:(item.tesouraria_contas as unknown as {nome:string}|null)?.nome || "Conta", categoriaId:item.categoria_id, categoriaNome:(item.tesouraria_categorias as unknown as {nome:string}|null)?.nome || "Sem categoria", tipo:item.tipo, valor:Number(item.valor), data:item.data, descricao:item.descricao, origem:item.origem, status:item.status }));
  const confirmados = listaMovimentos.filter((m) => m.status === "CONFIRMADA"); const noMes = confirmados.filter((m) => m.data >= inicioMes.toISOString().slice(0,10));
  const listaContas = (contas.data ?? []).map((conta) => { const saldoMovimentos = confirmados.filter((m) => m.contaId === conta.id).reduce((s,m) => s + (["ENTRADA","TRANSFERENCIA_ENTRADA"].includes(m.tipo) ? m.valor : -m.valor),0); return { id:conta.id,nome:conta.nome,tipo:conta.tipo,banco:conta.banco,agencia:conta.agencia,numeroConta:conta.numero_conta,saldoInicial:Number(conta.saldo_inicial),saldo:Number(conta.saldo_inicial)+saldoMovimentos,ativa:conta.ativa }; });
  const entradasMes = noMes.filter((m) => m.tipo === "ENTRADA").reduce((s,m) => s+m.valor,0); const saidasMes = noMes.filter((m) => m.tipo === "SAIDA").reduce((s,m) => s+m.valor,0);
  return NextResponse.json({ saldoTotal:listaContas.reduce((s,c) => s+c.saldo,0),entradasMes,saidasMes,resultadoMes:entradasMes-saidasMes,contas:listaContas,categorias:(categorias.data??[]).map((c)=>({id:c.id,nome:c.nome,natureza:c.natureza,ativa:c.ativa})),movimentacoes:listaMovimentos });
} catch(error){ return erro(error); } }

export async function POST(request: NextRequest) { try { const { usuario, supabase, paroquiaId } = await contexto(request); const dados = entrada.parse(await request.json()); if (dados.entidade === "CONTA") { const { data,error } = await supabase.from("tesouraria_contas").insert({ paroquia_id:paroquiaId,nome:dados.nome,tipo:dados.tipo,banco:dados.banco,agencia:dados.agencia,numero_conta:dados.numeroConta,saldo_inicial:dados.saldoInicial }).select("id").single(); if(error) throw error; return NextResponse.json({id:data.id},{status:201}); }
  if (dados.entidade === "CATEGORIA") { const { data,error } = await supabase.from("tesouraria_categorias").insert({paroquia_id:paroquiaId,nome:dados.nome,natureza:dados.natureza}).select("id").single(); if(error) throw error; return NextResponse.json({id:data.id},{status:201}); }
  const [conta,categoria] = await Promise.all([supabase.from("tesouraria_contas").select("id").eq("id",dados.contaId).eq("paroquia_id",paroquiaId).single(),supabase.from("tesouraria_categorias").select("id,natureza").eq("id",dados.categoriaId).eq("paroquia_id",paroquiaId).single()]); if(conta.error||categoria.error) throw new Error("Conta ou categoria inválida."); if((dados.tipo === "ENTRADA" ? "RECEITA" : "DESPESA") !== categoria.data.natureza) throw new Error("A categoria não corresponde ao tipo do lançamento."); const {data,error}=await supabase.from("tesouraria_movimentacoes").insert({paroquia_id:paroquiaId,conta_id:dados.contaId,categoria_id:dados.categoriaId,tipo:dados.tipo,valor:dados.valor,data:dados.data,descricao:dados.descricao,criado_por:usuario.uid}).select("id").single(); if(error) throw error; return NextResponse.json({id:data.id},{status:201});
} catch(error){ return erro(error); } }
