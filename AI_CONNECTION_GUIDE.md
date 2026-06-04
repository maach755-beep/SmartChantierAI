# AI Connection Guide — SmartChantierAI

## Default provider: Ollama

SmartChantierAI uses **Ollama** as the primary AI provider. The app is designed to run fully without OpenAI.

| Setting | Default | Override (`.env`) |
|---------|---------|-------------------|
| Base URL | `http://localhost:11434` (prod) / `/ollama` proxy (dev) | `VITE_OLLAMA_BASE_URL` |
| Text model | `llama3.1` | `VITE_OLLAMA_TEXT_MODEL` |
| Vision model | `llava` | `VITE_OLLAMA_VISION_MODEL` |
| Timeout | 90000 ms | `VITE_OLLAMA_TIMEOUT_MS` |

### Fallback text models (auto-detected)

If the configured model is not installed, the client tries: `llama3.1`, `mistral`, `qwen2.5`, and tagged variants.

## Optional provider: OpenAI

OpenAI is used **only** when `VITE_OPENAI_API_KEY` is set in the project root `.env`. Without it, procurement and analysis fall back to **local rules** — no crash, no required key.

```env
# Optional — not required for local dev
VITE_OPENAI_API_KEY=sk-...
```

## Local setup (Ollama)

1. Install [Ollama](https://ollama.com/) and start the daemon:
   ```bash
   ollama serve
   ```
2. Pull recommended models:
   ```bash
   ollama pull llama3.1
   ollama pull mistral
   ollama pull llava
   ```
3. Start the app:
   ```bash
   npm run dev
   ```
4. Open **Paramètres IA** (`/parametres-ia`) or **Settings → Intelligence artificielle** to see:
   - Current provider (Ollama)
   - Ollama online/offline status
   - Active text/vision model names
   - Fallback provider (OpenAI or local rules)
   - **Tester la connexion IA** button

### Dev proxy

In development, Vite proxies `/ollama` → `http://localhost:11434` (see `vite.config.ts`). Production builds call `http://localhost:11434` directly unless `VITE_OLLAMA_BASE_URL` is set.

## If Ollama is offline

- The UI shows an **amber warning** (not a crash).
- AI features degrade gracefully: rule-based procurement, cached/demo responses where applicable.
- Use **Actualiser le statut** after starting Ollama.

## Health check API

When the API server is running (`npm run api:plan`, port 3001):

```http
GET /api/ai/health
```

Returns Ollama online status, models, and `ok: true` when a text model is available. The Vite dev proxy forwards `/api` to the API server.

On startup, the web app calls this endpoint (or falls back to a direct Ollama check) via `AiHealthProvider`.

## Test connection

The **Test AI connection** button on the AI Settings page:

1. Pings Ollama (`/api/tags`) and verifies a text model is installed.
2. Sends a minimal chat prompt when online.
3. If Ollama fails and OpenAI is configured, probes the OpenAI API.
4. Otherwise reports that no provider is available.

Implementation: `src/services/ai/aiProviderInfo.ts`, UI: `src/components/settings/AiSettingsPanel.tsx`.

## Architecture reference

| File | Role |
|------|------|
| `src/services/ai/ollamaConfig.ts` | URLs, models, user-facing offline messages |
| `src/services/ai/ollamaClient.ts` | Status check, chat, vision helpers |
| `src/services/ai/aiProviderInfo.ts` | Overview + connection test |
| `src/services/procurement/config.ts` | OpenAI enable flag from env |
| `src/services/procurement/llmAnalysis.ts` | Ollama → OpenAI → rules chain |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Ollama non joignable" | Run `ollama serve`, check port 11434 |
| "Modèle texte introuvable" | `ollama pull llama3.1` or `ollama pull mistral` |
| CORS in production | Set `VITE_OLLAMA_BASE_URL` to a reachable host or use same-origin proxy |
| OpenAI badge "Non configuré" | Expected without `VITE_OPENAI_API_KEY` |
