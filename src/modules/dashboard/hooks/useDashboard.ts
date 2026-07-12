"use client";

import { useCallback } from "react";

import {
  DashboardService,
} from "../services/dashboard.service";

const service = new DashboardService();

export function useDashboard() {
  const buscarResumo = useCallback(
    async () => {
      return service.buscarResumo();
    },
    []
  );

  return {
    buscarResumo,
  };
}