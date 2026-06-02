# SmartChantier AI — Deployment Checklist

**Pre-requisite:** `npm run build` passes locally (verified stabilization pass 2026-05-31).

---

## 1. Local verification

- [ ] `npm install`
- [ ] `npm run build` → exit code **0**
- [ ] `npm run lint` → **0 errors**
- [ ] `npm run dev` → open `/`, `/assistant-achat`, `/plan-extraction`, `/pilotage`
- [ ] Toggle **AR** → RTL layout OK
- [ ] Settings → reset demo → refresh → demo v6 restored

---

## 2. Frontend hosting (static SPA)

| Item | Value |
|------|--------|
| Build command | `npm run build` |
| Output | `dist/` |
| SPA fallback | All routes → `index.html` |
| Env | `VITE_API_URL` if API on another host |

- [ ] HTTPS enabled  
- [ ] Cache: long-lived `/assets/*`, short/no-cache `index.html`  
- [ ] Security headers (CSP, HSTS)  

---

## 3. Backend services (optional)

### Plan Extraction API
```bash
npm run api:plan   # default :3001
```
- [ ] Reverse proxy `/api` → API server  
- [ ] `VISION_API_URL` for real OCR/vision  
- [ ] Replace `server/db/jsonStore.ts` with PostgreSQL  

### Mobile API stub
```bash
npm run api
```

### Site Director API
- [ ] `/api/v1/site-director` routes deployed with tenant auth  

---

## 4. Environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Frontend API base URL |
| `VISION_API_URL` | External vision/OCR |
| `OPENAI_API_KEY` | Real LLM (when integrated) |
| `PORT` | API port (default 3001) |

---

## 5. Supabase / PostgreSQL

- [ ] Run `shared/plan-extraction/schema.sql` in Supabase SQL editor  
- [ ] Enable RLS per `tenant_id`  
- [ ] Migrate `dataStore` modules (chantiers, tasks, materials, photos, risks, …) off localStorage  
- [ ] Auth: Supabase Auth or Auth0 + JWT on API  
- [ ] Backups enabled  

**Demo today:** browser `localStorage` only (`DEMO_DATA_VERSION=6`).

---

## 6. Real AI integrations

| Module | Demo today | Production |
|--------|------------|------------|
| Plan OCR | Heuristic + optional Vision URL | Vision API + job queue |
| Photos / compare | `photoAi.ts` | Vision diff service |
| Pointage OCR | Simulated | Document AI / worker |
| Assistant / Site Director | Rule-based + fake AI | OpenAI with guardrails |
| Purchase search | Demo catalog | Supplier APIs + search |
| Situation analysis | Rule engine from form | LLM + live project data |

---

## 7. Security

- [ ] No secrets in git or `dist`  
- [ ] CORS allowlist production domains only  
- [ ] Upload size limits (multer)  
- [ ] Rate limiting on `/api/v1/*`  

---

## 8. i18n production

- [ ] Default `fr`; test `ar` RTL on mobile Safari/Chrome  
- [ ] PDF/Excel exports reviewed FR/AR  
- [ ] `fallbackLng: 'fr'` confirmed  

---

## 9. Performance

- [ ] Lazy-load heavy pages (`PlanExtractionPage`, `SiteDirectorPage`, `DashboardPage`)  
- [ ] Target Lighthouse mobile performance > 80  
- [ ] Image compression for photo uploads  

---

## 10. Monitoring

- [ ] Sentry (or equivalent) on frontend + API  
- [ ] Health endpoint monitoring  
- [ ] Log plan extraction job failures  

---

## 11. Post-deploy smoke (15 min)

1. Dashboard loads, charts visible  
2. Create/edit chantier (`/suivi`)  
3. Upload photo (`/photos`)  
4. Purchase search FR + AR (`/assistant-achat`)  
5. Situation analysis + export (`/analyse-situation-chantier`)  
6. Plan upload with API on (`/plan-extraction`)  
7. Pilotage scores (`/pilotage`)  

---

## 12. Rollback

- [ ] Previous `dist` artifact retained  
- [ ] DB migration backup before deploy  
- [ ] API version pinned (`/api/v1`)  

---

## Sign-off

| Role | Name | Date | OK |
|------|------|------|-----|
| Development | | | |
| QA | | | |
| Product | | | |

**Build status:** ✅ `npm run build` successful (final audit).
