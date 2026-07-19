export type FormaPagamento = "DINHEIRO" | "PIX" | "CARTAO" | "CORTESIA";
export interface CategoriaProduto { id: string; nome: string; ativa: boolean; }
export interface ProdutoSecretaria { id: string; nome: string; categoria: string; categoriaId?: string | null; preco: number; estoque: number; ativo: boolean; }
export interface MovimentoEstoqueSecretaria { id: string; produtoId: string; produtoNome: string; tipo: "ENTRADA" | "SAIDA"; quantidade: number; estoqueAnterior: number; estoquePosterior: number; motivo: string; responsavel: string; createdAt: string; }
export interface ItemCarrinho { produto: ProdutoSecretaria; quantidade: number; }
export interface VendaSecretaria { id: string; total: number; formaPagamento: FormaPagamento; valorRecebido: number | null; troco: number; itens: Array<{ produtoId: string; nome: string; quantidade: number; precoUnitario: number; subtotal: number }>; status: "CONCLUIDA" | "CANCELADA"; createdAt: string; }
