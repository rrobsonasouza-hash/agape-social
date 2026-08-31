import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assinarConfirmacao, hashIp, validarConfirmacao, validarEncontroAssinado } from "@/modules/ecc/server/checkin-token";

function contatoNormalizado(valor: unknown) {
  const texto = String(valor ?? "").trim().toLocaleLowerCase("pt-BR");
  if (texto.includes("@")) return texto;
  return texto.replace(/\D/g, "");
}
function hojeSaoPaulo() { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function ipDaRequisicao(request: NextRequest) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "desconhecido"; }

export async function POST(request: NextRequest) {
  try {
    const entrada = await request.json() as { acao?: string; encontroId?: string; token?: string; contato?: string; casalId?: string; confirmacao?: string };
    const encontroId = String(entrada.encontroId ?? ""); const token = String(entrada.token ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(encontroId) || !validarEncontroAssinado(encontroId, token)) return NextResponse.json({ erro: "QR Code inválido ou desatualizado." }, { status: 400 });
    const supabase = supabaseAdmin();
    const encontro = await supabase.from("ecc_encontros").select("id,paroquia_id,numero,nome,data_inicio,data_fim,status").eq("id", encontroId).maybeSingle();
    if (encontro.error || !encontro.data) return NextResponse.json({ erro: "Edição não encontrada." }, { status: 404 });
    if (encontro.data.status === "ENCERRADO") return NextResponse.json({ erro: "O check-in desta edição já foi encerrado." }, { status: 409 });
    const contato = contatoNormalizado(entrada.contato);
    if ((contato.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato)) || (!contato.includes("@") && ![10, 11].includes(contato.length)))
      return NextResponse.json({ erro: "Informe o telefone com DDD ou o e-mail usado na inscrição." }, { status: 400 });

    if (entrada.acao === "buscar") {
      const ipHash = hashIp(ipDaRequisicao(request)); const desde = new Date(Date.now() - 15 * 60_000).toISOString();
      const limite = await supabase.from("ecc_checkin_tentativas").select("id", { count: "exact", head: true }).eq("encontro_id", encontroId).eq("ip_hash", ipHash).eq("sucesso", false).gte("created_at", desde);
      if (limite.error) throw new Error(/relation|schema cache/i.test(limite.error.message) ? "Execute a migration 202608310002_ecc_checkin_publico.sql no Supabase." : limite.error.message);
      if ((limite.count ?? 0) >= 8) return NextResponse.json({ erro: "Muitas tentativas. Aguarde 15 minutos ou procure a recepção." }, { status: 429 });
      const participacoes = await supabase.from("ecc_encontro_casais").select("casal_id,classificacao,situacao").eq("encontro_id", encontroId).neq("situacao", "DESISTENTE").in("classificacao", ["INDICADO", "ENCONTRISTA", "CONVIDADO", "VISITANTE"]);
      if (participacoes.error) throw participacoes.error;
      const ids = (participacoes.data ?? []).map((item) => item.casal_id);
      const casais = ids.length ? await supabase.from("ecc_casais").select("id,conjuge_um_nome,conjuge_dois_nome,telefone,email").eq("paroquia_id", encontro.data.paroquia_id).in("id", ids) : { data: [], error: null };
      if (casais.error) throw casais.error;
      const encontrados = (casais.data ?? []).filter((item) => contato.includes("@") ? String(item.email ?? "").trim().toLocaleLowerCase("pt-BR") === contato : String(item.telefone ?? "").replace(/\D/g, "") === contato);
      const sucesso = encontrados.length === 1;
      await supabase.from("ecc_checkin_tentativas").insert({ encontro_id: encontroId, ip_hash: ipHash, sucesso });
      if (!sucesso) return NextResponse.json({ erro: encontrados.length > 1 ? "Mais de um casal usa este contato. Procure a recepção para confirmar." : "Não encontramos uma inscrição com esses dados. Confira ou procure a recepção." }, { status: 404 });
      const casal = encontrados[0]; const expiraEm = Date.now() + 10 * 60_000;
      return NextResponse.json({ casalId: casal.id, casalNome: `${casal.conjuge_um_nome} e ${casal.conjuge_dois_nome}`, encontroNome: `${encontro.data.numero}º ECC · ${encontro.data.nome}`, confirmacao: assinarConfirmacao(encontroId, casal.id, contato, expiraEm) });
    }

    if (entrada.acao === "confirmar") {
      const casalId = String(entrada.casalId ?? "");
      if (!validarConfirmacao(encontroId, casalId, contato, String(entrada.confirmacao ?? ""))) return NextResponse.json({ erro: "A confirmação expirou. Informe o contato novamente." }, { status: 400 });
      const data = hojeSaoPaulo();
      if (data < encontro.data.data_inicio || data > encontro.data.data_fim) return NextResponse.json({ erro: `O check-in estará disponível entre ${new Date(`${encontro.data.data_inicio}T12:00:00`).toLocaleDateString("pt-BR")} e ${new Date(`${encontro.data.data_fim}T12:00:00`).toLocaleDateString("pt-BR")}.` }, { status: 409 });
      const participacao = await supabase.from("ecc_encontro_casais").select("id").eq("encontro_id", encontroId).eq("casal_id", casalId).neq("situacao", "DESISTENTE").maybeSingle();
      if (participacao.error || !participacao.data) return NextResponse.json({ erro: "Inscrição não disponível para check-in." }, { status: 404 });
      const atual = await supabase.from("ecc_credenciamentos").select("id").eq("encontro_id", encontroId).eq("casal_id", casalId).maybeSingle();
      if (atual.error) throw atual.error;
      const chegada = atual.data
        ? await supabase.from("ecc_credenciamentos").update({ status: "CREDENCIADO", credenciado_em: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", atual.data.id)
        : await supabase.from("ecc_credenciamentos").insert({ paroquia_id: encontro.data.paroquia_id, encontro_id: encontroId, casal_id: casalId, status: "CREDENCIADO", credenciado_em: new Date().toISOString() });
      if (chegada.error) throw chegada.error;
      const presenca = await supabase.from("ecc_presencas_diarias").upsert({ paroquia_id: encontro.data.paroquia_id, encontro_id: encontroId, casal_id: casalId, data, presente: true, registrado_em: new Date().toISOString() }, { onConflict: "encontro_id,casal_id,data" });
      if (presenca.error) throw presenca.error;
      return NextResponse.json({ sucesso: true, mensagem: "Chegada confirmada. Sejam bem-vindos ao encontro!" });
    }
    return NextResponse.json({ erro: "Operação inválida." }, { status: 400 });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Não foi possível concluir o check-in.";
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
