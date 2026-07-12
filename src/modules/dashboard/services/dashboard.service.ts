import {
  DashboardRepository,
} from "../repositories/dashboard.repository";

export class DashboardService {
  private repository =
    new DashboardRepository();

  async buscarResumo() {
    return this.repository.buscarResumo();
  }
}