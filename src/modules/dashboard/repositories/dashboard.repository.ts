import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";

import {
  DashboardResumo,
  UltimaFamilia,
} from "../types/dashboard.types";

export class DashboardRepository {
  async buscarResumo(): Promise<DashboardResumo> {
    const familiasRef = collection(db, "familias");

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const consultaAtivas = query(
      familiasRef,
      where("status", "==", "ATIVA")
    );

    const consultaInativas = query(
      familiasRef,
      where("status", "==", "INATIVA")
    );

    const consultaCadastrosMes = query(
      familiasRef,
      where(
        "createdAt",
        ">=",
        Timestamp.fromDate(inicioMes)
      )
    );

    const consultaUltimasFamilias = query(
      familiasRef,
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const [
      totalSnapshot,
      ativasSnapshot,
      inativasSnapshot,
      cadastrosMesSnapshot,
      ultimasSnapshot,
    ] = await Promise.all([
      getCountFromServer(familiasRef),
      getCountFromServer(consultaAtivas),
      getCountFromServer(consultaInativas),
      getCountFromServer(consultaCadastrosMes),
      getDocs(consultaUltimasFamilias),
    ]);

    const ultimasFamilias: UltimaFamilia[] =
      ultimasSnapshot.docs.map((documento) => {
        const dados = documento.data();

        return {
          id: documento.id,
          nomeResponsavel:
            dados.nomeResponsavel || "Nome não informado",
          cidade: dados.cidade || "Não informada",
          status:
            dados.status === "INATIVA"
              ? "INATIVA"
              : "ATIVA",
          createdAt:
            dados.createdAt instanceof Timestamp
              ? dados.createdAt.toDate()
              : null,
        };
      });

    return {
      familiasAtivas:
        ativasSnapshot.data().count,
      familiasInativas:
        inativasSnapshot.data().count,
      totalFamilias:
        totalSnapshot.data().count,
      familiasCadastradasMes:
        cadastrosMesSnapshot.data().count,
      ultimasFamilias,
    };
  }
}