type MovimentoCalculo = {
  contaId: string;
  tipo: "ENTRADA" | "SAIDA" | "TRANSFERENCIA_ENTRADA" | "TRANSFERENCIA_SAIDA";
  valor: number;
  data: string;
  status: "CONFIRMADA" | "CANCELADA";
};

const tiposEntrada = new Set(["ENTRADA", "TRANSFERENCIA_ENTRADA"]);

export function calcularSaldoConta(saldoInicial: number, contaId: string, movimentos: MovimentoCalculo[]) {
  return movimentos
    .filter((movimento) => movimento.contaId === contaId && movimento.status === "CONFIRMADA")
    .reduce((saldo, movimento) => saldo + (tiposEntrada.has(movimento.tipo) ? movimento.valor : -movimento.valor), saldoInicial);
}

export function calcularResumoPeriodo(movimentos: MovimentoCalculo[], inicio: string, fim?: string) {
  const periodo = movimentos.filter((movimento) => movimento.status === "CONFIRMADA" && movimento.data >= inicio && (!fim || movimento.data <= fim));
  const entradas = periodo.filter((movimento) => movimento.tipo === "ENTRADA").reduce((total, movimento) => total + movimento.valor, 0);
  const saidas = periodo.filter((movimento) => movimento.tipo === "SAIDA").reduce((total, movimento) => total + movimento.valor, 0);
  return { entradas, saidas, resultado: entradas - saidas };
}
