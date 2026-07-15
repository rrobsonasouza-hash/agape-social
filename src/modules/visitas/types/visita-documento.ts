import { VisitaFormData } from "../schemas/visita.schema";

export type VisitaDocumento = VisitaFormData & {
  id: string;
};
