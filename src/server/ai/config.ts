import 'server-only';

export interface AIConfig {
  /** True when an OpenAI-compatible endpoint is configured. */
  live: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const DEMO_MODEL = 'demo-heuristic-v1';

export function getAIConfig(preferredModel?: string): AIConfig {
  const apiKey = process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY ?? '';
  return {
    live: apiKey.length > 0,
    baseUrl: (process.env.AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, ''),
    apiKey,
    model: process.env.AI_MODEL ?? preferredModel ?? 'gpt-4.1-mini',
  };
}
