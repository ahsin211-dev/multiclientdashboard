import Anthropic from "@anthropic-ai/sdk";

import { env } from "@/lib/env";

let cachedClient: Anthropic | null | undefined;

export function getAnthropicClient() {
  if (cachedClient !== undefined) return cachedClient;

  if (!env.ANTHROPIC_API_KEY) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedClient;
}
