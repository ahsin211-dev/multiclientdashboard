import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  AMAZON_ADS_CLIENT_ID: z.string().optional(),
  AMAZON_ADS_CLIENT_SECRET: z.string().optional(),
  AMAZON_ADS_REDIRECT_URI: z.string().optional(),
  AMAZON_SP_API_CLIENT_ID: z.string().optional(),
  AMAZON_SP_API_CLIENT_SECRET: z.string().optional(),
  AMAZON_REFRESH_TOKEN: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
