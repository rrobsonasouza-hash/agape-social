import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function segredo() {
  const valor = process.env.ECC_CHECKIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!valor) throw new Error("O segredo do check-in público não está configurado.");
  return valor;
}
function assinatura(conteudo: string) { return createHmac("sha256", segredo()).update(conteudo).digest("base64url"); }
function comparar(a: string, b: string) { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }

export function assinarEncontro(encontroId: string) { return assinatura(`encontro:${encontroId}`); }
export function validarEncontroAssinado(encontroId: string, token: string) { return comparar(assinarEncontro(encontroId), token); }
export function assinarConfirmacao(encontroId: string, casalId: string, contato: string, expiraEm: number) {
  const corpo = `${encontroId}.${casalId}.${createHash("sha256").update(contato).digest("hex")}.${expiraEm}`;
  return `${expiraEm}.${assinatura(`confirmacao:${corpo}`)}`;
}
export function validarConfirmacao(encontroId: string, casalId: string, contato: string, token: string) {
  const [expiracao, fornecida] = token.split("."); const expiraEm = Number(expiracao);
  if (!fornecida || !Number.isFinite(expiraEm) || Date.now() > expiraEm) return false;
  const esperada = assinarConfirmacao(encontroId, casalId, contato, expiraEm).split(".")[1];
  return comparar(esperada, fornecida);
}
export function hashIp(ip: string) { return createHmac("sha256", segredo()).update(`ip:${ip}`).digest("hex"); }
