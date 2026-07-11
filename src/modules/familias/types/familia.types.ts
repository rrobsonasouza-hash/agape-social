export type StatusFamilia =
  | "ATIVA"
  | "INATIVA";

export interface Responsavel {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface SituacaoSocial {
  moradores: number;
  renda: number;
  observacoes?: string;
}

export interface Familia {
  id?: string;

  responsavel: Responsavel;

  endereco: Endereco;

  situacao: SituacaoSocial;

  status: StatusFamilia;

  createdAt?: Date;

  updatedAt?: Date;
}