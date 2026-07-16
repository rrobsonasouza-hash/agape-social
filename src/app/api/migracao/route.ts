import { NextRequest, NextResponse } from "next/server";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { adminDb } from "@/lib/firebase/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const colecoes: Record<string, string> = {
  familias: "familias", voluntarios: "voluntarios", doadores: "doadores", parceiros: "parceiros", visitas: "visitas",
  areasPastorais: "areas_pastorais", campanhasCestas: "campanhas_cestas", movimentacoesCestas: "movimentacoes_cestas",
  distribuicoesCestas: "distribuicoes_cestas", configuracoes: "configuracoes", auditoria: "auditoria",
};

function serializar(valor: unknown): unknown {
  if (valor === null || valor === undefined || ["string", "number", "boolean"].includes(typeof valor)) return valor ?? null;
  if (Array.isArray(valor)) return valor.map(serializar);
  if (typeof valor === "object") {
    const talvezData = valor as { toDate?: () => Date };
    if (typeof talvezData.toDate === "function") return talvezData.toDate().toISOString();
    return Object.fromEntries(Object.entries(valor as Record<string, unknown>).map(([chave, item]) => [chave, serializar(item)]));
  }
  return String(valor);
}

export async function POST(request: NextRequest) {
  try {
    await exigirAdministrador(request);
    const supabase = supabaseAdmin();
    const { data: paroquia, error: erroParoquia } = await supabase.from("paroquias").select("id").eq("slug", "paroquia-nossa-senhora-aparecida").single();
    if (erroParoquia || !paroquia) throw new Error("Paróquia principal não encontrada no Supabase.");
    const resultado: Record<string, number> = {};
    for (const [colecao, tabela] of Object.entries(colecoes)) {
      const snapshot = await adminDb().collection(colecao).get();
      const linhas = snapshot.docs.map((documento) => ({ id: documento.id, paroquia_id: paroquia.id, dados: serializar(documento.data()) }));
      if (linhas.length) {
        const { error } = await supabase.from(tabela).upsert(linhas, { onConflict: "id" });
        if (error) throw new Error(`${tabela}: ${error.message}`);
      }
      resultado[tabela] = linhas.length;
    }
    return NextResponse.json({ sucesso: true, resultado });
  } catch (error) {
    return NextResponse.json({ erro: error instanceof Error ? error.message : "Não foi possível migrar os dados." }, { status: 500 });
  }
}
