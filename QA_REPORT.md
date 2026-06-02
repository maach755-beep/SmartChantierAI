# SmartChantier AI — QA Report (Stabilization Pass)

**Date:** 2026-05-31  
**Verified:** `npm install` · `npm run build` ✅ · `npm run lint` ✅ (0 errors)  
**Demo data:** `DEMO_DATA_VERSION = 6`

---

## Executive summary

Stabilization pass completed before deployment testing. Build passes with **route-based code splitting** (main chunk ~398 kB gzip ~127 kB; Recharts in separate `SafeChart` chunk). UX infrastructure (toasts, confirm modals, empty/loading states, export menu) is in place; list pages use `DataTable` empty states. Authentication is **not enforced**; roles are documented in Settings.

---

## 1. Build & lint

| Check | Result |
|-------|--------|
| `npm run build` | **PASS** |
| `npm run lint` | **PASS** (0 errors) |
| TypeScript strict | **PASS** |
| Bundle warning (>500 kB single chunk) | **Resolved** via `React.lazy` on all pages |

---

## 2. Stabilization deliverables

| Area | Status | Notes |
|------|--------|-------|
| Toasts + confirm modals | ✅ | `ToastContext`, Settings reset |
| Empty / loading states | ✅ | `DataTable`, Purchase, Assistant, shared components |
| Export readiness | ✅ | `ExportMenu` + `common.exportReady`; Reports wired |
| Demo data consistency | ✅ | `demoRepair.ts`, `syncOrphanRecords()` |
| AI assistant (actionable) | ✅ | `fakeAi.ts` — plans, responsable, gains |
| Purchase tiers | ✅ | économique / équilibrée / premium + supplier/delivery |
| Plan extraction metadata | ✅ | Server tables: `Confiance %`, `Statut` |
| Auth roles (future) | ✅ | `src/types/auth.ts`, Settings preview |
| Mobile CSS | ✅ | `table-scroll`, compact `glass-card` @640px |
| Lazy routes | ✅ | `App.tsx` + `Suspense` + `PageLoader` |
| Documentation | ✅ | README, ROADMAP, this file, BUG, DEPLOYMENT |

---

## 3. Routing (sample)

All sidebar routes resolve to lazy-loaded pages. Aliases: `/centre-pilotage`, `/directeur-ia-chantier` → `/pilotage`. 404: `NotFoundPage`.

---

## 4. i18n (FR / AR)

Core keys for stabilization: `common.emptyTitle`, `emptyHint`, `exportReady`, `errorGeneric`; `settings.resetConfirm*`; `purchase.supplierType`, `deliveryRisk`, `whyReco`, `whyAvoid`; `assistant.thinking`.

EN extends FR for most modules.

---

## 5. Manual test checklist

- [ ] `npm run dev` — home, AR RTL, mobile sidebar toggle
- [ ] Settings → reset demo → confirm → reload
- [ ] `/assistant-achat` — search, budget tiers, toasts
- [ ] `/plan-extraction` — upload (API optional `npm run api:plan`)
- [ ] `/rapports` — PDF / Excel / CSV export labels
- [ ] No console errors on dashboard charts (`SafeChart`)

---

## 6. Known limitations (demo)

| Item | Severity |
|------|----------|
| No real Supabase / login | Expected |
| OCR / Vision / LLM simulated | Expected |
| Plan API optional (offline fallback in UI) | Medium |
| Not every page has bespoke EmptyState (tables cover most lists) | Low |
| Pilotage = one page, two menu labels | Info |

---

## 7. Commands run (final)

```bash
npm install
npm run build   # exit 0
npm run lint    # exit 0
```

`npm run dev` — run locally for smoke test (not automated in CI here).

---

## 8. Regression

Re-run before release:

```bash
npm run build && npm run lint
```
