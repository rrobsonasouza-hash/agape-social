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
    const voluntariosRef = collection(db, "voluntarios");

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const consultaFamiliasAtivas = query(
      familiasRef,
      where("status", "==", "ATIVA")
    );

    const consultaFamiliasInativas = query(
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

    const consultaVoluntariosAtivos = query(
      voluntariosRef,
      where("status", "==", "ATIVO")
    );

    const consultaVoluntariosInativos = query(
      voluntariosRef,
      where("status", "==", "INATIVO")
    );

    const [
      totalFamiliasSnapshot,
      familiasAtivasSnapshot,
      familiasInativasSnapshot,
      cadastrosMesSnapshot,
      ultimasFamiliasSnapshot,
      totalVoluntariosSnapshot,
      voluntariosAtivosSnapshot,
      voluntariosInativosSnapshot,
    ] = await Promise.all([
      getCountFromServer(familiasRef),
      getCountFromServer(consultaFamiliasAtivas),
      getCountFromServer(consultaFamiliasInativas),
      getCountFromServer(consultaCadastrosMes),
      getDocs(consultaUltimasFamilias),
      getCountFromServer(voluntariosRef),
      getCountFromServer(consultaVoluntariosAtivos),
      getCountFromServer(consultaVoluntariosInativos),
    ]);

    const ultimasFamilias: UltimaFamilia[] =
      ultimasFamiliasSnapshot.docs.map((documento) => {
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
        familiasAtivasSnapshot.data().count,

      familiasInativas:
        familiasInativasSnapshot.data().count,

      totalFamilias:
        totalFamiliasSnapshot.data().count,

      familiasCadastradasMes:
        cadastrosMesSnapshot.data().count,

      voluntariosAtivos:
        voluntariosAtivosSnapshot.data().count,

      voluntariosInativos:
        voluntariosInativosSnapshot.data().count,

      totalVoluntarios:
        totalVoluntariosSnapshot.data().count,

      ultimasFamilias,
    };
  }
}