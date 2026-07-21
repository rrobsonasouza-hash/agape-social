import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { montarDiagnostico } from "@/modules/saude/diagnostico";

export const dynamic = "force-dynamic";

export async function GET() {
  const base={ambiente:process.env.VERCEL_ENV||process.env.NODE_ENV,commit:process.env.VERCEL_GIT_COMMIT_SHA||"local"};
  try {
    const { error } = await supabaseAdmin().from("paroquias").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json(montarDiagnostico({bancoDisponivel:true,...base}), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(montarDiagnostico({bancoDisponivel:false,...base}), { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
