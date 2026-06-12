import { z } from "zod";

export const chatRequestSchema = z.object({
  clientId: z.string().min(1),
  question: z.string().min(3),
  preset: z.enum(["7d", "30d", "custom"]).default("7d"),
  from: z.string().optional(),
  to: z.string().optional(),
});
