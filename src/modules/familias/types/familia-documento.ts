import { FamiliaFormData } from "../schemas/familia.schema";

export type FamiliaDocumento = FamiliaFormData & {
  id: string;
};