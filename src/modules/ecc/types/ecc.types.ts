export type EccEncontroStatus = "PLANEJAMENTO" | "INSCRICOES" | "PREPARACAO" | "REALIZADO" | "ENCERRADO";
export type EccCasalSituacao = "ELEGIVEL" | "CONVIDADO" | "INSCRITO" | "CONFIRMADO" | "LISTA_ESPERA" | "DESISTENTE" | "PARTICIPOU";
export type EccEquipeStatus = "CONVIDADO" | "CONFIRMADO" | "INDISPONIVEL" | "PARTICIPOU";

export type EccEncontro = {
  id: string; numero: number; nome: string; tema: string; lema: string; dataInicio: string; dataFim: string;
  prazoInscricao: string; local: string; capacidadeCasais: number; status: EccEncontroStatus; observacoes: string;
};

export type EccCasal = {
  id: string; conjugeUmNome: string; conjugeDoisNome: string; telefone: string; email: string;
  dataCasamento: string; voluntarioUmId: string; voluntarioDoisId: string; situacao: EccCasalSituacao; observacoes: string;
};

export type EccEquipe = {
  id: string; encontroId: string; voluntarioId: string; voluntarioNome: string; equipe: string; funcao: string;
  coordenador: boolean; status: EccEquipeStatus; observacoes: string;
};

export type EccPainel = { encontros: EccEncontro[]; casais: EccCasal[]; equipe: EccEquipe[]; voluntarios: Array<{ id: string; nome: string }> };
