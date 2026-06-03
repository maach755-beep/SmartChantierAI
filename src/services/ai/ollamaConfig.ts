/** Ollama — default local AI (OpenAI optional). */

const readEnv = (key: string, fallback = '') => {
  const v = import.meta.env[key];
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
};

/** Dev: Vite proxy `/ollama` → localhost:11434 */
export const ollamaConfig = {
  baseUrl: readEnv('VITE_OLLAMA_BASE_URL', import.meta.env.DEV ? '/ollama' : 'http://localhost:11434'),
  textModel: readEnv('VITE_OLLAMA_TEXT_MODEL', 'llama3.1'),
  visionModel: readEnv('VITE_OLLAMA_VISION_MODEL', 'llava'),
  textModelFallbacks: ['llama3.1', 'llama3.1:latest', 'qwen2.5', 'qwen2.5:latest', 'qwen2.5:7b', 'qwen2.5:14b'],
  visionModelFallbacks: ['llava', 'llava:latest', 'llava:13b', 'llava:7b', 'moondream'],
  requestTimeoutMs: Number(readEnv('VITE_OLLAMA_TIMEOUT_MS', '90000')),
} as const;

export const OLLAMA_OFFLINE_MESSAGE =
  'Ollama n\'est pas démarré. Lancez `ollama serve` puis `ollama pull llama3.1` (texte) et `ollama pull llava` (plans/images).';

export const OLLAMA_TEXT_MODEL_MISSING =
  'Modèle texte Ollama introuvable. Exécutez : `ollama pull llama3.1` ou `ollama pull qwen2.5`.';

export const OLLAMA_VISION_MODEL_MISSING =
  'Modèle vision Ollama introuvable. Exécutez : `ollama pull llava` pour l\'analyse de plans et images.';

export const OPENAI_OPTIONAL_HINT =
  'OpenAI est optionnel — l\'application fonctionne sans clé API grâce à Ollama.';
