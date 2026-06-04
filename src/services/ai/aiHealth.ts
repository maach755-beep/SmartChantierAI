import { loadAiPreferences } from './aiPreferences';
import {
  clearOllamaStatusCache,
  getOllamaStatus,
  pickInstalledModel,
  type OllamaStatus,
} from './ollamaClient';
import {
  getEffectiveOllamaConfig,
  OLLAMA_OFFLINE_MESSAGE,
  OLLAMA_TEXT_MODEL_MISSING,
  OLLAMA_VISION_MODEL_MISSING,
} from './ollamaConfig';
import { procurementConfig } from '@/services/procurement/config';
import { readAppEnv } from '@/utils/env';

/** Direct Ollama daemon — local health only (no Express API). */
const OLLAMA_DAEMON_URL = 'http://localhost:11434';

export type AiHealthSource = 'ollama-local' | 'api' | 'client';

export type AiHealthPayload = {
  ok: boolean;
  primaryProvider: string;
  openaiConfigured: boolean;
  openaiOptional: boolean;
  ollama: OllamaStatus;
  source: AiHealthSource;
  checkedAt: string;
};

/** True when AI health should use Ollama directly (default) — not the backend proxy. */
export function isLocalOllamaHealthMode(): boolean {
  const mode = readAppEnv('VITE_AI_HEALTH_MODE').toLowerCase();
  if (mode === 'server' || mode === 'api') return false;
  if (mode === 'local' || mode === 'ollama') return true;
  const prefs = loadAiPreferences();
  return prefs.primaryProvider === 'ollama' || prefs.primaryProvider === 'auto';
}

async function fetchDaemonTags(): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${OLLAMA_DAEMON_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: { name: string }[] };
    return (data.models ?? []).map((m) => m.name);
  } catch {
    clearTimeout(timer);
    return [];
  }
}

function buildStatusFromInstalled(installed: string[]): OllamaStatus {
  const cfg = getEffectiveOllamaConfig();
  const online = installed.length > 0;
  const textModel = online
    ? pickInstalledModel(cfg.textModel, cfg.textModelFallbacks, installed)
    : null;
  const visionModel = online
    ? pickInstalledModel(cfg.visionModel, cfg.visionModelFallbacks, installed)
    : null;

  const message = !online
    ? OLLAMA_OFFLINE_MESSAGE
    : !textModel
      ? OLLAMA_TEXT_MODEL_MISSING
      : !visionModel
        ? OLLAMA_VISION_MODEL_MISSING
        : `Ollama OK — texte: ${textModel}, vision: ${visionModel}`;

  return { online, textModel, visionModel, installedModels: installed, message };
}

/** Local mode: probe http://localhost:11434/api/tags — never calls /api/ai/health. */
async function fetchLocalOllamaHealth(force: boolean, checkedAt: string): Promise<AiHealthPayload> {
  if (force) clearOllamaStatusCache();
  const installed = await fetchDaemonTags();
  const ollama = buildStatusFromInstalled(installed);
  const prefs = loadAiPreferences();
  return {
    ok: ollama.online && Boolean(ollama.textModel),
    primaryProvider: prefs.primaryProvider,
    openaiConfigured: procurementConfig.openai.enabled,
    openaiOptional: true,
    ollama,
    source: 'ollama-local',
    checkedAt,
  };
}

/** Server/API mode: backend GET /api/ai/health (Express on port 3001). */
async function fetchServerApiHealth(checkedAt: string): Promise<AiHealthPayload | null> {
  const apiBase = readAppEnv('VITE_API_URL', '');
  const path = '/api/ai/health';
  const url = apiBase ? `${apiBase.replace(/\/$/, '')}${path}` : path;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      ok?: boolean;
      primaryProvider?: string;
      openaiConfigured?: boolean;
      openaiOptional?: boolean;
      ollama?: OllamaStatus;
    };
    if (!data.ollama) return null;
    return {
      ok: Boolean(data.ok),
      primaryProvider: data.primaryProvider ?? 'ollama',
      openaiConfigured: Boolean(data.openaiConfigured ?? procurementConfig.openai.enabled),
      openaiOptional: data.openaiOptional ?? true,
      ollama: data.ollama,
      source: 'api',
      checkedAt,
    };
  } catch {
    return null;
  }
}

export async function fetchAiHealth(force = false): Promise<AiHealthPayload> {
  const checkedAt = new Date().toISOString();

  if (isLocalOllamaHealthMode()) {
    return fetchLocalOllamaHealth(force, checkedAt);
  }

  const fromApi = await fetchServerApiHealth(checkedAt);
  if (fromApi) return fromApi;

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
