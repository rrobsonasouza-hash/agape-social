import { NextRequest, NextResponse } from "next/server";
import { criarRegistro, listarRegistros, respostaErroOperacional } from "@/lib/supabase/operational-api";
const PERFIS = ["admin_plataforma", "admin_paroquia", "coordenador", "operador"];
export async function GET(request: NextRequest) { try { return NextResponse.json(await listarRegistros(request, "campanhas_cestas", PERFIS)); } catch (error) { return respostaErroOperacional(error); } }
export async function POST(request: NextRequest) { try { return NextResponse.json(await criarRegistro(request, "campanhas_cestas", PERFIS), { status: 201 }); } catch (error) { return respostaErroOperacional(error); } }
