# AI Site Director (Phase 4)

Virtual **Operations Director** for construction companies — analyzes portfolio data and outputs actionable management decisions.

## Architecture

| Layer | Path |
|-------|------|
| Domain + engine | `shared/site-director/engine.ts`, `qa.ts`, `types.ts` |
| Frontend | `src/pages/SiteDirectorPage.tsx` (`/pilotage`) |
| Snapshot builder | `src/services/siteDirector/buildSnapshot.ts` |
| Learning memory | `src/services/siteDirector/learningStore.ts` (localStorage) |
| API | `POST /api/v1/site-director/analyze`, `/ask`, `/briefing` |

## Health score (0–100)

Weighted dimensions from real project data:

- Budget (burn rate)
- Planning (delays, status)
- Productivity (attendance, blocked tasks)
- Safety (risk flags)
- Quality (pending modifications)
- Risk (critical/moderate risks)

## SaaS

Engine is pure functions — run on client or server with the same `SiteDirectorSnapshot` JSON. Connect PostgreSQL later by building snapshots from DB queries.

## Run

```bash
npm run dev          # UI — /pilotage
npm run api:plan     # Optional API mirror
```
