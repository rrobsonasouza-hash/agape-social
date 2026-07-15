interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({
  status,
}: StatusBadgeProps) {
  const configuracao = {
    ATIVA: {
      texto: "Ativa",
      classe:
        "bg-green-100 text-green-700",
    },

    ATIVO: {
      texto: "Ativo",
      classe: "bg-green-100 text-green-700",
    },

    INATIVA: {
      texto: "Inativa",
      classe:
        "bg-slate-200 text-slate-600",
    },

    INATIVO: {
      texto: "Inativo",
      classe: "bg-slate-200 text-slate-600",
    },

    PENDENTE: {
      texto: "Pendente",
      classe:
        "bg-yellow-100 text-yellow-700",
    },

    CANCELADA: {
      texto: "Cancelada",
      classe:
        "bg-red-100 text-red-700",
    },

    AGENDADA: {
      texto: "Agendada",
      classe: "bg-blue-100 text-blue-700",
    },

    REALIZADA: {
      texto: "Realizada",
      classe: "bg-green-100 text-green-700",
    },

    RETIRADA: { texto: "Retirada", classe: "bg-green-100 text-green-700" },
    AUSENTE: { texto: "Ausente", classe: "bg-amber-100 text-amber-800" },
    ENTREGUE_DOMICILIO: { texto: "Entregue em casa", classe: "bg-blue-100 text-blue-700" },
  };

  const badge =
    configuracao[
      status as keyof typeof configuracao
    ] ??
    {
      texto: status,
      classe:
        "bg-blue-100 text-blue-700",
    };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.classe}`}
    >
      {badge.texto}
    </span>
  );
}
