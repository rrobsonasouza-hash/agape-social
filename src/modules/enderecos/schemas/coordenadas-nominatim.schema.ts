import { z } from "zod";

export const coordenadasNominatimResponseSchema = z.array(
  z.object({
    lat: z.string(),
    lon: z.string(),
  })
);
