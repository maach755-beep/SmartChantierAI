# SmartChantierAI — SaaS Roadmap

## Phase 1 — Foundation (done)

- Supabase Auth + RLS schema (`supabase/migrations/001_core_schema.sql`, `002_technical_sheets_storage.sql`)
- Platform data layer (`src/services/saas/platform.ts`) with Supabase + localStorage fallback
- CRUD: projects, suppliers, quotations, purchase orders
- Dashboard metrics from database
- PDF: devis, bon de commande, rapport chantier, fiche technique

## Phase 2 — Production hardening (next)

| Item | Priority |
|------|----------|
| Migrate tasks, photos, attendance to Supabase tables | High |
| Real-time subscriptions (Supabase Realtime) on dashboard | High |
| Row-level security per `company_id` / tenant | High |
| Stripe billing + plans | Medium |
| Email notifications (Resend / Supabase) | Medium |
| Mobile app sync via `/api/v1` persistence | Medium |

## Phase 3 — AI & procurement

- Tavily + Ollama in production (see `DEPLOYMENT_GUIDE.md`)
- Supplier catalog sync to `materials` table
- Automated expensive-quotation workflow + approval
- Multi-tenant procurement policies

## Phase 4 — Enterprise

- SSO (SAML/OIDC)
- Audit logs
- White-label domains
- France DTU compliance pack export

## Success metrics

- 100% dashboard KPIs from DB (no static demo charts)
- < 2s P95 page load on 4G
- Auth + CRUD covered by E2E tests
