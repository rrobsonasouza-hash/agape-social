export type EccEncontroStatus = "PLANEJAMENTO" | "INSCRICOES" | "PREPARACAO" | "REALIZADO" | "ENCERRADO";
export type EccCasalSituacao = "ELEGIVEL" | "CONVIDADO" | "INSCRITO" | "CONFIRMADO" | "LISTA_ESPERA" | "DESISTENTE" | "PARTICIPOU";
export type EccEquipeStatus = "CONVIDADO" | "CONFIRMADO" | "INDISPONIVEL" | "PARTICIPOU";
export type EccParticipacaoSituacao = "CONVIDADO" | "INSCRITO" | "CONFIRMADO" | "LISTA_ESPERA" | "DESISTENTE" | "PARTICIPOU";
export type EccClassificacaoParticipacao = "INDICADO" | "ENCONTRISTA" | "CONVIDADO" | "VISITANTE" | "EQUIPE" | "COORDENADOR";
export type EccProgramacaoStatus = "PLANEJADA" | "CONFIRMADA" | "CONCLUIDA" | "CANCELADA";
export type EccTarefaStatus = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
export type EccVisitaStatus = "PENDENTE" | "AGENDADA" | "REALIZADA" | "RETORNO_NECESSARIO" | "CANCELADA";
export type EccComunicacaoStatus = "RASCUNHO" | "PROGRAMADA" | "ENVIADA" | "CANCELADA";
export type EccDocumentoStatus = "PENDENTE" | "DISPONIVEL" | "ARQUIVADO";
export type EccCredenciamentoStatus = "AGUARDANDO" | "CREDENCIADO" | "AUSENTE" | "CANCELADO";
export type EccArrecadacaoStatus = "PENDENTE" | "PARCIAL" | "RECEBIDO" | "CANCELADO";

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
  atuaEcc: boolean; funcaoEcc: string; status: string;
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

export type EccComunicacao = {
  id: string; encontroId: string; titulo: string; mensagem: string;
  canal: "WHATSAPP" | "EMAIL" | "AVISO"; publico: "TODOS" | "PARTICIPANTES" | "EQUIPE" | "COORDENACAO";
  status: EccComunicacaoStatus; programadaPara: string; enviadaEm: string; criadoEm: string;
};

export type EccDocumento = {
  id: string; encontroId: string; titulo: string;
  categoria: "FICHA" | "LISTA" | "ROTEIRO" | "TERMO" | "MATERIAL" | "OUTRO";
  url: string; caminhoStorage: string; nomeArquivo: string; tipoArquivo: string; tamanhoBytes: number;
  observacoes: string; status: EccDocumentoStatus; criadoEm: string;
};

export type EccCasalDoador = {
  id: string; nome: string; telefone: string;
};

export type EccCredenciamento = {
  id: string; encontroId: string; casalId: string; casalNome: string;
  status: EccCredenciamentoStatus; credenciadoEm: string; crachaEntregue: boolean;
  materialEntregue: boolean; observacoes: string;
};

export type EccArrecadacao = {
  id: string; encontroId: string; categoria: "ALIMENTO" | "BEBIDA" | "VALOR" | "OUTRO";
  item: string; responsavel: string; telefone: string; unidade: string;
  quantidadePrometida: number; quantidadeRecebida: number; valorPrometido: number; valorRecebido: number;
  status: EccArrecadacaoStatus; observacoes: string; criadoEm: string;
};

export type EccPainel = {
  encontros: EccEncontro[]; casais: EccCasal[]; participacoes: EccParticipacao[]; equipe: EccEquipe[];
  programacao: EccProgramacao[]; tarefas: EccTarefa[]; visitas: EccVisita[]; comunicacoes: EccComunicacao[];
  documentos: EccDocumento[]; credenciamentos: EccCredenciamento[]; arrecadacoes: EccArrecadacao[];
  voluntarios: EccVoluntarioResumo[]; casaisDoadores: EccCasalDoador[];
  paroquia: { nome: string; latitude: number | null; longitude: number | null };
  podeGerenciarVisitas: boolean;
};
