import { NextRequest, NextResponse } from "next/server";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { resolverParoquiaDaRequisicao } from "@/lib/supabase/tenant";

const tabelasOperacionais = ["familias", "voluntarios", "doadores", "parceiros", "visitas", "areas_pastorais", "campanhas_cestas", "movimentacoes_cestas", "distribuicoes_cestas", "configuracoes", "auditoria"] as const;

function nomeArquivo(nome: string) {
  const slug = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `backup-agape-${slug || "paroquia"}-${new Date().toISOString().slice(0, 10)}.json`;
}

export async function GET(request: NextRequest) {
  try {
    const administrador = await exigirAdministrador(request);
    const { supabase, paroquiaId, paroquia } = await resolverParoquiaDaRequisicao(request, administrador);
    const consultas = await Promise.all(tabelasOperacionais.map(async (tabela) => {
      const { data, error } = await supabase.from(tabela).select("*").eq("paroquia_id", paroquiaId).order("created_at", { ascending: true });
      if (error) throw error; return [tabela, data ?? []] as const;
    }));
    const [perfis, documentos] = await Promise.all([
      supabase.from("perfis").select("id,paroquia_id,nome,email,telefone,perfil,status,observacoes,created_at,updated_at").eq("paroquia_id", paroquiaId).order("nome"),
      supabase.from("documentos").select("id,paroquia_id,entidade_tipo,entidade_id,tipo,nome_original,caminho_storage,mime_type,tamanho_bytes,observacao,criado_por,created_at,updated_at").eq("paroquia_id", paroquiaId).order("created_at"),
    ]);
    if (perfis.error) throw perfis.error; if (documentos.error) throw documentos.error;
    const conteudo = { formato: "agape-social-backup", versao: 1, geradoEm: new Date().toISOString(), geradoPor: { id: administrador.uid, nome: administrador.nome, email: administrador.email }, paroquia, dados: { ...Object.fromEntries(consultas), perfis: perfis.data ?? [], documentos: documentos.data ?? [] } };
    return new NextResponse(JSON.stringify(conteudo, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${nomeArquivo(String(paroquia.nome))}"`, "Cache-Control": "no-store" } });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Não foi possível gerar o backup.";
    const status = mensagem === "UNAUTHENTICATED" ? 401 : mensagem === "FORBIDDEN" ? 403 : mensagem === "PARISH_REQUIRED" ? 409 : 500;
    return NextResponse.json({ erro: mensagem }, { status });
  }
}
