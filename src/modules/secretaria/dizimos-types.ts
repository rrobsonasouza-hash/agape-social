export type Dizimista = { id:string; familiaId:string; titularNome:string; conjugeNome:string; telefone:string; ativo:boolean; };
export type PagamentoDizimo = { id:string; dizimistaId:string; nome:string; competencia:string; dataPagamento:string; valor:number; formaPagamento:string; contaNome:string; observacao:string; };
export type DadosDizimos = { familias:Array<{id:string;nome:string;telefone:string}>; contas:Array<{id:string;nome:string}>; dizimistas:Dizimista[]; pagamentos:PagamentoDizimo[]; totalMes:number; };
