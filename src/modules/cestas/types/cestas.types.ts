export interface ItemCestaPadrao {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
}

export interface CampanhaCestas {
  id: string;
  nome: string;
  metaCestas: number;
  dataLimite: string;
  status: "ATIVA" | "ENCERRADA";
}

export interface MovimentacaoCestas {
  id: string;
  campanhaId: string;
  tipo: "CESTA_PRONTA" | "ITEM_AVULSO";
  origem: "DOACAO" | "COMPRA_PAROQUIA";
  operacao?: "ENTRADA" | "SAIDA";
  doadorId?: string;
  doadorNome?: string;
  itemId?: string;
  itemNome?: string;
  quantidade: number;
  unidade?: string;
  valorTotal?: number;
  data: string;
  observacoes?: string;
  familiaId?: string;
  familiaNome?: string;
}
