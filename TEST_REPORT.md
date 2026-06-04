# SmartChantierAI — AI & API Test Report

**Date:** 2026-06-04  
**Environment:** Windows, Node 22, Ollama connected, API port 3001

## Root cause: ECONNREFUSED on `/api/ai/health`

| Issue | Cause | Fix |
|-------|--------|-----|
| `ECONNREFUSED` on `/api/ai/health` | Vite proxies `/api` → `localhost:3001`, but only `npm run dev` (Vite) was started — Express API was not running | `npm run dev` now starts API + Vite via `scripts/start-dev.mjs` |
| Noisy proxy errors with `dev:vite` only | Same missing backend | Vite plugin `ai-health-fallback` serves `/api/ai/health` from Ollama when API is down |
| `npm run api` ran mobile stub | Stub does not expose AI routes | `npm run api` → full Express server (`tsx server/index.ts`) |

## Passed tests

### API (`npm run test:ai:api`)

| Test | Result |
|------|--------|
| `GET /api/ai/health` | PASS |
| `GET /api/health` | PASS |
| `GET /api/ollama/status` | PASS |
| `POST /api/v1/site-director/analyze` (project analysis) | PASS |
| `GET /api/v1/plan-extraction/projects` | PASS |
| `POST /api/v1/plan-extraction/assistant` | PASS |

### Client AI (`npm run test:ai:client`)

| Feature | Result | Provider |
|---------|--------|----------|
| AI purchase assistant — query parse | PASS | Ollama |
| AI purchase assistant — product search | PASS | Catalog + rules |
| AI purchase assistant — LLM summary | PASS | Ollama |
| Supplier recommendations | PASS | Rankings engine |
| Technical sheet generator | PASS | Demo engine + PDF |
| Project analysis (situation) | PASS | Local rules engine |

### Build & production

| Check | Result |
|-------|--------|
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run verify:production` | PASS (11/11) |

## Failed tests (before fixes)

| Test | Error | Status |
|------|-------|--------|
| `GET /api/ai/health` via Vite only | ECONNREFUSED :3001 | **Fixed** — start API with `npm run dev` |
| `POST /api/v1/site-director/analyze` | 500 — `attendance.filter` on undefined | **Fixed** — snapshot normalization |
| Client tests in Node | `import.meta.env` undefined | **Fixed** — `src/utils/env.ts` |

## Fixed bugs

1. **`scripts/start-dev.mjs`** — starts Express API, waits for `/api/ai/health`, then Vite.
2. **`scripts/vite-ai-health-plugin.ts`** — dev fallback for `/api/ai/health` without API.
3. **`server/routes/v1/site-director.routes.ts`** — `normalizeSnapshot()` + try/catch on analyze/ask/briefing.
4. **`package.json`** — `dev` runs full stack; `api` = Express; `test:ai:api` / `test:ai:client`.
5. **`server/config/ollama.ts`** — added `mistral` text model fallback.
6. **`src/utils/env.ts`** — safe env reads in browser and Node (tsx tests).
7. **Config modules** — `procurement`, `ollama`, `aiPreferences`, `realSearch` use `readAppEnv`.

## How to run locally

```bash
# Recommended — API (3001) + frontend (5173)
npm run dev

# API only
npm run api:plan

# Frontend only (AI health fallback; other /api routes need API)
npm run dev:vite

# Smoke tests (API must be running for test:ai:api)
npm run test:ai:api
npm run test:ai:client
```

## AI status

- **Ollama:** default provider (text + optional vision on server for plan extraction).
- **OpenAI:** optional via `VITE_OPENAI_API_KEY`.
- **Health:** `GET /api/ai/health` when API is up; client Ollama check as fallback.

## Remaining notes (non-blocking)

- Plan extraction upload/OCR requires API server + Ollama `llava` for images.
- Technical sheet uses demo engine unless Tavily/OpenAI configured.
- Situation analysis uses rules engine (no LLM) — by design.
