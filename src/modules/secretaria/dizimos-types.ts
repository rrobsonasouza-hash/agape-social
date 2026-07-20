export type Dizimista = { id:string; titularNome:string; conjugeNome:string; cpf:string; telefone:string; email:string; cep:string; logradouro:string; numero:string; complemento:string; bairro:string; cidade:string; estado:string; ativo:boolean; };
export type PagamentoDizimo = { id:string; dizimistaId:string; nome:string; competencia:string; dataPagamento:string; valor:number; formaPagamento:string; contaNome:string; observacao:string; };
export type DadosDizimos = { contas:Array<{id:string;nome:string}>; dizimistas:Dizimista[]; pagamentos:PagamentoDizimo[]; totalMes:number; };
