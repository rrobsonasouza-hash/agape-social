"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  CalendarDays, ClipboardCheck, Clock3, HeartHandshake, House, ListTodo,
  MapPin, Plus, RefreshCw, Search, Users, BarChart3, BadgeCheck, ShoppingCart,
} from "lucide-react";
import toast from "react-hot-toast";
import { MapaEcc, type PontoCasalEcc } from "@/components/maps/MapaEcc";
import { VisitasEccSection } from "@/modules/ecc/components/VisitasEccSection";
import { GestaoEccSection } from "@/modules/ecc/components/GestaoEccSection";
import { CredenciamentoEccSection } from "@/modules/ecc/components/CredenciamentoEccSection";
import { ArrecadacaoEccSection } from "@/modules/ecc/components/ArrecadacaoEccSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { calcularDistanciaKm } from "@/lib/geo/distance";
import { EnderecoService } from "@/modules/enderecos/services/endereco.service";
import { useEcc } from "@/modules/ecc/hooks/useEcc";
import type {
  EccCasalFormData, EccEncontroFormData, EccEquipeFormData, EccProgramacaoFormData,
  EccTarefaFormData, EccVinculoCasalFormData, EccNovoVoluntarioFormData,
} from "@/modules/ecc/schemas/ecc.schema";
import type {
  EccClassificacaoParticipacao, EccPainel, EccParticipacaoSituacao, EccProgramacaoStatus, EccTarefaStatus,
} from "@/modules/ecc/types/ecc.types";

const hoje = new Date().toISOString().slice(0, 10);
const enderecoService = new EnderecoService();
const vazio: EccPainel = {
  encontros: [], casais: [], participacoes: [], equipe: [], programacao: [], tarefas: [], visitas: [], comunicacoes: [], documentos: [], credenciamentos: [], arrecadacoes: [], voluntarios: [], casaisDoadores: [],
  paroquia: { nome: "Paróquia", latitude: null, longitude: null },
  podeGerenciarVisitas: false,
};
const encontroInicial: EccEncontroFormData = {
  numero: 1, nome: "Encontro de Casais com Cristo", tema: "", lema: "", dataInicio: hoje,
  dataFim: hoje, prazoInscricao: "", local: "", capacidadeCasais: 0, status: "PLANEJAMENTO", observacoes: "",
};
const casalInicial: EccCasalFormData = {
  conjugeUmNome: "", conjugeDoisNome: "", telefone: "", email: "", dataCasamento: "", encontroId: "",
  voluntarioUmId: "", voluntarioDoisId: "", cep: "", logradouro: "", numero: "", complemento: "",
  bairro: "", cidade: "", estado: "", latitude: null, longitude: null, situacao: "ELEGIVEL", observacoes: "",
  classificacaoEncontro: "INDICADO",
};
const equipeInicial: EccEquipeFormData = {
  encontroId: "", voluntarioId: "", equipe: "", funcao: "Voluntário", coordenador: false,
  status: "CONVIDADO", observacoes: "",
};
const programacaoInicial: EccProgramacaoFormData = {
  encontroId: "", titulo: "", descricao: "", data: hoje, horaInicio: "08:00", horaFim: "",
  ambiente: "", equipe: "", responsavelVoluntarioId: "", status: "PLANEJADA", observacoes: "",
};
const tarefaInicial: EccTarefaFormData = {
  encontroId: "", titulo: "", descricao: "", equipe: "", responsavelVoluntarioId: "", prazo: "",
  prioridade: "MEDIA", status: "PENDENTE", observacoes: "",
};
const novoVoluntarioInicial: EccNovoVoluntarioFormData = { casalId: "", posicao: "UM", cpf: "", telefone: "", email: "", pastoral: "ECC", funcao: "Voluntário", dataIngresso: hoje };

const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const label = "grid gap-1 text-sm font-semibold text-slate-700";
const botao = "rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50";
const encontroStatus: Record<string, string> = { PLANEJAMENTO: "Planejamento", INSCRICOES: "Inscrições", PREPARACAO: "Preparação", REALIZADO: "Realizado", ENCERRADO: "Encerrado" };
const participacaoStatus: Record<EccParticipacaoSituacao, string> = { CONVIDADO: "Convidado", INSCRITO: "Inscrito", CONFIRMADO: "Confirmado", LISTA_ESPERA: "Lista de espera", DESISTENTE: "Desistente", PARTICIPOU: "Participou" };
const classificacaoParticipacao: Record<EccClassificacaoParticipacao, string> = { INDICADO: "Casal indicado", ENCONTRISTA: "Casal encontrista", CONVIDADO: "Casal convidado", VISITANTE: "Casal visitante", EQUIPE: "Casal de equipe", COORDENADOR: "Casal coordenador" };
const papeisParticipantes: EccClassificacaoParticipacao[] = ["INDICADO", "CONVIDADO", "ENCONTRISTA", "VISITANTE"];
const papeisServico: EccClassificacaoParticipacao[] = ["EQUIPE", "COORDENADOR"];
const programacaoStatus: Record<EccProgramacaoStatus, string> = { PLANEJADA: "Planejada", CONFIRMADA: "Confirmada", CONCLUIDA: "Concluída", CANCELADA: "Cancelada" };
const tarefaStatus: Record<EccTarefaStatus, string> = { PENDENTE: "Pendente", EM_ANDAMENTO: "Em andamento", CONCLUIDA: "Concluída", CANCELADA: "Cancelada" };
const equipesEcc = [
  ["Equipe Dirigente", "Coordenação e articulação geral do encontro"],
  ["Equipe de Sala / Apresentadores", "Programa, palestras e cumprimento do cronograma"],
  ["Equipe de Círculos de Estudo", "Debates e reflexões com os casais encontristas"],
  ["Equipe de Cafezinho / Mini-mercado", "Lanches, pausas e acolhida nos intervalos"],
  ["Equipe de Cozinha / Alimentação", "Preparação e organização das refeições"],
  ["Equipe de Liturgia e Vigília", "Orações, celebrações, missas e vigílias"],
  ["Equipe de Ordem e Limpeza", "Organização, apoio e higiene do local"],
  ["Equipe de Canto / Boa Vontade", "Louvor, animação e recepção dos participantes"],
  ["Secretaria", "Impressões, crachás de mesa e apoio documental"],
] as const;

function Metrica({ icon: Icon, titulo, valor, apoio }: { icon: typeof Users; titulo: string; valor: number; apoio: string }) {
  return <article className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon size={22} /></span><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">{titulo}</p><strong className="text-3xl text-slate-900">{valor}</strong></div></div><p className="mt-3 text-sm text-slate-500">{apoio}</p></article>;
}

export default function EccPage() {
  const { listar, criarEncontro, criarCasal, atualizarCasal, vincularCasal: vincularCasalApi, adicionarEquipe,
    criarProgramacao, criarTarefa, cadastrarConjugeComoVoluntario, atualizarParticipacao, atualizarProgramacao, atualizarTarefa } = useEcc();
  const [dados, setDados] = useState(vazio);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState("");
  const [aba, setAba] = useState<"secretaria" | "visitas" | "mapa" | "cronograma" | "tarefas" | "equipes" | "credenciamento" | "arrecadacao" | "gestao">("secretaria");
  const [formulario, setFormulario] = useState<"encontro" | "casal" | "equipe" | "programacao" | "tarefa" | "voluntario" | null>(null);
  const [encontroId, setEncontroId] = useState("");
  const [encontro, setEncontro] = useState(encontroInicial);
  const [casal, setCasal] = useState(casalInicial);
  const [equipe, setEquipe] = useState(equipeInicial);
  const [programacao, setProgramacao] = useState(programacaoInicial);
  const [tarefa, setTarefa] = useState(tarefaInicial);
  const [novoVoluntario, setNovoVoluntario] = useState(novoVoluntarioInicial);
  const [casalParaVinculo, setCasalParaVinculo] = useState("");
  const [classificacaoParaVinculo, setClassificacaoParaVinculo] = useState<EccClassificacaoParticipacao>("ENCONTRISTA");
  const [busca, setBusca] = useState("");
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [casalEmEdicao, setCasalEmEdicao] = useState("");
  const formularioRef = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resposta = await listar();
      setDados(resposta);
      setEncontroId((atual) => atual || resposta.encontros.find((item) => !["REALIZADO", "ENCERRADO"].includes(item.status))?.id || resposta.encontros[0]?.id || "");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível carregar o ECC."); }
    finally { setCarregando(false); }
  }, [listar]);

  useEffect(() => { void carregar(); }, [carregar]);
  useEffect(() => {
    if (!formulario) return;
    const quadro = window.requestAnimationFrame(() => formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(quadro);
  }, [formulario]);
  useEffect(() => {
    if (!encontroId) return;
    setCasal((atual) => ({ ...atual, encontroId: atual.encontroId || encontroId }));
    setEquipe((atual) => ({ ...atual, encontroId }));
    setProgramacao((atual) => ({ ...atual, encontroId }));
    setTarefa((atual) => ({ ...atual, encontroId }));
  }, [encontroId]);

  useEffect(() => {
    const primeiro = dados.voluntarios.find((item) => item.id === casal.voluntarioUmId);
    const segundo = dados.voluntarios.find((item) => item.id === casal.voluntarioDoisId);
    if (!primeiro && !segundo) return;
    setCasal((atual) => {
      const referencia = primeiro ?? segundo!;
      const proximo = {
        ...atual,
        conjugeUmNome: primeiro?.nome ?? atual.conjugeUmNome,
        conjugeDoisNome: segundo?.nome ?? (primeiro?.conjugeNome || atual.conjugeDoisNome),
        telefone: atual.telefone || referencia.telefone,
        email: atual.email || referencia.email,
        cep: atual.cep || referencia.cep,
        logradouro: atual.logradouro || referencia.logradouro,
        numero: atual.numero || referencia.numero,
        complemento: atual.complemento || referencia.complemento,
        bairro: atual.bairro || referencia.bairro,
        cidade: atual.cidade || referencia.cidade,
        estado: atual.estado || referencia.estado,
        latitude: atual.latitude ?? referencia.latitude,
        longitude: atual.longitude ?? referencia.longitude,
      };
      return JSON.stringify(proximo) === JSON.stringify(atual) ? atual : proximo;
    });
  }, [casal.voluntarioUmId, casal.voluntarioDoisId, dados.voluntarios]);

  const edicao = dados.encontros.find((item) => item.id === encontroId);
  const participacoes = useMemo(() => dados.participacoes.filter((item) => item.encontroId === encontroId), [dados.participacoes, encontroId]);
  const idsCasais = useMemo(() => new Set(participacoes.map((item) => item.casalId)), [participacoes]);
  const casaisDisponiveis = dados.casais.filter((item) => !idsCasais.has(item.id));
  const equipes = dados.equipe.filter((item) => item.encontroId === encontroId);
  const agenda = dados.programacao.filter((item) => item.encontroId === encontroId);
  const tarefas = dados.tarefas.filter((item) => item.encontroId === encontroId);

  const pontos = useMemo<PontoCasalEcc[]>(() => {
    const origem = dados.paroquia;
    if (origem.latitude === null || origem.longitude === null) return [];
    return participacoes.flatMap((participacao) => {
      const registro = dados.casais.find((item) => item.id === participacao.casalId);
      if (!registro || registro.latitude === null || registro.longitude === null) return [];
      return [{
        id: registro.id, nome: participacao.casalNome,
        endereco: [registro.logradouro, registro.numero, registro.bairro, registro.cidade, registro.estado].filter(Boolean).join(", "),
        latitude: registro.latitude, longitude: registro.longitude,
        distanciaKm: calcularDistanciaKm({ latitude: origem.latitude!, longitude: origem.longitude! }, { latitude: registro.latitude, longitude: registro.longitude }),
      }];
    }).sort((a, b) => a.distanciaKm - b.distanciaKm);
  }, [dados.casais, dados.paroquia, participacoes]);
  const semCoordenadas = participacoes.filter((item) => !pontos.some((ponto) => ponto.id === item.casalId));
  const tarefasPendentes = tarefas.filter((item) => !["CONCLUIDA", "CANCELADA"].includes(item.status));

  async function executar(chave: string, acao: () => Promise<unknown>, mensagem = "Registro salvo com sucesso.") {
    setSalvando(chave);
    try { await acao(); toast.success(mensagem); setFormulario(null); await carregar(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setSalvando(""); }
  }
  async function consultarCep() {
    if (casal.cep.replace(/\D/g, "").length !== 8) return toast.error("Informe um CEP válido.");
    setConsultandoCep(true);
    try {
      const endereco = await enderecoService.buscarPorCep(casal.cep);
      setCasal((atual) => ({ ...atual, cep: endereco.cep, logradouro: endereco.logradouro, complemento: endereco.complemento, bairro: endereco.bairro, cidade: endereco.cidade, estado: endereco.estado, latitude: endereco.latitude ?? null, longitude: endereco.longitude ?? null }));
      toast.success(endereco.latitude !== undefined ? "Endereço e localização encontrados." : "Endereço encontrado, mas sem coordenadas para o mapa.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível localizar o CEP."); }
    finally { setConsultandoCep(false); }
  }

  function salvarEncontro(event: FormEvent) { event.preventDefault(); void executar("encontro", () => criarEncontro(encontro)); }
  function salvarCasal(event: FormEvent) { event.preventDefault(); void executar("casal", () => casalEmEdicao ? atualizarCasal(casalEmEdicao, casal) : criarCasal(casal), casalEmEdicao ? "Cadastro e localização do casal atualizados." : "Casal cadastrado e localizado no ECC."); }
  function salvarEquipe(event: FormEvent) { event.preventDefault(); void executar("equipe", () => adicionarEquipe(equipe)); }
  function salvarProgramacao(event: FormEvent) { event.preventDefault(); void executar("programacao", () => criarProgramacao(programacao)); }
  function salvarTarefa(event: FormEvent) { event.preventDefault(); void executar("tarefa", () => criarTarefa(tarefa)); }
  function salvarNovoVoluntario(event: FormEvent) { event.preventDefault(); void executar("voluntario", () => cadastrarConjugeComoVoluntario(novoVoluntario), "Cônjuge cadastrado e vinculado como voluntário."); }
  function abrirCadastroVoluntario(casalId: string, posicao: "UM" | "DOIS") {
    const registro = dados.casais.find((item) => item.id === casalId);
    if (!registro) return;
    setNovoVoluntario({ ...novoVoluntarioInicial, casalId, posicao, telefone: registro.telefone, email: registro.email });
    setFormulario("voluntario");
  }
  function vincularCasal() {
    if (!casalParaVinculo || !encontroId) return;
    const entrada: EccVinculoCasalFormData = { casalId: casalParaVinculo, encontroId, situacao: "INSCRITO", classificacao: classificacaoParaVinculo, observacoes: "" };
    void executar("vinculo", () => vincularCasalApi(entrada), "Casal incluído nesta edição.");
  }
  function editarCasal(id: string) {
    const registro = dados.casais.find((item) => item.id === id);
    if (!registro) return;
    setCasalEmEdicao(id);
    setCasal({ ...registro, encontroId: "", classificacaoEncontro: "INDICADO" });
    setFormulario("casal");
  }

  return <main className="mx-auto w-full min-w-0 max-w-7xl space-y-6">
    <PageHeader title="ECC" description="Organize casais, equipes, cronograma e tarefas do Encontro de Casais com Cristo." actions={<button onClick={() => void carregar()} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-bold"><RefreshCw size={17} />Atualizar</button>} />

    <section className="rounded-2xl bg-gradient-to-r from-blue-900 to-blue-600 p-6 text-white shadow-lg">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-black tracking-[.18em] text-blue-100">EDIÇÃO EM ACOMPANHAMENTO</p><h2 className="mt-2 text-2xl font-black">{edicao ? `${edicao.numero}º ECC · ${edicao.nome}` : "Cadastre a primeira edição"}</h2><p className="mt-2 text-sm text-blue-100">{edicao ? `${encontroStatus[edicao.status]} · ${edicao.tema || "Tema não informado"}` : "O painel será organizado por edição."}</p></div><button onClick={() => setFormulario("encontro")} className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-blue-700"><Plus size={16} className="mr-2 inline" />Nova edição</button></div>
      {!!dados.encontros.length && <label className="mt-5 block max-w-xl text-sm font-bold">Edição selecionada<select value={encontroId} onChange={(event) => setEncontroId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/30 bg-white px-3 py-3 text-slate-900">{dados.encontros.map((item) => <option key={item.id} value={item.id}>{item.numero}º ECC · {item.nome} · {encontroStatus[item.status]}</option>)}</select></label>}
    </section>

    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Metrica icon={Users} titulo="Casais" valor={participacoes.length} apoio={`${participacoes.filter((i) => i.situacao === "CONFIRMADO").length} confirmado(s)`} />
      <Metrica icon={MapPin} titulo="No mapa" valor={pontos.length} apoio={`${semCoordenadas.length} pendência(s) de endereço`} />
      <Metrica icon={HeartHandshake} titulo="Equipe" valor={equipes.length} apoio="Voluntários nesta edição" />
      <Metrica icon={CalendarDays} titulo="Atividades" valor={agenda.length} apoio="Itens no cronograma" />
      <Metrica icon={ListTodo} titulo="Pendências" valor={tarefasPendentes.length} apoio="Tarefas a concluir" />
    </section>

    <nav className="grid max-w-full grid-cols-2 gap-2 rounded-2xl border bg-white p-2 shadow-sm sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-9">{[
      ["secretaria", "Secretaria", Users], ["visitas", "Visitas", House], ["mapa", "Mapa e distâncias", MapPin], ["cronograma", "Cronograma", Clock3], ["tarefas", "Tarefas", ClipboardCheck], ["equipes", "Equipes", HeartHandshake], ["credenciamento", "Credenciamento", BadgeCheck], ["arrecadacao", "Compras e doações", ShoppingCart], ["gestao", "Gestão e relatórios", BarChart3],
    ].filter(([valor]) => valor !== "visitas" || dados.podeGerenciarVisitas).map(([valor, nome, Icon]) => <button key={String(valor)} onClick={() => { setAba(valor as typeof aba); setFormulario(null); setCasalEmEdicao(""); }} className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-sm font-black leading-tight ${aba === valor ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}><Icon className="shrink-0" size={17} /><span className="min-w-0">{String(nome)}</span></button>)}</nav>

    {aba === "secretaria" && participacoes.length > 0 && <section className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-sm font-black text-slate-900">Papel do casal nesta edição</p><p className="mt-1 text-xs text-slate-500">O casal possui um único papel por edição: participa do encontro ou trabalha nele. O histórico dos demais encontros é preservado.</p><div className="mt-3 grid gap-2 md:grid-cols-2">{participacoes.map((item) => { const registro = dados.casais.find((casalItem) => casalItem.id === item.casalId); const servico = papeisServico.includes(item.classificacao); const vinculoIncompleto = servico && registro && (!registro.voluntarioUmId || !registro.voluntarioDoisId); return <div key={item.id} className={`rounded-xl p-3 ${servico ? "bg-amber-50" : "bg-blue-50/60"}`}><div className="flex flex-wrap items-center justify-between gap-2"><div><strong className="text-sm">{item.casalNome}</strong><p className={`mt-1 text-xs font-bold ${servico ? "text-amber-800" : "text-blue-700"}`}>{servico ? "Trabalha no encontro" : "Participa do encontro"}{vinculoIncompleto ? " · cadastro de voluntários pendente" : ""}</p></div><div className="flex gap-2"><select value={item.classificacao} onChange={(e) => void executar(`classificacao-${item.id}`, () => atualizarParticipacao(item.id, { situacao: item.situacao, classificacao: e.target.value as EccClassificacaoParticipacao, observacoes: item.observacoes }), "Papel do casal atualizado nesta edição.")} className="rounded-lg border bg-white px-2 py-2 text-xs font-bold"><optgroup label="Participará do encontro">{papeisParticipantes.map((valor) => <option key={valor} value={valor}>{classificacaoParticipacao[valor]}</option>)}</optgroup><optgroup label="Trabalhará no encontro">{papeisServico.map((valor) => <option key={valor} value={valor}>{classificacaoParticipacao[valor]}</option>)}</optgroup></select><button type="button" onClick={() => editarCasal(item.casalId)} className="rounded-lg border bg-white px-3 py-2 text-xs font-bold text-blue-700">Cadastro</button></div></div></div>; })}</div></section>}

    {aba === "secretaria" && participacoes.some((item) => { const registro = dados.casais.find((casalItem) => casalItem.id === item.casalId); return papeisServico.includes(item.classificacao) && registro && (!registro.voluntarioUmId || !registro.voluntarioDoisId); }) && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4"><h2 className="font-black text-amber-950">Concluir cadastro da equipe no Voluntariado</h2><p className="mt-1 text-sm text-amber-800">Estes casais trabalharão no encontro. Por isso, cada cônjuge precisa estar cadastrado e vinculado como voluntário do ECC.</p><div className="mt-3 grid gap-2 md:grid-cols-2">{participacoes.map((item) => { const registro = dados.casais.find((casalItem) => casalItem.id === item.casalId); if (!papeisServico.includes(item.classificacao) || !registro || (registro.voluntarioUmId && registro.voluntarioDoisId)) return null; return <div key={item.id} className="rounded-xl bg-white p-3"><strong className="text-sm">{item.casalNome}</strong><p className="mt-1 text-xs font-bold text-amber-700">{classificacaoParticipacao[item.classificacao]} · vínculo pendente</p><div className="mt-2 flex flex-wrap gap-2">{!registro.voluntarioUmId && <button type="button" onClick={() => abrirCadastroVoluntario(registro.id, "UM")} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">Cadastrar {registro.conjugeUmNome}</button>}{!registro.voluntarioDoisId && <button type="button" onClick={() => abrirCadastroVoluntario(registro.id, "DOIS")} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">Cadastrar {registro.conjugeDoisNome}</button>}</div></div>; })}</div></section>}

    {aba === "secretaria" && <section className="grid gap-4 md:grid-cols-2">
      <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <span className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">Participará do encontro</span>
        <h2 className="mt-3 text-xl font-black text-slate-950">Casal encontrista</h2>
        <p className="mt-2 text-sm text-slate-600">Cadastre aqui casais indicados, convidados, encontristas ou visitantes. Eles ficam no banco do ECC e não se tornam voluntários automaticamente.</p>
        <button type="button" onClick={() => { setCasalEmEdicao(""); setCasal({ ...casalInicial, encontroId, classificacaoEncontro: "INDICADO" }); setFormulario("casal"); }} className={`${botao} mt-4`}><Plus size={16} className="mr-2 inline" />Cadastrar casal participante</button>
      </article>
      <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <span className="inline-flex rounded-full bg-amber-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">Trabalhará no encontro</span>
        <h2 className="mt-3 text-xl font-black text-slate-950">Casal de equipe ou coordenação</h2>
        <p className="mt-2 text-sm text-slate-600">Cadastre ou complete primeiro os dois cônjuges em Voluntários. Depois, inclua o casal nesta edição e escolha Equipe ou Coordenação.</p>
        <Link href="/voluntarios/novo" className="mt-4 inline-flex rounded-xl border border-amber-400 bg-white px-5 py-3 text-sm font-black text-amber-900">Abrir cadastro de Voluntários</Link>
      </article>
    </section>}

    <div ref={formularioRef} className="scroll-mt-4 flex flex-wrap gap-2">
      {aba === "cronograma" && <button onClick={() => setFormulario("programacao")} className={botao}><Plus size={16} className="mr-2 inline" />Nova atividade</button>}
      {aba === "tarefas" && <button onClick={() => setFormulario("tarefa")} className={botao}><Plus size={16} className="mr-2 inline" />Nova tarefa</button>}
      {aba === "equipes" && <button onClick={() => setFormulario("equipe")} className={botao}><Plus size={16} className="mr-2 inline" />Adicionar voluntário</button>}
    </div>

    {formulario && <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black text-slate-900">{formulario === "encontro" ? "Nova edição" : formulario === "casal" ? "Cadastro do casal" : formulario === "equipe" ? "Equipe de trabalho" : formulario === "programacao" ? "Atividade do cronograma" : formulario === "voluntario" ? "Cadastrar cônjuge como voluntário" : "Tarefa da edição"}</h2><button onClick={() => setFormulario(null)} className="text-sm font-bold text-slate-600">Fechar</button></div>
      {formulario === "voluntario" && <form onSubmit={salvarNovoVoluntario} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><div className="rounded-xl bg-white p-4 md:col-span-2 lg:col-span-3"><strong>{novoVoluntario.posicao === "UM" ? dados.casais.find((item) => item.id === novoVoluntario.casalId)?.conjugeUmNome : dados.casais.find((item) => item.id === novoVoluntario.casalId)?.conjugeDoisNome}</strong><p className="text-sm text-slate-500">O endereço e o nome do cônjuge serão reaproveitados do cadastro do casal.</p></div><label className={label}>CPF<input required className={campo} value={novoVoluntario.cpf} onChange={(e) => setNovoVoluntario({ ...novoVoluntario, cpf: e.target.value })} /></label><label className={label}>Telefone<input required className={campo} value={novoVoluntario.telefone} onChange={(e) => setNovoVoluntario({ ...novoVoluntario, telefone: e.target.value })} /></label><label className={label}>E-mail<input type="email" className={campo} value={novoVoluntario.email} onChange={(e) => setNovoVoluntario({ ...novoVoluntario, email: e.target.value })} /></label><label className={label}>Pastoral ou área<input required className={campo} value={novoVoluntario.pastoral} onChange={(e) => setNovoVoluntario({ ...novoVoluntario, pastoral: e.target.value })} /></label><label className={label}>Função<input required className={campo} value={novoVoluntario.funcao} onChange={(e) => setNovoVoluntario({ ...novoVoluntario, funcao: e.target.value })} /></label><label className={label}>Data de ingresso<input type="date" className={campo} value={novoVoluntario.dataIngresso} onChange={(e) => setNovoVoluntario({ ...novoVoluntario, dataIngresso: e.target.value })} /></label><button disabled={salvando === "voluntario"} className={botao}>Cadastrar e vincular</button></form>}
      {formulario === "encontro" && <form onSubmit={salvarEncontro} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><label className={label}>Número<input className={campo} type="number" min="1" value={encontro.numero} onChange={(e) => setEncontro({ ...encontro, numero: Number(e.target.value) })} /></label><label className={`${label} lg:col-span-2`}>Nome<input className={campo} value={encontro.nome} onChange={(e) => setEncontro({ ...encontro, nome: e.target.value })} /></label><label className={label}>Situação<select className={campo} value={encontro.status} onChange={(e) => setEncontro({ ...encontro, status: e.target.value as EccEncontroFormData["status"] })}>{Object.entries(encontroStatus).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label><label className={`${label} md:col-span-2`}>Tema<input className={campo} value={encontro.tema} onChange={(e) => setEncontro({ ...encontro, tema: e.target.value })} /></label><label className={label}>Início<input className={campo} type="date" value={encontro.dataInicio} onChange={(e) => setEncontro({ ...encontro, dataInicio: e.target.value })} /></label><label className={label}>Término<input className={campo} type="date" value={encontro.dataFim} onChange={(e) => setEncontro({ ...encontro, dataFim: e.target.value })} /></label><label className={`${label} md:col-span-2 lg:col-span-3`}>Local<input className={campo} value={encontro.local} onChange={(e) => setEncontro({ ...encontro, local: e.target.value })} /></label><button disabled={salvando === "encontro"} className={botao}>Criar edição</button></form>}
      {formulario === "casal" && <form onSubmit={salvarCasal} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-blue-200 bg-white p-4 md:col-span-2 lg:col-span-3">
          <strong className="text-blue-900">Cadastro de casal participante</strong>
          <p className="mt-1 text-sm text-slate-600">Este fluxo não cria voluntários. Para casal de equipe ou coordenação, utilize primeiro o cadastro de Voluntários.</p>
        </div>
        <label className={label}>Primeiro cônjuge<input required className={campo} value={casal.conjugeUmNome} onChange={(e) => setCasal({ ...casal, conjugeUmNome: e.target.value })} /></label>
        <label className={label}>Segundo cônjuge<input required className={campo} value={casal.conjugeDoisNome} onChange={(e) => setCasal({ ...casal, conjugeDoisNome: e.target.value })} /></label>
        <label className={label}>Telefone<input className={campo} value={casal.telefone} onChange={(e) => setCasal({ ...casal, telefone: e.target.value })} /></label>
        <label className={label}>Vínculo existente do primeiro cônjuge<select className={campo} value={casal.voluntarioUmId} onChange={(e) => setCasal({ ...casal, voluntarioUmId: e.target.value })}><option value="">Não é voluntário</option>{dados.voluntarios.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select></label>
        <label className={label}>Vínculo existente do segundo cônjuge<select className={campo} value={casal.voluntarioDoisId} onChange={(e) => setCasal({ ...casal, voluntarioDoisId: e.target.value })}><option value="">Não é voluntário</option>{dados.voluntarios.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select></label>
        <label className={label}>Edição<select className={campo} value={casal.encontroId} onChange={(e) => setCasal({ ...casal, encontroId: e.target.value })}><option value="">Somente banco de casais</option>{dados.encontros.map((i) => <option key={i.id} value={i.id}>{i.numero}º ECC</option>)}</select></label>
        {casal.encontroId && <label className={label}>Papel de participação nesta edição<select className={campo} value={casal.classificacaoEncontro} onChange={(e) => setCasal({ ...casal, classificacaoEncontro: e.target.value as EccCasalFormData["classificacaoEncontro"] })}>{papeisParticipantes.map((valor) => <option key={valor} value={valor}>{classificacaoParticipacao[valor]}</option>)}</select><span className="text-xs font-normal text-slate-500">Equipe e coordenação são definidas pelo fluxo de Voluntários.</span></label>}
        <div className="border-t pt-4 md:col-span-2 lg:col-span-3"><h3 className="font-black">Endereço para o mapa</h3></div>
        <label className={label}>CEP<div className="flex gap-2"><input className={campo} value={casal.cep} onChange={(e) => setCasal({ ...casal, cep: e.target.value })} /><button type="button" onClick={() => void consultarCep()} disabled={consultandoCep} className="rounded-xl border bg-white px-3 text-blue-700"><Search size={18} /></button></div></label>
        <label className={`${label} md:col-span-2`}>Logradouro<input className={campo} value={casal.logradouro} onChange={(e) => setCasal({ ...casal, logradouro: e.target.value })} /></label>
        <label className={label}>Número<input className={campo} value={casal.numero} onChange={(e) => setCasal({ ...casal, numero: e.target.value })} /></label>
        <label className={label}>Bairro<input className={campo} value={casal.bairro} onChange={(e) => setCasal({ ...casal, bairro: e.target.value })} /></label>
        <label className={label}>Cidade / UF<div className="grid grid-cols-[1fr_70px] gap-2"><input className={campo} value={casal.cidade} onChange={(e) => setCasal({ ...casal, cidade: e.target.value })} /><input className={campo} maxLength={2} value={casal.estado} onChange={(e) => setCasal({ ...casal, estado: e.target.value.toUpperCase() })} /></div></label>
        <button disabled={salvando === "casal"} className={botao}>{casalEmEdicao ? "Salvar cadastro" : "Cadastrar casal participante"}</button>
      </form>}
      {formulario === "equipe" && <form onSubmit={salvarEquipe} className="grid gap-4 md:grid-cols-3"><label className={label}>Voluntário do ECC<select required className={campo} value={equipe.voluntarioId} onChange={(e) => { const selecionado = dados.voluntarios.find((item) => item.id === e.target.value); setEquipe({ ...equipe, voluntarioId: e.target.value, funcao: selecionado?.funcaoEcc || equipe.funcao }); }}><option value="">Selecione</option>{dados.voluntarios.map((v) => <option key={v.id} value={v.id}>{v.nome} · {v.funcaoEcc}</option>)}</select></label><label className={label}>Equipe<select required className={campo} value={equipe.equipe} onChange={(e) => setEquipe({ ...equipe, equipe: e.target.value })}><option value="">Selecione a equipe</option>{equipesEcc.map(([nome, descricao]) => <option key={nome} value={nome}>{nome} — {descricao}</option>)}</select></label><label className={label}>Função<input required className={campo} value={equipe.funcao} onChange={(e) => setEquipe({ ...equipe, funcao: e.target.value })} /></label><label className={label}><span className="mt-4 flex gap-2"><input type="checkbox" checked={equipe.coordenador} onChange={(e) => setEquipe({ ...equipe, coordenador: e.target.checked })} />Coordena a equipe</span></label><button disabled={salvando === "equipe"} className={botao}>Adicionar</button></form>}
      {formulario === "programacao" && <form onSubmit={salvarProgramacao} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><label className={`${label} md:col-span-2`}>Atividade<input required className={campo} value={programacao.titulo} onChange={(e) => setProgramacao({ ...programacao, titulo: e.target.value })} /></label><label className={label}>Data<input required className={campo} type="date" value={programacao.data} onChange={(e) => setProgramacao({ ...programacao, data: e.target.value })} /></label><label className={label}>Horário<div className="grid grid-cols-2 gap-2"><input required className={campo} type="time" value={programacao.horaInicio} onChange={(e) => setProgramacao({ ...programacao, horaInicio: e.target.value })} /><input className={campo} type="time" value={programacao.horaFim} onChange={(e) => setProgramacao({ ...programacao, horaFim: e.target.value })} /></div></label><label className={label}>Ambiente<input className={campo} value={programacao.ambiente} onChange={(e) => setProgramacao({ ...programacao, ambiente: e.target.value })} /></label><label className={label}>Equipe<select className={campo} value={programacao.equipe} onChange={(e) => setProgramacao({ ...programacao, equipe: e.target.value })}><option value="">Sem equipe definida</option>{equipesEcc.map(([nome]) => <option key={nome} value={nome}>{nome}</option>)}</select></label><label className={label}>Responsável<select className={campo} value={programacao.responsavelVoluntarioId} onChange={(e) => setProgramacao({ ...programacao, responsavelVoluntarioId: e.target.value })}><option value="">Não definido</option>{dados.voluntarios.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select></label><button disabled={salvando === "programacao"} className={botao}>Salvar atividade</button></form>}
      {formulario === "tarefa" && <form onSubmit={salvarTarefa} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><label className={`${label} md:col-span-2`}>Tarefa<input required className={campo} value={tarefa.titulo} onChange={(e) => setTarefa({ ...tarefa, titulo: e.target.value })} /></label><label className={label}>Equipe<select className={campo} value={tarefa.equipe} onChange={(e) => setTarefa({ ...tarefa, equipe: e.target.value })}><option value="">Sem equipe definida</option>{equipesEcc.map(([nome]) => <option key={nome} value={nome}>{nome}</option>)}</select></label><label className={label}>Prazo<input className={campo} type="date" value={tarefa.prazo} onChange={(e) => setTarefa({ ...tarefa, prazo: e.target.value })} /></label><label className={label}>Responsável<select className={campo} value={tarefa.responsavelVoluntarioId} onChange={(e) => setTarefa({ ...tarefa, responsavelVoluntarioId: e.target.value })}><option value="">Não definido</option>{dados.voluntarios.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select></label><label className={label}>Prioridade<select className={campo} value={tarefa.prioridade} onChange={(e) => setTarefa({ ...tarefa, prioridade: e.target.value as EccTarefaFormData["prioridade"] })}><option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option></select></label><button disabled={salvando === "tarefa"} className={botao}>Salvar tarefa</button></form>}
    </section>}

    {!carregando && edicao && aba === "visitas" && <VisitasEccSection encontroId={encontroId} participacoes={participacoes} casais={dados.casais} voluntarios={dados.voluntarios} visitas={dados.visitas} onSaved={carregar} />}
    {!carregando && edicao && aba === "credenciamento" && <CredenciamentoEccSection encontroId={encontroId} participacoes={participacoes} casais={dados.casais} credenciamentos={dados.credenciamentos} onSaved={carregar} />}
    {!carregando && edicao && aba === "arrecadacao" && <ArrecadacaoEccSection encontroId={encontroId} arrecadacoes={dados.arrecadacoes.filter((item) => item.encontroId === encontroId)} casaisDoadores={dados.casaisDoadores} onSaved={carregar} />}
    {!carregando && edicao && aba === "gestao" && <GestaoEccSection encontroId={encontroId} dados={dados} onSaved={carregar} />}
    {carregando ? <div className="rounded-2xl bg-white p-12 text-center text-slate-500">Carregando operação do ECC...</div> : !edicao ? <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">Cadastre uma edição para começar.</div> : <>
      {aba === "secretaria" && <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-xl font-black">Casais desta edição</h2><p className="text-sm text-slate-500">Inclua um casal já cadastrado e defina seu único papel nesta edição.</p></div>
          <div className="grid w-full gap-2 md:w-auto md:grid-cols-[minmax(260px,1fr)_220px_auto]">
            <select className={campo} value={casalParaVinculo} onChange={(e) => setCasalParaVinculo(e.target.value)}><option value="">Selecione um casal cadastrado</option>{casaisDisponiveis.map((i) => <option key={i.id} value={i.id}>{i.conjugeUmNome} e {i.conjugeDoisNome}</option>)}</select>
            <select className={campo} value={classificacaoParaVinculo} onChange={(e) => setClassificacaoParaVinculo(e.target.value as EccClassificacaoParticipacao)}><optgroup label="Participará do encontro">{papeisParticipantes.map((valor) => <option key={valor} value={valor}>{classificacaoParticipacao[valor]}</option>)}</optgroup><optgroup label="Trabalhará no encontro">{papeisServico.map((valor) => <option key={valor} value={valor}>{classificacaoParticipacao[valor]}</option>)}</optgroup></select>
            <button onClick={vincularCasal} disabled={!casalParaVinculo || salvando === "vinculo"} className={botao}>Incluir na edição</button>
          </div>
        </div>
        <div className="relative mt-5"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input className={`${campo} pl-10`} placeholder="Localizar casal" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
        <div className="mt-4 grid gap-2">{participacoes.filter((i) => i.casalNome.toLowerCase().includes(busca.toLowerCase())).map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><strong>{item.casalNome}</strong><p className="text-xs text-slate-500">{classificacaoParticipacao[item.classificacao]} · inscrito em {new Date(item.inscritoEm).toLocaleDateString("pt-BR")}</p></div><select className="rounded-xl border bg-white px-3 py-2 text-sm font-bold" value={item.situacao} onChange={(e) => void executar(`participacao-${item.id}`, () => atualizarParticipacao(item.id, { situacao: e.target.value as EccParticipacaoSituacao, observacoes: item.observacoes }), "Situação do casal atualizada.")}>{Object.entries(participacaoStatus).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></article>)}{!participacoes.length && <p className="py-10 text-center text-slate-500">Nenhum casal incluído nesta edição.</p>}</div>
      </section>}

      {aba === "mapa" && <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"><div className="rounded-2xl border bg-white p-4 shadow-sm"><div className="mb-4"><h2 className="text-xl font-black">Mapa dos casais encontristas</h2><p className="text-sm text-slate-500">Pinos numerados e distância em linha reta até a paróquia.</p></div>{dados.paroquia.latitude !== null && dados.paroquia.longitude !== null ? <MapaEcc paroquia={{ nome: dados.paroquia.nome, latitude: dados.paroquia.latitude, longitude: dados.paroquia.longitude }} casais={pontos} /> : <div className="grid h-[480px] place-items-center rounded-2xl bg-amber-50 p-8 text-center text-amber-800">Defina a localização da paróquia em Administração para habilitar o mapa.</div>}</div><div className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-black">Relatório de distâncias</h2><p className="mt-1 text-sm text-slate-500">Do casal mais próximo ao mais distante.</p><div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto">{pontos.map((ponto, indice) => <article key={ponto.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">{indice + 1}</span><div><strong className="text-sm">{ponto.nome}</strong><p className="text-xs text-slate-500">{ponto.endereco}</p><p className="mt-1 text-sm font-black text-blue-700">{ponto.distanciaKm.toFixed(1)} km</p></div></article>)}{!pontos.length && <p className="py-8 text-center text-sm text-slate-500">Nenhum casal com coordenadas disponível.</p>}</div>{semCoordenadas.length > 0 && <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><strong>{semCoordenadas.length} pendência(s) cadastral(is)</strong><p className="mt-1">{semCoordenadas.map((i) => i.casalNome).join(", ")}</p></div>}</div></section>}

      {aba === "cronograma" && <section className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-black">Cronograma do encontro</h2><div className="mt-5 space-y-3">{agenda.map((item) => <article key={item.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[150px_1fr_190px]"><div className="text-sm font-black text-blue-700">{new Date(`${item.data}T12:00:00`).toLocaleDateString("pt-BR")}<br />{item.horaInicio}{item.horaFim && `–${item.horaFim}`}</div><div><strong>{item.titulo}</strong><p className="text-sm text-slate-500">{[item.ambiente, item.equipe, item.responsavelNome].filter(Boolean).join(" · ")}</p></div><select className={campo} value={item.status} onChange={(e) => void executar(`agenda-${item.id}`, () => atualizarProgramacao(item.id, e.target.value as EccProgramacaoStatus), "Atividade atualizada.")}>{Object.entries(programacaoStatus).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></article>)}{!agenda.length && <p className="py-10 text-center text-slate-500">O cronograma ainda não possui atividades.</p>}</div></section>}

      {aba === "tarefas" && <section className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-black">Plano de ação</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{tarefas.map((item) => <article key={item.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><strong>{item.titulo}</strong><span className={`rounded-full px-2 py-1 text-xs font-black ${item.prioridade === "URGENTE" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{item.prioridade}</span></div><p className="mt-2 text-sm text-slate-500">{item.equipe || "Sem equipe"} · {item.responsavelNome}</p><p className="mt-1 text-xs text-slate-400">Prazo: {item.prazo ? new Date(`${item.prazo}T12:00:00`).toLocaleDateString("pt-BR") : "não definido"}</p><select className={`${campo} mt-3`} value={item.status} onChange={(e) => void executar(`tarefa-${item.id}`, () => atualizarTarefa(item.id, e.target.value as EccTarefaStatus), "Tarefa atualizada.")}>{Object.entries(tarefaStatus).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></article>)}{!tarefas.length && <p className="py-10 text-center text-slate-500 md:col-span-2">Nenhuma tarefa cadastrada.</p>}</div></section>}

      {aba === "equipes" && <section className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-black">Equipes de trabalho</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{equipes.map((item) => <article key={item.id} className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between"><strong>{item.voluntarioNome}</strong>{item.coordenador && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-800">Coordenação</span>}</div><p className="mt-1 text-sm text-slate-500">{item.equipe} · {item.funcao}</p></article>)}{!equipes.length && <p className="py-10 text-center text-slate-500 md:col-span-2">A equipe ainda não foi formada.</p>}</div></section>}
    </>}
  </main>;
}
