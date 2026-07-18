import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error } = await supabaseAdmin().from("paroquias").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "ok", servico: "agape-social", banco: "disponivel", verificadoEm: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "indisponivel", servico: "agape-social", banco: "indisponivel", verificadoEm: new Date().toISOString() }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
