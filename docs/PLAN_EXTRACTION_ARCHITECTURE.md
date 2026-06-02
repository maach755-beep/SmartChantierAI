# Plan Extraction AI — Architecture (Phase 3)

Production-ready, multi-tenant SaaS architecture for construction plan OCR, material databases, devis, and field photo sync.

## Layers

| Layer | Path | Role |
|-------|------|------|
| Domain | `shared/plan-extraction/types.ts` | Canonical types (frontend + API + DB) |
| Database | `shared/plan-extraction/schema.sql` | PostgreSQL schema (Supabase-ready) |
| API | `server/` | Express REST, repositories, file storage |
| AI | `server/services/ai/` | Pluggable OCR, color detection, comparison |
| Export | `server/services/export/` | CSV, Excel XML, PDF text |
| Devis | `server/services/devis/` | HT, margin, VAT calculations |
| Mobile | `server/services/mobile/` | Field photo ingest + plan compare |
| Frontend | `src/pages/plan-extraction/` | UI wired to `planExtractionApi` |

## AI provider strategy (no demo random data)

1. **HeuristicTextExtractor** — Parses PDF text layers and plan text (rooms, m², legends S1–S4, brands).
2. **VisionApiOcrProvider** — When `VISION_API_URL` + `VISION_API_KEY` are set, forwards images to your vision service.
3. **ColorDetectionService** — Uses OCR zones or external `COLOR_API_URL`.
4. **PlanPhotoComparisonService** — Returns structured zeros + configuration alert until vision compare endpoint is live.

Status `needs_vision_api` is returned when image-only plans lack extractable text.

## SaaS multi-tenancy

- Header `X-Tenant-Id` on every API call (default `tenant_default`).
- `tenants`, `organization_members`, role enum in domain types.
- Ready to map to Auth0 / Supabase RLS.

## Run locally

```bash
npm install
cp .env.example .env
npm run api:plan    # API :3001
npm run dev         # UI :5173 (proxies /api)
```

## Key endpoints

- `POST /api/v1/plan-extraction/projects/:id/upload` — Plan file → extraction pipeline
- `GET /api/v1/plan-extraction/projects/:id/kpis` — Dashboard KPIs
- `GET /api/v1/plan-extraction/extractions/:jobId/export/:format` — csv | pdf | excel
- `POST /api/v1/plan-extraction/projects/:id/devis` — Quotation from extraction
- `POST /api/v1/plan-extraction/projects/:id/changes` — Client material change + avenant text
- `POST /api/v1/plan-extraction/projects/:id/field-photo` — Mobile photo sync + alerts
- `POST /api/v1/plan-extraction/assistant` — BTP Q&A on extracted context

## Future commercialization

- Swap `server/db/jsonStore.ts` for PostgreSQL repositories implementing the same interfaces.
- Deploy API as container; connect OpenAI Vision / Azure Document Intelligence via `VisionApiOcrProvider`.
- Per-tenant storage buckets for uploads (S3 / Azure Blob).
