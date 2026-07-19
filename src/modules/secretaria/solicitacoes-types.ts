export type TipoSolicitacao="BATISMO"|"CASAMENTO"|"PRIMEIRA_COMUNHAO"|"CRISMA"|"SEGUNDA_VIA"|"INTENCAO_MISSA"|"OUTROS";
export type StatusSolicitacao="RECEBIDA"|"EM_ANDAMENTO"|"AGUARDANDO_DOCUMENTOS"|"PRONTA"|"CONCLUIDA"|"CANCELADA";
export interface DocumentoChecklist{id:string;nome:string;entregue:boolean;}
export interface DetalhesIntencao{tipo?:string;dataCelebracao?:string;horario?:string;nomeIntencao?:string;}
export interface SolicitacaoSecretaria{id:string;protocolo:string;tipo:string;servicoNome?:string;solicitanteNome:string;solicitanteEmail?:string;telefone:string;interessadoNome:string;prazo:string|null;observacoes:string;status:StatusSolicitacao;valor:number;pago:boolean;pagoEm:string|null;criadoPorNome:string;createdAt:string;documentosChecklist?:DocumentoChecklist[];detalhes?:DetalhesIntencao;impressoEm?:string|null;impressoPorNome?:string|null;}
export interface HistoricoSolicitacao{id:string;status:StatusSolicitacao;observacao:string;criadoPorNome:string;createdAt:string;}
export interface ContaSolicitacao{id:string;nome:string;tipo:string;}
export interface ServicoSecretaria{id:string;codigo?:string;nome:string;valor:number;prazoDias:number;documentos:string[];ativo:boolean;}
