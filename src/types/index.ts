/**
 * Tipos globais compartilhados entre módulos.
 * Tipos de domínio ficam em src/modules/<dominio>/types/.
 */

export type Resultado<T> =
  | { sucesso: true; dados: T }
  | { sucesso: false; erro: string };

export type Paginacao = {
  pagina: number;
  porPagina: number;
  total: number;
};

export type RespostaPaginada<T> = {
  itens: T[];
  paginacao: Paginacao;
};

export type EntidadeBase = {
  id: string;
  paroquiaId: string;
  criadoEm: string;
  atualizadoEm: string;
};
