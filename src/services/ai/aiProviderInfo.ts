import { ollamaConfig, OPENAI_OPTIONAL_HINT } from './ollamaConfig';
import { getOllamaStatus, ollamaChat, type OllamaStatus } from './ollamaClient';
import { procurementConfig } from '@/services/procurement/config';

export type AiProviderOverview = {
  primaryProvider: 'ollama';
  fallbackProvider: 'openai' | 'rules';
  openaiConfigured: boolean;
  openaiModel: string;
  ollamaBaseUrl: string;
  configuredTextModel: string;
  configuredVisionModel: string;
  openaiHint: string;
};

export function getAiProviderOverview(): AiProviderOverview {
  return {
    primaryProvider: 'ollama',
    fallbackProvider: procurementConfig.openai.enabled ? 'openai' : 'rules',
    openaiConfigured: procurementConfig.openai.enabled,
    openaiModel: procurementConfig.openai.model,
    ollamaBaseUrl: ollamaConfig.baseUrl,
    configuredTextModel: ollamaConfig.textModel,
    configuredVisionModel: ollamaConfig.visionModel,
    openaiHint: OPENAI_OPTIONAL_HINT,
  };
}

export type AiConnectionTestResult = {
  ok: boolean;
  provider: 'ollama' | 'openai' | 'none';
  message: string;
  model?: string;
};

export async function testAiConnection(): Promise<AiConnectionTestResult> {
  const status = await getOllamaStatus(true);
  if (status.online && status.textModel) {
    try {
      const reply = await ollamaChat({
        system: 'Tu réponds en une courte phrase.',
        user: 'Réponds uniquement: connexion OK',
        model: status.textModel,
      });
      if (reply?.content) {
        return {
          ok: true,
          provider: 'ollama',
          model: reply.model,
          message: reply.content.slice(0, 120),
        };
      }
    } catch {
      /* try fallback below */
    }
  }

  if (procurementConfig.openai.enabled) {
    try {
      const res = await fetch(`${procurementConfig.openai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: procurementConfig.openai.model,
          max_tokens: 20,
          messages: [{ role: 'user', content: 'Reply: OK' }],
        }),
      });
      if (res.ok) {
        return {
          ok: true,
          provider: 'openai',
          model: procurementConfig.openai.model,
          message: 'OpenAI API reachable',
        };
      }
    } catch {
      /* fall through */
    }
  }

  return {
    ok: false,
    provider: 'none',
    message: status.message || 'Aucun fournisseur IA disponible',
  };
}

export async function refreshOllamaStatus(): Promise<OllamaStatus> {
  return getOllamaStatus(true);
}
