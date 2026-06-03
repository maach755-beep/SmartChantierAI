import { ollamaConfig, OLLAMA_OFFLINE_MESSAGE, OLLAMA_TEXT_MODEL_MISSING, OLLAMA_VISION_MODEL_MISSING } from './ollamaConfig';

export type OllamaStatus = {
  online: boolean;
  textModel: string | null;
  visionModel: string | null;
  installedModels: string[];
  message: string;
};

let cachedStatus: OllamaStatus | null = null;
let cacheAt = 0;
const CACHE_MS = 15_000;

function modelMatches(modelName: string, candidate: string): boolean {
  const l = modelName.toLowerCase();
  const n = candidate.toLowerCase();
  const base = l.split(':')[0];
  const candBase = n.split(':')[0];
  return l === n || l.startsWith(`${n}:`) || n.startsWith(`${base}:`) || base === candBase;
}

export function pickInstalledModel(preferred: string, fallbacks: readonly string[], installed: string[]): string | null {
  const candidates = [preferred, ...fallbacks];
  for (const c of candidates) {
    const match = installed.find((m) => modelMatches(m, c));
    if (match) return match;
  }
  return null;
}

export async function fetchOllamaTags(): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${ollamaConfig.baseUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: { name: string }[] };
    return (data.models ?? []).map((m) => m.name);
  } catch {
    clearTimeout(timer);
    return [];
  }
}

export async function getOllamaStatus(force = false): Promise<OllamaStatus> {
  if (!force && cachedStatus && Date.now() - cacheAt < CACHE_MS) return cachedStatus;

  const installed = await fetchOllamaTags();
  const online = installed.length > 0;
  const textModel = online
    ? pickInstalledModel(ollamaConfig.textModel, ollamaConfig.textModelFallbacks, installed)
    : null;
  const visionModel = online
    ? pickInstalledModel(ollamaConfig.visionModel, ollamaConfig.visionModelFallbacks, installed)
    : null;

  let message = '';
  if (!online) message = OLLAMA_OFFLINE_MESSAGE;
  else if (!textModel) message = OLLAMA_TEXT_MODEL_MISSING;
  else if (!visionModel) message = OLLAMA_VISION_MODEL_MISSING;
  else message = `Ollama OK — texte: ${textModel}, vision: ${visionModel}`;

  cachedStatus = { online, textModel, visionModel, installedModels: installed, message };
  cacheAt = Date.now();
  return cachedStatus;
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function ollamaChat(params: {
  system: string;
  user: string;
  json?: boolean;
  model?: string;
}): Promise<{ content: string; model: string } | null> {
  const status = await getOllamaStatus();
  const model = params.model ?? status.textModel;
  if (!status.online || !model) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ollamaConfig.requestTimeoutMs);

  try {
    const userContent =
      params.json && !params.user.includes('JSON')
        ? `${params.user}\n\nRéponds uniquement avec un objet JSON valide, sans markdown.`
        : params.user;

    const res = await fetch(`${ollamaConfig.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: userContent },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content?.trim();
    if (!content) return null;
    return { content, model };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export async function ollamaChatJson(params: {
  system: string;
  user: string;
  model?: string;
}): Promise<Record<string, unknown> | null> {
  const reply = await ollamaChat({ ...params, json: true });
  if (!reply) return null;
  return extractJsonObject(reply.content);
}

export async function ollamaVision(params: {
  prompt: string;
  imageBase64: string;
  model?: string;
}): Promise<string | null> {
  const status = await getOllamaStatus();
  const model = params.model ?? status.visionModel;
  if (!status.online || !model) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ollamaConfig.requestTimeoutMs);

  try {
    const res = await fetch(`${ollamaConfig.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: 'user',
            content: params.prompt,
            images: [params.imageBase64],
          },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { message?: { content?: string } };
    return data.message?.content?.trim() ?? null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export function isOllamaTextReady(status: OllamaStatus): boolean {
  return status.online && Boolean(status.textModel);
}

export function isOllamaVisionReady(status: OllamaStatus): boolean {
  return status.online && Boolean(status.visionModel);
}
