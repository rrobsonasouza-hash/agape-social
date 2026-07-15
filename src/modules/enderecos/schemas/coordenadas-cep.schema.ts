import { z } from "zod";

export const coordenadasCepResponseSchema = z.object({
  location: z.object({
    coordinates: z.object({
      latitude: z.union([z.string(), z.number()]),
      longitude: z.union([z.string(), z.number()]),
    }),
  }),
});
