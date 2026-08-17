import { AuditoriaRepository } from "../repositories/auditoria.repository";

export class AuditoriaService {
  private repository = new AuditoriaRepository();
  listar(limite?: number) { return this.repository.listar(limite); }
}
