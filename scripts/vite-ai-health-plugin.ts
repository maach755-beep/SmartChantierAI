/**
 * Vite dev fallback for GET /api/ai/health when Express is not running (dev:vite only).
 * Prevents ECONNREFUSED noise; full /api routes still need `npm run dev` or `npm run api:plan`.
 */
import type { Plugin } from 'vite';

const OLLAMA = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
const TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL ?? 'llama3.1';
const VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? 'llava';
const TEXT_FALLBACKS = ['llama3.1', 'llama3.1:latest', 'mistral', 'mistral:latest', 'qwen2.5'];

function modelMatches(name: string, candidate: string): boolean {
  const l = name.toLowerCase();
  const n = candidate.toLowerCase();
  const base = l.split(':')[0];
  return l === n || l.startsWith(`${n}:`) || base === n.split(':')[0];
}

function pickModel(preferred: string, fallbacks: string[], installed: string[]): string | null {
  for (const c of [preferred, ...fallbacks]) {
    const m = installed.find((name) => modelMatches(name, c));
    if (m) return m;
  }
  return null;
}

async function ollamaStatus() {
  try {
    const res = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('tags failed');
    const data = (await res.json()) as { models?: { name: string }[] };
    const installed = (data.models ?? []).map((m) => m.name);
    const online = installed.length > 0;
    const textModel = online ? pickModel(TEXT_MODEL, TEXT_FALLBACKS, installed) : null;
    const visionModel = online ? pickModel(VISION_MODEL, ['llava', 'llava:latest'], installed) : null;
    const message = !online
      ? 'Ollama offline — run ollama serve'
      : textModel
        ? `Ollama OK — ${textModel}`
        : 'Text model missing — ollama pull llama3.1';
    return { online, textModel, visionModel, installedModels: installed, message };
  } catch {
    return {
      online: false,
      textModel: null,
      visionModel: null,
      installedModels: [] as string[],
      message: 'Ollama unreachable on localhost:11434',
    };
  }
}

export function aiHealthFallbackPlugin(): Plugin {
  return {
    name: 'ai-health-fallback',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathOnly = req.url?.split('?')[0];
        if (req.method !== 'GET' || pathOnly !== '/api/ai/health') {
          next();
          return;
        }
        const ollama = await ollamaStatus();
        const body = JSON.stringify({
          ok: ollama.online && Boolean(ollama.textModel),
          service: 'SmartChantier AI (Vite fallback)',
          primaryProvider: 'ollama',
          openaiConfigured: false,
          openaiOptional: true,
          ollama,
          source: 'vite-fallback',
          checkedAt: new Date().toISOString(),
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(body);
      });
    },
  };
}
