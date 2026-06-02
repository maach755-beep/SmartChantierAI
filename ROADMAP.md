# SmartChantier AI — Roadmap

## Phase 4 — Business Intelligence ✅ (2026-05-31)

- [x] Assistant Directeur IA (`/assistant-directeur-ia`)
- [x] Assistant Achat Pro — tiers + partenaires futurs
- [x] Bibliothèque Matériaux (`/bibliotheque-materiaux`)
- [x] Assistant Devis IA (`/assistant-devis-ia`)
- [x] Centre de Rentabilité (`/centre-rentabilite`)
- [x] Journal Chantier IA (`/journal-chantier-ia`)
- [x] Détection Retard (`/detection-retard`)
- [x] Structures multi-société (`organization.ts`, `demoOrg.ts`)

Voir `PHASE4_REPORT.md`.

---

## Phase 1 — Stabilisation démo ✅

- [x] Build & lint sans erreur
- [x] Lazy routes + chunks par module
- [x] Toasts, confirmations reset, exports avec message d’intégration
- [x] Données démo v6 + réparation orphelins
- [x] Assistant IA actionnable (plan, responsable, priorité, gains)
- [x] Assistant achat : économique / équilibré / premium + risques livraison
- [x] Plan extraction : confiance %, statut « À vérifier »
- [x] Rôles auth documentés (sans login forcé)
- [x] Responsive : sidebar mobile, tables scroll, cartes compactes

## Phase 2 — Backend & auth (Q3)

- [ ] Supabase : projets, chantiers, utilisateurs, RLS
- [ ] Login (email / SSO entreprise)
- [ ] Mapping rôles → permissions par module
- [ ] API Plan Extraction sur PostgreSQL (remplacer `jsonStore`)

## Phase 3 — IA production (Q4)

- [ ] OpenAI Vision / OCR réel sur plans PDF/JPG
- [ ] Assistant conversationnel branché LLM + contexte chantier
- [ ] Recherche achat : prix fournisseurs réels (API ou crawl contrôlé)
- [ ] Analyse photos chantier temps réel

## Phase 4 — Mobile & terrain (Q1+1)

- [ ] PWA offline léger (photos, pointage)
- [ ] Sync Terrain → Bureau
- [ ] Notifications push chantier

## Phase 5 — Entreprise (Q2+1)

- [ ] Multi-société / multi-chantiers
- [ ] Facturation SaaS
- [ ] Exports PDF/Excel natifs (jsPDF, ExcelJS)
- [ ] Tableaux de bord direction consolidés

## Non prévu en démo

- Paiement en ligne
- Signature électronique légale
- Comptabilité complète
