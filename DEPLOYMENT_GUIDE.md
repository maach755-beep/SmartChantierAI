# SmartChantierAI — Deployment Guide

## Prerequisites

- Node.js 22+
- Supabase project (Auth, Database, Storage bucket `documents`)
- Optional: Ollama, Tavily API key

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run SQL migrations in order:
   - `supabase/migrations/001_core_schema.sql`
   - `supabase/migrations/002_technical_sheets_storage.sql`
3. Enable Email auth (or magic link) in Authentication settings.
4. Create Storage bucket `documents` (public or signed URLs per your policy).
5. Copy **Project URL** and **anon key** into environment variables.

## 2. Environment variables

Copy `.env.example` for development and `.env.production.example` for production:

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=/api
VITE_TAVILY_API_KEY=tvly-...
OLLAMA_BASE_URL=http://localhost:11434
```

Without Supabase keys, the app runs in **local SaaS mode** (IndexedDB-style localStorage persistence).

## 3. Local development

```bash
npm ci
npm run dev          # Vite :5173
npm run api:plan     # Express API :3001 (optional)
```

## 4. Production build

```bash
npm run build
npm run verify:production
```

## 5. Docker

```bash
cp .env.production.example .env
# Edit VITE_SUPABASE_* and secrets
docker compose up --build
```

- Frontend: http://localhost:8080
- API: http://localhost:3001
- Ollama: http://localhost:11434

## 6. Hosting options

| Component | Suggested host |
|-----------|----------------|
| Frontend static | Vercel, Netlify, Cloudflare Pages, or Docker `frontend` |
| API | Railway, Fly.io, Render, or Docker `api` |
| Database | Supabase (managed Postgres) |
| AI OCR | Ollama on GPU VM or fallback OpenAI |

## 7. Security checklist

- Never commit `.env` with service role keys
- Use Supabase RLS on all tables
- Set `CORS_ORIGIN` to your production domain only
- Rotate `VITE_SUPABASE_ANON_KEY` if exposed; use RLS to limit damage

## 8. Post-deploy verification

1. Register / login
2. Create project → appears on dashboard
3. Create quotation → export PDF
4. Assistant Achat → search + compare prices
5. `GET /api/health` returns `ok: true`
