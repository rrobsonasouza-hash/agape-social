export interface Familia {
  id?: string;

  nomeResponsavel: string;

  cpf: string;

  telefone: string;

  email?: string;

  cep: string;

  logradouro: string;

  numero: string;

  complemento?: string;

  bairro: string;

  cidade: string;

  estado: string;

  quantidadeMoradores: number;

  rendaFamiliar: number;

  observacoes?: string;

  status: "ATIVA" | "INATIVA";

  createdAt?: Date;

  updatedAt?: Date;

  paroquiaId: string;
}