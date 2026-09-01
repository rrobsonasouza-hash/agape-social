import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { eccAvaliacaoPublicaSchema } from "@/modules/ecc/schemas/ecc.schema";
import { assinarConfirmacao, hashIp, validarConfirmacao, validarEncontroAssinado } from "@/modules/ecc/server/checkin-token";

function contatoNormalizado(valor: unknown) {
  const texto = String(valor ?? "").trim().toLocaleLowerCase("pt-BR");
  return texto.includes("@") ? texto : texto.replace(/\D/g, "");
}
function ipDaRequisicao(request: NextRequest) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "desconhecido"; }
function respostaErro(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ erro: error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  return NextResponse.json({ erro: error instanceof Error ? error.message : "Não foi possível registrar a avaliação." }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const entrada = await request.json() as {
      acao?: string; encontroId?: string; token?: string; contato?: string; casalId?: string;
      confirmacao?: string; avaliacao?: unknown; testemunho?: unknown; interesseTrabalhar?: unknown; areasInteresse?: unknown;
    };
    const encontroId = String(entrada.encontroId ?? ""); const token = String(entrada.token ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(encontroId) || !validarEncontroAssinado(encontroId, token))
      return NextResponse.json({ erro: "Link de avaliação inválido ou desatualizado." }, { status: 400 });
    const contato = contatoNormalizado(entrada.contato);
    if ((contato.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato)) || (!contato.includes("@") && ![10, 11].includes(contato.length)))
      return NextResponse.json({ erro: "Informe o telefone com DDD ou o e-mail usado na inscrição." }, { status: 400 });
    const supabase = supabaseAdmin();
    const encontro = await supabase.from("ecc_encontros").select("id,paroquia_id,numero,nome").eq("id", encontroId).maybeSingle();
    if (encontro.error || !encontro.data) return NextResponse.json({ erro: "Edição não encontrada." }, { status: 404 });

    if (entrada.acao === "buscar") {
      const ipHash = hashIp(ipDaRequisicao(request)); const desde = new Date(Date.now() - 15 * 60_000).toISOString();
      const limite = await supabase.from("ecc_checkin_tentativas").select("id", { count: "exact", head: true }).eq("encontro_id", encontroId).eq("ip_hash", ipHash).eq("sucesso", false).gte("created_at", desde);
      if (limite.error) throw new Error(/relation|schema cache/i.test(limite.error.message) ? "Execute as migrations do check-in e do pós-encontro no Supabase." : limite.error.message);
      if ((limite.count ?? 0) >= 8) return NextResponse.json({ erro: "Muitas tentativas. Aguarde 15 minutos ou procure a coordenação." }, { status: 429 });
      const participacoes = await supabase.from("ecc_encontro_casais").select("casal_id").eq("encontro_id", encontroId).neq("situacao", "DESISTENTE").in("classificacao", ["INDICADO", "ENCONTRISTA", "CONVIDADO", "VISITANTE"]);
      if (participacoes.error) throw participacoes.error;
      const ids = (participacoes.data ?? []).map((item) => item.casal_id);
      const casais = ids.length ? await supabase.from("ecc_casais").select("id,conjuge_um_nome,conjuge_dois_nome,telefone,email").eq("paroquia_id", encontro.data.paroquia_id).in("id", ids) : { data: [], error: null };
      if (casais.error) throw casais.error;
      const encontrados = (casais.data ?? []).filter((item) => contato.includes("@") ? String(item.email ?? "").trim().toLocaleLowerCase("pt-BR") === contato : String(item.telefone ?? "").replace(/\D/g, "") === contato);
      const sucesso = encontrados.length === 1;
      await supabase.from("ecc_checkin_tentativas").insert({ encontro_id: encontroId, ip_hash: ipHash, sucesso });
      if (!sucesso) return NextResponse.json({ erro: encontrados.length > 1 ? "Mais de um casal usa este contato. Procure a coordenação." : "Não encontramos um casal participante com esses dados." }, { status: 404 });
      const casal = encontrados[0];
      const atual = await supabase.from("ecc_pos_encontro").select("avaliacao,testemunho,interesse_trabalhar,areas_interesse").eq("encontro_id", encontroId).eq("casal_id", casal.id).maybeSingle();
      if (atual.error) throw new Error(/relation|schema cache/i.test(atual.error.message) ? "Execute a migration 202609010001_ecc_pos_encontro.sql no Supabase." : atual.error.message);
      return NextResponse.json({
        casalId: casal.id, casalNome: `${casal.conjuge_um_nome} e ${casal.conjuge_dois_nome}`,
        encontroNome: `${encontro.data.numero}º ECC · ${encontro.data.nome}`,
        confirmacao: assinarConfirmacao(encontroId, casal.id, contato, Date.now() + 15 * 60_000),
        avaliacaoAtual: atual.data ? { avaliacao: atual.data.avaliacao, testemunho: atual.data.testemunho ?? "", interesseTrabalhar: atual.data.interesse_trabalhar === true, areasInteresse: atual.data.areas_interesse ?? [] } : null,
      });
    }

    if (entrada.acao === "enviar") {
      const casalId = String(entrada.casalId ?? "");
      if (!validarConfirmacao(encontroId, casalId, contato, String(entrada.confirmacao ?? "")))
        return NextResponse.json({ erro: "A confirmação expirou. Informe o contato novamente." }, { status: 400 });
      const dados = eccAvaliacaoPublicaSchema.parse(entrada);
      const participacao = await supabase.from("ecc_encontro_casais").select("id").eq("encontro_id", encontroId).eq("casal_id", casalId).neq("situacao", "DESISTENTE").in("classificacao", ["INDICADO", "ENCONTRISTA", "CONVIDADO", "VISITANTE"]).maybeSingle();
      if (participacao.error || !participacao.data) return NextResponse.json({ erro: "Participação não disponível para avaliação." }, { status: 404 });
      const atual = await supabase.from("ecc_pos_encontro").select("id,status").eq("encontro_id", encontroId).eq("casal_id", casalId).maybeSingle();
      if (atual.error) throw atual.error;
      const valores = {
        avaliacao: dados.avaliacao, testemunho: dados.testemunho, interesse_trabalhar: dados.interesseTrabalhar,
        areas_interesse: dados.areasInteresse, updated_at: new Date().toISOString(),
      };
      const statusAtualizado = !atual.data || atual.data.status === "PENDENTE" || (!dados.interesseTrabalhar && atual.data.status === "ENCAMINHADO_VOLUNTARIADO") ? "RESPONDIDO" : atual.data.status;
      const resultado = atual.data
        ? await supabase.from("ecc_pos_encontro").update({ ...valores, status: statusAtualizado }).eq("id", atual.data.id)
        : await supabase.from("ecc_pos_encontro").insert({ ...valores, paroquia_id: encontro.data.paroquia_id, encontro_id: encontroId, casal_id: casalId, status: "RESPONDIDO" });
      if (resultado.error) throw resultado.error;
      return NextResponse.json({ sucesso: true, mensagem: "Obrigado! A avaliação do casal foi enviada à coordenação do ECC." });
    }
    return NextResponse.json({ erro: "Operação inválida." }, { status: 400 });
  } catch (error) { return respostaErro(error); }
}
