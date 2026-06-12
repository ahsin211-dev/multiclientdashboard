import { z } from "zod";

const envSchema = z.object({
  AMAZON_ADS_CLIENT_ID: z.string().min(1).optional(),
  AMAZON_ADS_CLIENT_SECRET: z.string().min(1).optional(),
  AMAZON_ADS_REDIRECT_URI: z.string().url().optional(),
  AMAZON_SP_API_CLIENT_ID: z.string().min(1).optional(),
  AMAZON_SP_API_CLIENT_SECRET: z.string().min(1).optional(),
  AMAZON_REFRESH_TOKEN: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  TOKEN_ENCRYPTION_SECRET: z.string().min(16).optional()
});

export const env = envSchema.parse(process.env);
