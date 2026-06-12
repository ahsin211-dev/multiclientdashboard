import { z } from "zod";

export const chatRequestSchema = z.object({
  clientId: z.string().min(1),
  period: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      })
    )
    .min(1),
});

export const createClientSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  marketplace: z
    .enum(["US", "CA", "MX", "UK", "DE", "FR", "IT", "ES", "JP", "AU"])
    .default("US"),
  currency: z.string().default("USD"),
});

export const auditRequestSchema = z.object({
  clientId: z.string().min(1),
  period: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  targetAcos: z.number().min(0).max(2).optional(),
});

export const reportRequestSchema = z.object({
  clientId: z.string().min(1),
  period: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const connectRequestSchema = z.object({
  clientId: z.string().min(1),
  type: z.enum(["ADS", "SP_API"]).default("ADS"),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
