import { ParoquiaFormData } from "../schemas/paroquia.schema";

export type ParoquiaDocumento = ParoquiaFormData & {
  id: string;
};
