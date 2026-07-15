import { AuditoriaRepository } from "../repositories/auditoria.repository";
import { AuditoriaEntrada } from "../types/auditoria-documento";

export class AuditoriaService {
  private repository = new AuditoriaRepository();
  registrar(entrada: AuditoriaEntrada) { return this.repository.registrar(entrada); }
  listar(limite?: number) { return this.repository.listar(limite); }
}
