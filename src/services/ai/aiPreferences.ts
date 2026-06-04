/** User AI preferences (localStorage) — Ollama default, OpenAI optional. */

export type AiPrimaryProvider = 'ollama' | 'openai' | 'auto';

export type AiPreferences = {
  primaryProvider: AiPrimaryProvider;
  ollamaBaseUrl: string;
  textModel: string;
  visionModel: string;
};

const STORAGE_KEY = 'smartchantier_ai_prefs_v1';

import { isViteDevMode, readAppEnv } from '@/utils/env';

const DEFAULTS: AiPreferences = {
  primaryProvider: 'ollama',
  ollamaBaseUrl: isViteDevMode() ? '/ollama' : 'http://localhost:11434',
  textModel: 'llama3.1',
  visionModel: 'llava',
};

export function getEnvDefaults(): AiPreferences {
  return {
    primaryProvider: 'ollama',
    ollamaBaseUrl: readAppEnv('VITE_OLLAMA_BASE_URL', DEFAULTS.ollamaBaseUrl),
    textModel: readAppEnv('VITE_OLLAMA_TEXT_MODEL', DEFAULTS.textModel),
    visionModel: readAppEnv('VITE_OLLAMA_VISION_MODEL', DEFAULTS.visionModel),
  };
}

export function loadAiPreferences(): AiPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...getEnvDefaults() };
    const parsed = JSON.parse(raw) as Partial<AiPreferences>;
    const env = getEnvDefaults();
    return {
      primaryProvider:
        parsed.primaryProvider === 'openai' || parsed.primaryProvider === 'auto'
          ? parsed.primaryProvider
          : 'ollama',
      ollamaBaseUrl: typeof parsed.ollamaBaseUrl === 'string' && parsed.ollamaBaseUrl.trim()
        ? parsed.ollamaBaseUrl.trim()
        : env.ollamaBaseUrl,
      textModel: typeof parsed.textModel === 'string' && parsed.textModel.trim()
        ? parsed.textModel.trim()
        : env.textModel,
      visionModel: typeof parsed.visionModel === 'string' && parsed.visionModel.trim()
        ? parsed.visionModel.trim()
        : env.visionModel,
    };
  } catch {
    return { ...getEnvDefaults() };
  }
}

export function saveAiPreferences(prefs: AiPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent('smartchantier:ai-prefs-changed'));
}

export function resetAiPreferences(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('smartchantier:ai-prefs-changed'));
}
