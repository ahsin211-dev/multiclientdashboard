import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  workspaceName: z.string().min(1),
});

export const clientSchema = z.object({
  brandName: z.string().min(1),
  marketplace: z.enum(["US", "CA", "UK", "DE", "FR", "IT", "ES", "JP", "AU", "MX"]),
});

export const dateRangeSchema = z.object({
  from: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  to: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const chatMessageSchema = z.object({
  clientId: z.string().cuid(),
  sessionId: z.string().cuid().optional(),
  message: z.string().min(1).max(4000),
  dateRange: dateRangeSchema.optional(),
});

export const syncJobSchema = z.object({
  clientId: z.string().cuid(),
  type: z.enum([
    "FULL",
    "CAMPAIGNS",
    "AD_GROUPS",
    "KEYWORDS",
    "SEARCH_TERMS",
    "PRODUCTS",
    "SALES_METRICS",
    "SQP_DATA",
    "NORMALIZE",
  ]).optional(),
});
