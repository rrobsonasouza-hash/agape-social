import { VoluntarioFormData } from "../schemas/voluntario.schema";

export type VoluntarioDocumento = VoluntarioFormData & {
  id: string;
};