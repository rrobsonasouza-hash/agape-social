type DadosFamiliaComparavel = {
  nomeResponsavel?: unknown;
  cpf?: unknown;
  rg?: unknown;
  status?: unknown;
  beneficioBloqueado?: unknown;
};

export type FamiliaComparavel = {
  id: string;
  dados: DadosFamiliaComparavel;
};

export type DuplicidadeFamilia = {
  id: string;
  nomeResponsavel: string;
  documento: "CPF" | "RG";
  status: "ATIVA" | "INATIVA";
  beneficioBloqueado: boolean;
};

export class ErroDuplicidadeFamilia extends Error {
  readonly duplicidade: DuplicidadeFamilia;

  constructor(duplicidade: DuplicidadeFamilia) {
    const situacao =
      duplicidade.status === "INATIVA"
        ? " O cadastro existente está inativo; localize-o e reative-o em vez de cadastrar novamente."
        : duplicidade.beneficioBloqueado
          ? " O cadastro existente está com o benefício bloqueado; localize-o para revisar o bloqueio."
          : " Localize e atualize o cadastro existente em vez de criar outro.";
    super(
      `Já existe uma família cadastrada com este ${duplicidade.documento} para ${duplicidade.nomeResponsavel}.${situacao}`,
    );
    this.duplicidade = duplicidade;
    this.name = "ErroDuplicidadeFamilia";
  }
}

export function normalizarCpf(valor: unknown) {
  return typeof valor === "string" ? valor.replace(/\D/g, "") : "";
}

export function normalizarRg(valor: unknown) {
  return typeof valor === "string"
    ? valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toUpperCase()
    : "";
}

export function encontrarDuplicidadeFamilia(
  candidata: DadosFamiliaComparavel,
  cadastradas: FamiliaComparavel[],
  ignorarId?: string,
): DuplicidadeFamilia | null {
  const cpf = normalizarCpf(candidata.cpf);
  const rg = normalizarRg(candidata.rg);

  for (const cadastrada of cadastradas) {
    if (cadastrada.id === ignorarId) continue;
    const documento =
      cpf && normalizarCpf(cadastrada.dados.cpf) === cpf
        ? "CPF"
        : rg && normalizarRg(cadastrada.dados.rg) === rg
          ? "RG"
          : null;
    if (!documento) continue;

    return {
      id: cadastrada.id,
      nomeResponsavel:
        typeof cadastrada.dados.nomeResponsavel === "string" &&
        cadastrada.dados.nomeResponsavel.trim()
          ? cadastrada.dados.nomeResponsavel.trim()
          : "o responsável já cadastrado",
      documento,
      status: cadastrada.dados.status === "INATIVA" ? "INATIVA" : "ATIVA",
      beneficioBloqueado: cadastrada.dados.beneficioBloqueado === true,
    };
  }

  return null;
}
