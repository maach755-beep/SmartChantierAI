# SmartChantierAI — Development Roadmap

**Last updated:** 2026-06-03  
**Repository:** https://github.com/maach755-beep/SmartChantierAI

---

## Completed (Production Upgrade v4)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | Auth: login, register, forgot password | ✅ |
| 1 | Roles: Admin, Project Manager, Site Manager, Client | ✅ |
| 1 | Route protection + role-based access | ✅ |
| 2 | Supabase schema migration (`supabase/migrations/001_core_schema.sql`) | ✅ |
| 2 | `db` repository layer (`src/services/database/supabaseRepository.ts`) | ✅ |
| 3 | AI production modules (`src/services/aiProduction/`) | ✅ |
| 4 | PDF: devis, BC, fiche technique, rapport chantier | ✅ |
| 5 | Enterprise sidebar + responsive layout + user header | ✅ |
| 6 | `DEVELOPMENT_ROADMAP.md`, `BUSINESS_PLAN.md`, `INVESTOR_PITCH.md` | ✅ |

---

## Phase 1 — Auth & Security (Q2 2026)

- [x] Supabase Auth integration (optional — local demo fallback)
- [x] Role model (4 production roles)
- [ ] Email verification enforcement in production
- [ ] MFA for admin accounts
- [ ] Session timeout + refresh token rotation policies
- [ ] Audit log table (`audit_events`)

---

## Phase 2 — Database (Q2–Q3 2026)

- [x] SQL schema for 9 core tables
- [ ] Run migration on production Supabase project
- [ ] Sync `dataStore` localStorage → Supabase bidirectional
- [ ] Row-level security policies per role (client sees own projects only)
- [ ] Real-time subscriptions for notifications
- [ ] Database backups + PITR

---

## Phase 3 — AI Production (Q3 2026)

- [x] OCR invoice / quotation readers (heuristic + OpenAI)
- [x] Technical sheet extractor (Tavily + normalizer)
- [x] Material recommendation engine
- [x] Supplier comparison engine
- [x] Risk detection AI (chantier compliance)
- [ ] Server-side PDF OCR pipeline (no browser `pdf-parse`)
- [ ] OpenAI Vision for plan JPG/PNG
- [ ] Fine-tuned BTP material embeddings catalog

---

## Phase 4 — Documents & Compliance (Q3 2026)

- [x] Unicode PDF stack (FR/AR)
- [ ] Legal e-signature integration
- [ ] Factur-X / e-invoicing France
- [ ] Automated BC → invoice matching

---

## Phase 5 — UX & Mobile (Q4 2026)

- [x] Tablet/desktop max-width layout
- [x] Collapsible enterprise sidebar
- [ ] PWA offline mode (photos, pointage)
- [ ] Native mobile app (React Native)
- [ ] Push notifications (FCM)

---

## Phase 6 — Enterprise & SaaS (2027)

- [ ] Multi-tenant billing (Stripe)
- [ ] White-label per entreprise BTP
- [ ] API publique partenaires (Point P, BigMat)
- [ ] SOC2 / RGPD documentation pack

---

## Priority backlog (next sprints)

1. **P0** — Deploy Supabase + configure `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
2. **P0** — Server OCR endpoint for PDF invoices
3. **P1** — Migrate chantiers/tasks to Supabase reads in UI
4. **P1** — Vitest unit tests for auth + PDF validators
5. **P2** — CI GitHub Actions (lint, build, verify:production)

---

## Demo accounts (local auth mode)

| Email | Password | Role |
|-------|----------|------|
| admin@smartchantier.fr | Admin123! | Admin |
| chef.projet@smartchantier.fr | Projet123! | Project Manager |
| chantier@smartchantier.fr | Chantier123! | Site Manager |
| client@smartchantier.fr | Client123! | Client |
