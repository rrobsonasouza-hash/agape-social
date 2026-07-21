type EntradaDiagnostico={bancoDisponivel:boolean;ambiente?:string;commit?:string;verificadoEm?:string};

export function montarDiagnostico({bancoDisponivel,ambiente="desconhecido",commit="local",verificadoEm=new Date().toISOString()}:EntradaDiagnostico){
  return {status:bancoDisponivel?"ok":"indisponivel",servico:"agape-social",versao:"1.0.0",ambiente,publicacao:commit.slice(0,7),banco:bancoDisponivel?"disponivel":"indisponivel",verificadoEm};
}
