import { ollamaEnv, OLLAMA_SERVER_OFFLINE, OLLAMA_SERVER_VISION_MISSING } from '../../config/ollama.js';

function modelMatches(modelName: string, candidate: string): boolean {
  const l = modelName.toLowerCase();
  const n = candidate.toLowerCase();
  const base = l.split(':')[0];
  const candBase = n.split(':')[0];
  return l === n || l.startsWith(`${n}:`) || base === candBase;
}

function pickModel(preferred: string, fallbacks: string[], installed: string[]): string | null {
  for (const c of [preferred, ...fallbacks]) {
    const m = installed.find((name) => modelMatches(name, c));
    if (m) return m;
  }
  return null;
}

export async function fetchOllamaTags(): Promise<string[]> {
  try {
    const res = await fetch(`${ollamaEnv.baseUrl}/api/tags`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: { name: string }[] };
    return (data.models ?? []).map((m) => m.name);
  } catch {
    return [];
  }
}

export async function getServerOllamaStatus() {
  const installed = await fetchOllamaTags();
  const online = installed.length > 0;
  const textModel = online ? pickModel(ollamaEnv.textModel, ollamaEnv.textModelFallbacks, installed) : null;
  const visionModel = online ? pickModel(ollamaEnv.visionModel, ollamaEnv.visionModelFallbacks, installed) : null;
  let message = OLLAMA_SERVER_OFFLINE;
  if (online && textModel && visionModel) message = `Ollama OK — ${textModel} / ${visionModel}`;
  else if (online && textModel && !visionModel) message = OLLAMA_SERVER_VISION_MISSING;
  else if (online && !textModel) message = 'Modèle texte manquant — `ollama pull llama3.1` ou `qwen2.5`';
  return { online, textModel, visionModel, installedModels: installed, message };
}

export async function ollamaVisionAnalyze(imageBase64: string, prompt: string): Promise<string | null> {
  const status = await getServerOllamaStatus();
  if (!status.visionModel) return null;

  try {
    const res = await fetch(`${ollamaEnv.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(ollamaEnv.timeoutMs),
      body: JSON.stringify({
        model: status.visionModel,
        stream: false,
        messages: [{ role: 'user', content: prompt, images: [imageBase64] }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { message?: { content?: string } };
    return data.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function ollamaTextEnrich(prompt: string, text: string): Promise<string | null> {
  const status = await getServerOllamaStatus();
  if (!status.textModel) return null;
  try {
    const res = await fetch(`${ollamaEnv.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(ollamaEnv.timeoutMs),
      body: JSON.stringify({
        model: status.textModel,
        stream: false,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: text.slice(0, 14000) },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { message?: { content?: string } };
    return data.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
