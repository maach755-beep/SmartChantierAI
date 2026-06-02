# SmartChantier AI — Pre-Launch QA Report

**Date:** 2026-05-31  
**Role:** Pre-launch manual QA (code review + build verification)  
**Build:** `npm run build` ✅ · `npm run lint` ✅ (0 errors)

---

## Scope

All routes registered in `src/App.tsx` (35 pages + 2 redirects + 404), sidebar sections, exports, tables, FR/AR i18n, mobile layout patterns.

---

## Page matrix

| Route | Page | Status | Notes |
|-------|------|--------|-------|
| `/` | Dashboard | ✅ | Charts via `ChartContainer` / `SafeChart` |
| `/projets` | Projects | ✅ | CRUD modals, links to suivi/taches/materiaux |
| `/taches` | Tasks | ✅ | `?chantier=` filter from site detail |
| `/equipe` | Team | ✅ | Data populated |
| `/materiaux` | Materials stock | ✅ | `?chantier=` filter |
| `/documents` | Documents | ✅ | |
| `/analyse-ia` | AI hub | ✅ | Analysis + quick nav |
| `/plan-extraction` | Plan extraction | ✅ | API offline banner; needs `api:plan` for full flow |
| `/plans` | Plan analysis | ✅ | |
| `/photos` | Photo upload | ✅ | |
| `/photo-comparison` | Photo compare | ✅ | `?chantier=` |
| `/assistant` | Assistant | ✅ | FR/AR |
| `/analyse-situation-chantier` | Situation IA | ✅ | |
| `/assistant-achat` | Purchase IA | ✅ | Export buttons + tiers |
| `/assistant-directeur-ia` | Director IA | ✅ | Cards + history |
| `/bibliotheque-materiaux` | Materials library | ✅ | 20 seed items |
| `/assistant-devis-ia` | Devis IA | ✅ | Generate from demo data |
| `/centre-rentabilite` | Profitability | ✅ | Filter + chart (fixed) |
| `/journal-chantier-ia` | Site journal | ✅ | Upload + analyze |
| `/detection-retard` | Delay detection | ✅ | Green/orange/red |
| `/revetements` | Flooring | ✅ | Save works |
| `/suivi` | Site tracking | ✅ | |
| `/suivi/:id` | Site detail | ✅ | Invalid id → proper 404 UI (fixed) |
| `/modifications` | Modifications | ✅ | PDF export |
| `/risques` | Risks | ✅ | |
| `/contrat` | Contract | ✅ | |
| `/pointage` | Attendance | ✅ | OCR sim |
| `/fournisseurs` | Suppliers | ✅ | |
| `/finances` | Finance | ✅ | |
| `/planning` | Planning | ✅ | |
| `/terrain` | Field → office | ✅ | |
| `/rapports` | Reports | ✅ | PDF/Excel/CSV + export-ready label |
| `/recherche` | Search | ✅ | |
| `/pilotage` | Command center | ✅ | Site director engine |
| `/parametres` | Settings | ✅ | Reset confirm + roles |
| `/centre-pilotage` | Redirect | ✅ | → `/pilotage` |
| `/directeur-ia-chantier` | Redirect | ✅ | → `/pilotage` |
| `*` | 404 | ✅ | FR/AR message |

---

## Bugs found and fixed

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| PL-001 | High | **Centre de Rentabilité:** KPI detail always showed first chantier when another was selected in dropdown | `selected` now follows `chantierId` filter |
| PL-002 | Medium | **Profitability chart:** Double `ResponsiveContainer` (Recharts warning risk) | Removed inner container; `SafeChart` only |
| PL-003 | Medium | **Profitability chart:** Empty chart when no rooms | Show `profit.noChartData` message |
| PL-004 | Medium | **`/suivi/:id` invalid ID:** Bare “no data” line, no navigation | Full not-found block + back to `/suivi` |
| PL-005 | Low | **Suppliers table:** Column header hardcoded `Nom` | `t('suppliers.name')` |
| PL-006 | Low | **Modifications table:** Header `Titre` not translated | `t('modifications.modTitle')` |
| PL-007 | Low | **Risks table:** Headers `Type`, `Description`, `Score` in English/French mix | `common.*` + `risks.colLevel` |
| PL-008 | Low | **Risks recommendations:** Hardcoded French bullets | `risks.reco1`–`reco3` FR/AR |
| PL-009 | Low | **Site detail / risks:** `jours` / `j` hardcoded | `common.days` / `common.daysShort` |
| PL-010 | Low | **Journal history:** English `photo(s)` in list | `journal.historyEntry` i18n |
| PL-011 | Low | **Materials library:** Ellipsis on short descriptions | Truncate only if length > 40 |
| PL-012 | Low | **Purchase budget cards:** Crash risk on empty `whyRecommended` slice | Safe truncate |
| PL-013 | Low | **Finance:** Division by zero if `budgetPlanned === 0` | Guard ratio |
| PL-014 | Low | **Plan extraction:** Column `Ref` not translated | `planExtraction.ref` |

---

## Verified OK (no code change)

- Sidebar mobile closes on nav click (`onClick` → `setMobileOpen(false)`).
- Tables use `table-scroll` / `overflow-x-auto` on `DataTable`.
- Export menu shows “Export prêt pour intégration” on reports.
- Settings reset uses confirm modal + toast.
- Lazy routes + `PageLoader` for all pages.
- Purchase / situation / director modules have demo data paths.

---

## Known limitations (not bugs — demo scope)

| Item | Impact |
|------|--------|
| Plan Extraction API offline without `npm run api:plan` | Upload/analysis falls back or shows API banner |
| Simulated AI (no live LLM) | Expected in demo |
| Journal analyze without photo still runs (min 1 photo count) | Demo behaviour; user may expect upload required |
| `pageLinks` QuickNav omits Phase 4 BI routes | Minor; full nav in sidebar |
| Pilotage + “Directeur IA” share one page | Documented redirects |
| Some plan extraction / EN labels via `en` extends `fr` | Acceptable |

---

## i18n

- **FR:** Complete for fixed keys (`common.name`, `sites.notFound`, `risks.reco*`, `journal.historyEntry`, etc.).
- **AR:** Matching keys added for all fixes above.
- **EN:** Extends FR via `en.ts` spread.

---

## Mobile / visual

- Sidebar drawer + overlay on `< lg`.
- Cards and grids use `sm:` / `md:` / `lg:` breakpoints on Phase 4 pages.
- No horizontal overflow issues identified in table components.

---

## Regression commands

```bash
npm install
npm run build
npm run lint
npm run dev
```

Manual smoke: toggle **AR**, open each sidebar section, test **Paramètres → reset demo**, **Rapports** exports, **Centre de Rentabilité** chantier filter.

---

## Sign-off

| Check | Result |
|-------|--------|
| Build | **PASS** |
| Lint | **PASS** |
| Blocking bugs | **0 open** (14 fixed in this pass) |
| Ready for demo deployment | **Yes** (with API/plan limitations documented) |
