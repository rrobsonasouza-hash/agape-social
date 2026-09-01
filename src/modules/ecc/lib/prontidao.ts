import type { EccPainel } from "../types/ecc.types";

export type NivelProntidao = "PRONTO" | "ATENCAO" | "CRITICO";
export type AbaPendenciaEcc = "equipes" | "visitas" | "arrecadacao" | "tarefas" | "circulos";
export type ItemProntidao = { id: string; titulo: string; descricao: string; nivel: NivelProntidao; quantidade: number; aba: AbaPendenciaEcc; detalhes: string[] };
export type DiagnosticoProntidao = { nivel: NivelProntidao; percentual: number; diasAteEncontro: number; itens: ItemProntidao[] };

function normalizar(valor: string) { return valor.trim().toLocaleLowerCase("pt-BR"); }
function nivelPendencia(quantidade: number, diasAte: number, criticoImediato = false): NivelProntidao {
  if (quantidade <= 0) return "PRONTO";
  return criticoImediato || diasAte <= 7 ? "CRITICO" : "ATENCAO";
}

export function calcularProntidaoEcc(dados: EccPainel, encontroId: string, agora = new Date()): DiagnosticoProntidao {
  const encontro = dados.encontros.find((item) => item.id === encontroId);
  const inicio = encontro ? new Date(`${encontro.dataInicio}T12:00:00`) : agora;
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 12);
  const diasAteEncontro = Math.ceil((inicio.getTime() - hoje.getTime()) / 86_400_000);
  const participacoes = dados.participacoes.filter((item) => item.encontroId === encontroId && item.situacao !== "DESISTENTE" && ["INDICADO", "ENCONTRISTA", "CONVIDADO", "VISITANTE"].includes(item.classificacao));
  const participantesOperacao = participacoes.filter((item) => ["INSCRITO", "CONFIRMADO", "PARTICIPOU"].includes(item.situacao));

  const equipes = dados.equipe.filter((item) => item.encontroId === encontroId);
  const gruposEquipe = [...new Set(equipes.map((item) => item.equipe).filter(Boolean))];
  const equipesIncompletas = gruposEquipe.filter((nome) => {
    const integrantes = equipes.filter((item) => item.equipe === nome);
    return !integrantes.some((item) => item.coordenador && ["CONFIRMADO", "PARTICIPOU"].includes(item.status)) || !integrantes.some((item) => ["CONFIRMADO", "PARTICIPOU"].includes(item.status));
  });
  const semEquipe = equipes.length === 0 ? 1 : equipesIncompletas.length;

  const visitasConcluidas = new Set(dados.visitas.filter((item) => item.encontroId === encontroId && item.status === "REALIZADA").map((item) => item.casalId));
  const visitasPendentes = participacoes.filter((item) => !visitasConcluidas.has(item.casalId));

  const necessidades = dados.necessidades.filter((item) => item.encontroId === encontroId && item.ativa);
  const arrecadacoes = dados.arrecadacoes.filter((item) => item.encontroId === encontroId && item.status !== "CANCELADO");
  const necessidadesPendentes = necessidades.filter((necessidade) => {
    const correspondentes = arrecadacoes.filter((item) => item.categoria === necessidade.categoria && normalizar(item.item) === normalizar(necessidade.item) && (necessidade.categoria === "VALOR" || normalizar(item.unidade) === normalizar(necessidade.unidade)));
    const necessario = necessidade.categoria === "VALOR" ? necessidade.valorNecessario : necessidade.quantidadeNecessaria;
    const recebido = correspondentes.reduce((total, item) => total + (necessidade.categoria === "VALOR" ? item.valorRecebido : item.quantidadeRecebida), 0);
    return recebido < necessario;
  });

  const tarefas = dados.tarefas.filter((item) => item.encontroId === encontroId && !["CONCLUIDA", "CANCELADA"].includes(item.status));
  const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  const atrasadas = tarefas.filter((item) => item.prazo && item.prazo < dataHoje);

  const circulos = new Set(dados.credenciamentos.filter((item) => item.encontroId === encontroId && item.circulo.trim()).map((item) => item.casalId));
  const semCirculo = participantesOperacao.filter((item) => !circulos.has(item.casalId));

  const itens: ItemProntidao[] = [
    { id: "equipes", titulo: "Equipes", descricao: equipes.length === 0 ? "Nenhuma equipe foi formada." : semEquipe ? `${semEquipe} equipe(s) sem coordenação confirmada.` : "Equipes formadas e com coordenação confirmada.", nivel: nivelPendencia(semEquipe, diasAteEncontro), quantidade: semEquipe, aba: "equipes", detalhes: equipes.length === 0 ? ["Forme as equipes e defina ao menos um coordenador confirmado."] : equipesIncompletas.slice(0, 5) },
    { id: "visitas", titulo: "Visitas dos casais", descricao: participacoes.length === 0 ? "Nenhum casal participante foi incluído." : visitasPendentes.length ? `${visitasPendentes.length} casal(is) ainda sem visita concluída.` : "Todas as visitas dos casais foram concluídas.", nivel: participacoes.length === 0 ? nivelPendencia(1, diasAteEncontro) : nivelPendencia(visitasPendentes.length, diasAteEncontro), quantidade: participacoes.length === 0 ? 1 : visitasPendentes.length, aba: "visitas", detalhes: visitasPendentes.slice(0, 5).map((item) => item.casalNome) },
    { id: "arrecadacao", titulo: "Arrecadações", descricao: necessidades.length === 0 ? "A lista do que o encontro precisa ainda não foi criada." : necessidadesPendentes.length ? `${necessidadesPendentes.length} item(ns) ainda não atingiram a quantidade necessária.` : "Todas as necessidades cadastradas foram atendidas.", nivel: necessidades.length === 0 ? nivelPendencia(1, diasAteEncontro) : nivelPendencia(necessidadesPendentes.length, diasAteEncontro), quantidade: necessidades.length === 0 ? 1 : necessidadesPendentes.length, aba: "arrecadacao", detalhes: necessidadesPendentes.slice(0, 5).map((item) => item.item) },
    { id: "tarefas", titulo: "Tarefas", descricao: atrasadas.length ? `${atrasadas.length} tarefa(s) estão atrasadas.` : tarefas.length ? `${tarefas.length} tarefa(s) ainda precisam ser concluídas.` : "Não existem tarefas pendentes.", nivel: atrasadas.length ? "CRITICO" : nivelPendencia(tarefas.length, diasAteEncontro), quantidade: atrasadas.length || tarefas.length, aba: "tarefas", detalhes: (atrasadas.length ? atrasadas : tarefas).slice(0, 5).map((item) => item.titulo) },
    { id: "circulos", titulo: "Círculos dos casais", descricao: participantesOperacao.length === 0 ? "A distribuição será avaliada quando houver casais inscritos ou confirmados." : semCirculo.length ? `${semCirculo.length} casal(is) ainda estão sem círculo.` : "Todos os casais estão distribuídos em círculos.", nivel: participantesOperacao.length === 0 ? nivelPendencia(1, diasAteEncontro) : nivelPendencia(semCirculo.length, diasAteEncontro), quantidade: participantesOperacao.length === 0 ? 1 : semCirculo.length, aba: "circulos", detalhes: semCirculo.slice(0, 5).map((item) => item.casalNome) },
  ];
  const prontos = itens.filter((item) => item.nivel === "PRONTO").length;
  const nivel: NivelProntidao = itens.some((item) => item.nivel === "CRITICO") ? "CRITICO" : itens.some((item) => item.nivel === "ATENCAO") ? "ATENCAO" : "PRONTO";
  return { nivel, percentual: Math.round((prontos / itens.length) * 100), diasAteEncontro, itens };
}
