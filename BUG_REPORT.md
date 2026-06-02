# SmartChantier AI — Bug Report

**Last verified:** `npm run build` ✅ · `npm run lint` ✅ (0 errors)

---

## Fixed (stabilization pass)

| ID | Severity | Summary | Location |
|----|----------|---------|----------|
| BUG-011 | **Blocker** | Mismatched quotes in `fakeAi.ts` broke `tsc` | `src/services/fakeAi.ts` (lines 52, 75) |
| BUG-012 | Low | Unused `ReactNode` import | `src/App.tsx` |
| BUG-013 | Low | Duplicate imports in purchase page | `PurchaseAssistantPage.tsx` |
| BUG-014 | Low | Missing `assistant.thinking` i18n key | `fr.ts`, `ar.ts` |
| BUG-101 | Info | Monolithic bundle > 500 kB | **Fixed** — lazy routes in `App.tsx` |

---

## Fixed (prior audits)

| ID | Summary |
|----|---------|
| BUG-001–010 | Charts, flooring, ESLint, 404 i18n, routes, hooks — see prior QA |

---

## Open — by design (demo)

| ID | Severity | Summary | Mitigation |
|----|----------|---------|------------|
| BUG-102 | Medium | Plan Extraction needs `api:plan` for full server pipeline | Run API or use client simulation |
| BUG-103 | Info | Pilotage = one page for two menu names | Redirects documented |
| BUG-106 | High* | No Supabase in UI | *Production — see DEPLOYMENT_CHECKLIST |
| BUG-107 | Medium* | Simulated OCR / Vision / purchase | *Wire real APIs |

---

## Open — low priority

| ID | Summary |
|----|---------|
| BUG-204 | Dedicated EmptyState on every non-table page |
| BUG-201 | Playwright E2E all routes |

---

## Regression commands

```bash
npm run build
npm run lint
```
