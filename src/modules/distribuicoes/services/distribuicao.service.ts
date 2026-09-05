import { FamiliaRepository } from "@/modules/familias/repositories/familia.repository";
import { DistribuicaoRepository } from "../repositories/distribuicao.repository";
import {
  distribuicaoSchema,
  DistribuicaoData,
  StatusDistribuicao,
} from "../schemas/distribuicao.schema";

export class DistribuicaoService {
  private repository = new DistribuicaoRepository();
  private familias = new FamiliaRepository();

  listarPorData(data: string) {
    return this.repository.listarPorData(data);
  }

  listarDatas() {
    return this.repository.listarDatas();
  }

  async agendar(data: DistribuicaoData) {
    const validado = distribuicaoSchema.parse(data);
    const familia = await this.familias.buscarPorId(validado.familiaId);
    if (!familia) throw new Error("Família não encontrada.");
    if (familia.status === "INATIVA")
      throw new Error(
        "Esta família está inativa. Reative o cadastro antes de incluí-la na distribuição.",
      );
    if (familia.beneficioBloqueado)
      throw new Error(
        "Esta família está bloqueada por três faltas consecutivas.",
      );
    const lista = await this.repository.listarPorData(validado.data);
    if (lista.some((item) => item.familiaId === validado.familiaId))
      throw new Error("A família já está nesta lista.");
    return this.repository.agendar(validado);
  }

  async agendarTodas(data: string, campanhaId: string) {
    if (!data || !campanhaId) throw new Error("Informe a data e a campanha.");
    const [familias, listaAtual] = await Promise.all([
      this.familias.listar(),
      this.repository.listarPorData(data),
    ]);
    const existentes = new Set(listaAtual.map((item) => item.familiaId));
    const elegiveis = familias.filter(
      (familia) =>
        familia.status === "ATIVA" &&
        !familia.beneficioBloqueado &&
        !existentes.has(familia.id),
    );
    await this.repository.agendarMuitas(
      elegiveis.map((familia) => ({
        data,
        campanhaId,
        familiaId: familia.id,
        familiaNome: familia.nomeResponsavel,
        quantidade: 1,
        status: "AGENDADA",
      })),
    );
    return { adicionadas: elegiveis.length };
  }

  async remarcar(id: string, data: string) {
    const registro = await this.repository.buscarPorId(id);
    if (!registro) throw new Error("Registro não encontrado.");
    if (registro.status !== "AGENDADA")
      throw new Error("Somente distribuições agendadas podem ser remarcadas.");
    if (!data) throw new Error("Informe a nova data.");
    return this.repository.alterarData(id, data);
  }

  async remarcarTodas(ids: string[], data: string) {
    if (!data) throw new Error("Informe a nova data.");
    await Promise.all(ids.map((id) => this.remarcar(id, data)));
  }

  async excluirAgendadas(ids: string[]) {
    if (!ids.length) throw new Error("Não há famílias agendadas para excluir.");
    return this.repository.excluirAgendadas(ids);
  }

  async marcarAusentes(ids: string[]) {
    if (!ids.length)
      throw new Error("Não há famílias pendentes para registrar ausência.");
    return this.repository.marcarAusentes(ids);
  }

  marcar(id: string, status: Exclude<StatusDistribuicao, "AGENDADA">) {
    return this.repository.alterarStatus(id, status);
  }

  desfazerBaixa(id: string) {
    return this.repository.alterarStatus(id, "AGENDADA");
  }
}
