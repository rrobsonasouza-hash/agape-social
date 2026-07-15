import { CestasService } from "@/modules/cestas/services/cestas.service";
import { FamiliaRepository } from "@/modules/familias/repositories/familia.repository";
import { DistribuicaoRepository } from "../repositories/distribuicao.repository";
import { distribuicaoSchema, DistribuicaoData, StatusDistribuicao } from "../schemas/distribuicao.schema";

export class DistribuicaoService {
  private repository = new DistribuicaoRepository();
  private familias = new FamiliaRepository();
  private cestas = new CestasService();

  listarPorData(data: string) { return this.repository.listarPorData(data); }

  async agendar(data: DistribuicaoData) {
    const validado = distribuicaoSchema.parse(data);
    const familia = await this.familias.buscarPorId(validado.familiaId);
    if (!familia) throw new Error("Família não encontrada.");
    if (familia.beneficioBloqueado) throw new Error("Esta família está bloqueada por três faltas consecutivas.");
    const lista = await this.repository.listarPorData(validado.data);
    if (lista.some((item) => item.familiaId === validado.familiaId)) throw new Error("A família já está nesta lista.");
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
        !existentes.has(familia.id)
    );
    await this.repository.agendarMuitas(
      elegiveis.map((familia) => ({
        data,
        campanhaId,
        familiaId: familia.id,
        familiaNome: familia.nomeResponsavel,
        quantidade: 1,
        status: "AGENDADA",
      }))
    );
    return { adicionadas: elegiveis.length };
  }

  async marcar(id: string, status: Exclude<StatusDistribuicao, "AGENDADA">) {
    const registro = await this.repository.buscarPorId(id);
    if (!registro) throw new Error("Registro não encontrado.");
    if (registro.status !== "AGENDADA") throw new Error("Este atendimento já foi finalizado.");
    const familia = await this.familias.buscarPorId(registro.familiaId);
    if (!familia) throw new Error("Família não encontrada.");

    if (status === "RETIRADA" || status === "ENTREGUE_DOMICILIO") {
      await this.cestas.entregarCestas(registro.campanhaId, registro.quantidade, registro.familiaId, registro.familiaNome);
      await this.familias.atualizarControleBeneficio(registro.familiaId, { beneficioBloqueado: false, faltasConsecutivas: 0, motivoBloqueio: "" });
    } else {
      const faltas = (familia.faltasConsecutivas ?? 0) + 1;
      await this.familias.atualizarControleBeneficio(registro.familiaId, { beneficioBloqueado: faltas >= 3, faltasConsecutivas: faltas, motivoBloqueio: faltas >= 3 ? "Três ausências consecutivas na retirada de cestas." : "" });
    }
    await this.repository.alterarStatus(id, status);
  }
}
