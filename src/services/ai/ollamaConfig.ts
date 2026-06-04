/** Ollama — default local AI (OpenAI optional). */

import { loadAiPreferences } from './aiPreferences';
import { isViteDevMode, readAppEnv } from '@/utils/env';

const ENV_DEFAULTS = {
  baseUrl: readAppEnv('VITE_OLLAMA_BASE_URL', isViteDevMode() ? '/ollama' : 'http://localhost:11434'),
  textModel: readAppEnv('VITE_OLLAMA_TEXT_MODEL', 'llama3.1'),
  visionModel: readAppEnv('VITE_OLLAMA_VISION_MODEL', 'llava'),
  textModelFallbacks: ['llama3.1', 'llama3.1:latest', 'mistral', 'mistral:latest', 'qwen2.5', 'qwen2.5:latest', 'qwen2.5:7b', 'qwen2.5:14b'] as const,
  visionModelFallbacks: ['llava', 'llava:latest', 'llava:13b', 'llava:7b', 'moondream'] as const,
  requestTimeoutMs: Number(readAppEnv('VITE_OLLAMA_TIMEOUT_MS', '90000')),
};

/** Env defaults (static). */
export const ollamaConfig = ENV_DEFAULTS;

/** Effective config (user prefs in localStorage override env). */
export function getEffectiveOllamaConfig() {
  const prefs = loadAiPreferences();
  return {
    baseUrl: prefs.ollamaBaseUrl,
    textModel: prefs.textModel,
    visionModel: prefs.visionModel,
    textModelFallbacks: ENV_DEFAULTS.textModelFallbacks,
    visionModelFallbacks: ENV_DEFAULTS.visionModelFallbacks,
    requestTimeoutMs: ENV_DEFAULTS.requestTimeoutMs,
  };
}

export const OLLAMA_OFFLINE_MESSAGE =
  'Ollama n\'est pas démarré. Lancez `ollama serve` puis `ollama pull llama3.1` (texte) et `ollama pull llava` (plans/images).';

export const OLLAMA_TEXT_MODEL_MISSING =
  'Modèle texte Ollama introuvable. Exécutez : `ollama pull llama3.1` ou `ollama pull qwen2.5`.';

export const OLLAMA_VISION_MODEL_MISSING =
  'Modèle vision Ollama introuvable. Exécutez : `ollama pull llava` pour l\'analyse de plans et images.';

export const OPENAI_OPTIONAL_HINT =
  'OpenAI est optionnel — l\'application fonctionne sans clé API grâce à Ollama.';
