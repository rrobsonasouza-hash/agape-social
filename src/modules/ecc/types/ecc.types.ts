export type EccEncontroStatus = "PLANEJAMENTO" | "INSCRICOES" | "PREPARACAO" | "REALIZADO" | "ENCERRADO";
export type EccCasalSituacao = "ELEGIVEL" | "CONVIDADO" | "INSCRITO" | "CONFIRMADO" | "LISTA_ESPERA" | "DESISTENTE" | "PARTICIPOU";
export type EccEquipeStatus = "CONVIDADO" | "CONFIRMADO" | "INDISPONIVEL" | "PARTICIPOU";
export type EccParticipacaoSituacao = "CONVIDADO" | "INSCRITO" | "CONFIRMADO" | "LISTA_ESPERA" | "DESISTENTE" | "PARTICIPOU";
export type EccClassificacaoParticipacao = "INDICADO" | "ENCONTRISTA" | "CONVIDADO" | "VISITANTE" | "EQUIPE" | "COORDENADOR";
export type EccProgramacaoStatus = "PLANEJADA" | "CONFIRMADA" | "CONCLUIDA" | "CANCELADA";
export type EccTarefaStatus = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
export type EccVisitaStatus = "PENDENTE" | "AGENDADA" | "REALIZADA" | "RETORNO_NECESSARIO" | "CANCELADA";

export type EccEncontro = {
  id: string; numero: number; nome: string; tema: string; lema: string; dataInicio: string; dataFim: string;
  prazoInscricao: string; local: string; capacidadeCasais: number; status: EccEncontroStatus; observacoes: string;
};

export type EccCasal = {
  id: string; conjugeUmNome: string; conjugeDoisNome: string; telefone: string; email: string;
  dataCasamento: string; voluntarioUmId: string; voluntarioDoisId: string; situacao: EccCasalSituacao; observacoes: string;
  cep: string; logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string;
  latitude: number | null; longitude: number | null;
};

export type EccEquipe = {
  id: string; encontroId: string; voluntarioId: string; voluntarioNome: string; equipe: string; funcao: string;
  coordenador: boolean; status: EccEquipeStatus; observacoes: string;
};

export type EccParticipacao = {
  id: string; encontroId: string; casalId: string; casalNome: string; situacao: EccParticipacaoSituacao;
  classificacao: EccClassificacaoParticipacao;
  inscritoEm: string; observacoes: string;
};

export type EccProgramacao = {
  id: string; encontroId: string; titulo: string; descricao: string; data: string; horaInicio: string; horaFim: string;
  ambiente: string; equipe: string; responsavelVoluntarioId: string; responsavelNome: string;
  status: EccProgramacaoStatus; observacoes: string;
};

export type EccTarefa = {
  id: string; encontroId: string; titulo: string; descricao: string; equipe: string;
  responsavelVoluntarioId: string; responsavelNome: string; prazo: string; prioridade: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
  status: EccTarefaStatus; observacoes: string;
};

export type EccVoluntarioResumo = {
  id: string; nome: string; telefone: string; email: string; conjugeNome: string;
  cep: string; logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string;
  latitude: number | null; longitude: number | null;
};

export type EccVisita = {
  id: string; encontroId: string; casalId: string; casalNome: string;
  visitadorVoluntarioId: string; visitadorNome: string; dataAgendada: string; horaAgendada: string;
  dataRealizada: string; retornoData: string; status: EccVisitaStatus;
  questionario: {
    motivoParticipacao: string; expectativas: string; participacaoParoquial: string; filhosCuidados: string;
    restricoesAlimentares: string; necessidadesAcessibilidade: string; contatoEmergencia: string;
    observacoesPastorais: string; consentimentoInformacoes: boolean;
  };
  observacoes: string;
};

export type EccPainel = {
  encontros: EccEncontro[]; casais: EccCasal[]; participacoes: EccParticipacao[]; equipe: EccEquipe[];
  programacao: EccProgramacao[]; tarefas: EccTarefa[]; visitas: EccVisita[]; voluntarios: EccVoluntarioResumo[];
  paroquia: { nome: string; latitude: number | null; longitude: number | null };
  podeGerenciarVisitas: boolean;
};
