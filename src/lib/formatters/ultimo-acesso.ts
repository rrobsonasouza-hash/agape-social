const formatadorUltimoAcesso = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function formatarUltimoAcesso(valor?: string | null) {
  if (!valor) return "Nunca acessou";
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "Não disponível" : formatadorUltimoAcesso.format(data);
}
