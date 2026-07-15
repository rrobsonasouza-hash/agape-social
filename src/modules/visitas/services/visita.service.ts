import { VisitaRepository } from "../repositories/visita.repository";
import {
  StatusVisita,
  visitaSchema,
  VisitaFormData,
} from "../schemas/visita.schema";

export class VisitaService {
  private repository = new VisitaRepository();

  criar(data: VisitaFormData) {
    return this.repository.criar(visitaSchema.parse(data));
  }

  listar() {
    return this.repository.listar();
  }

  listarPorFamilia(familiaId: string) {
    if (!familiaId) throw new Error("Família não informada.");
    return this.repository.listarPorFamilia(familiaId);
  }

  alterarStatus(id: string, status: StatusVisita) {
    if (!id) throw new Error("Visita não informada.");
    return this.repository.alterarStatus(id, status);
  }
}
