import { loadAiPreferences } from './aiPreferences';
import { getOllamaStatus, type OllamaStatus } from './ollamaClient';
import { procurementConfig } from '@/services/procurement/config';

export type AiHealthPayload = {
  ok: boolean;
  primaryProvider: string;
  openaiConfigured: boolean;
  openaiOptional: boolean;
  ollama: OllamaStatus;
  source: 'api' | 'client';
  checkedAt: string;
};

export async function fetchAiHealth(force = false): Promise<AiHealthPayload> {
  const checkedAt = new Date().toISOString();
  try {
    const res = await fetch('/api/ai/health', { signal: AbortSignal.timeout(10_000) });
    if (res.ok) {
      const data = (await res.json()) as {
        ok?: boolean;
        primaryProvider?: string;
        openaiConfigured?: boolean;
        openaiOptional?: boolean;
        ollama?: OllamaStatus;
      };
      if (data.ollama) {
        return {
          ok: Boolean(data.ok),
          primaryProvider: data.primaryProvider ?? 'ollama',
          openaiConfigured: Boolean(data.openaiConfigured ?? procurementConfig.openai.enabled),
          openaiOptional: data.openaiOptional ?? true,
          ollama: data.ollama,
          source: 'api',
          checkedAt,
        };
      }
    }
  } catch {
    /* API offline — client-side check */
  }

  const ollama = await getOllamaStatus(force);
  const prefs = loadAiPreferences();
  return {
    ok: ollama.online && Boolean(ollama.textModel),
    primaryProvider: prefs.primaryProvider,
    openaiConfigured: procurementConfig.openai.enabled,
    openaiOptional: true,
    ollama,
    source: 'client',
    checkedAt,
  };
}
