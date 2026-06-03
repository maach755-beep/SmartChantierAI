export const ollamaEnv = {
  baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  textModel: process.env.OLLAMA_TEXT_MODEL ?? 'llama3.1',
  visionModel: process.env.OLLAMA_VISION_MODEL ?? 'llava',
  textModelFallbacks: ['llama3.1', 'llama3.1:latest', 'qwen2.5', 'qwen2.5:latest', 'qwen2.5:7b'],
  visionModelFallbacks: ['llava', 'llava:latest', 'llava:13b', 'llava:7b', 'moondream'],
  timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 120000),
};

export const OLLAMA_SERVER_OFFLINE =
  'Ollama non joignable sur le serveur. Démarrez `ollama serve` et installez llama3.1 + llava.';

export const OLLAMA_SERVER_VISION_MISSING =
  'Modèle llava absent. Exécutez `ollama pull llava` pour analyser plans JPG/PNG.';
