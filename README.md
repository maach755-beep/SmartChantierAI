# SmartChantier AI

Plateforme SaaS de gestion de chantiers BTP **France uniquement** (EUR, TVA 20 %, normes DTU, réseau fournisseurs français) avec modules IA (mode démo local, prête pour intégration cloud).

## Langues

- **Français** (par défaut)
- **العربية** (arabe, RTL)

Commutateur dans la barre latérale ou **Paramètres**.

## Prérequis

- Node.js 20+
- npm 10+

## Commandes

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # sortie dist/
npm run preview  # prévisualiser le build
npm run lint     # ESLint (0 erreur cible)
```

### APIs optionnelles (hors SPA)

```bash
npm run api          # stub mobile :3000
npm run api:plan      # Plan Extraction API :3001
```

## Mode démo

- Données persistées dans **localStorage** (`DEMO_DATA_VERSION = 7`).
- Pays : **France** · Devise : **EUR** (pas de sélecteur pays/devise).
- Réinitialisation : **Paramètres → Réinitialiser les données démo** (confirmation modale).
- Réparation des liens orphelins au chargement (`demoRepair.ts`, `syncOrphanRecords`).
- IA, OCR, vision et recherche achat : **simulations** avec réponses actionnables (plans, économies, responsables).

## Modules principaux

| Module | Route |
|--------|-------|
| Tableau de bord | `/` |
| Projets | `/projets` |
| Tâches | `/taches` |
| Suivi chantier | `/suivi`, `/suivi/:id` |
| Équipes | `/equipe` |
| Stock matériaux | `/materiaux` |
| Documents | `/documents` |
| Analyse IA (hub) | `/analyse-ia` |
| Plan Extraction IA | `/plan-extraction` |
| Analyse Plans IA | `/plans` |
| Revêtements / Sols | `/revetements` |
| Photos chantier | `/photos` |
| Comparaison Photos IA | `/photo-comparison` |
| Assistant IA | `/assistant` |
| Analyse situation chantier | `/analyse-situation-chantier` |
| Assistant Achat IA | `/assistant-achat` |
| Modifications / Avenants | `/modifications` |
| Risques | `/risques` |
| Contrôle contrat | `/contrat` |
| Pointage OCR | `/pointage` |
| Fournisseurs | `/fournisseurs` |
| Finances | `/finances` |
| Planning | `/planning` |
| Terrain → Bureau | `/terrain` |
| Rapports | `/rapports` |
| Recherche | `/recherche` |
| Centre de pilotage / Directeur IA | `/pilotage` (alias `/centre-pilotage`, `/directeur-ia-chantier`) |
| **Assistant Directeur IA** (Phase 4) | `/assistant-directeur-ia` |
| **Bibliothèque Matériaux** | `/bibliotheque-materiaux` |
| **Assistant Devis IA** | `/assistant-devis-ia` |
| **Centre de Rentabilité** | `/centre-rentabilite` |
| **Journal Chantier IA** | `/journal-chantier-ia` |
| **Détection Retard** | `/detection-retard` |
| Paramètres | `/parametres` |

## Architecture

```
src/
  components/ui/   # EmptyState, LoadingBlock, ExportMenu, DataTable…
  contexts/        # Toast, Sidebar, Notifications
  pages/           # Modules (lazy-loaded)
  layouts/         # MainLayout, Sidebar (mobile drawer)
  services/        # dataStore, fakeAi, export, purchase, plan
  types/           # auth roles (futur), métier
  i18n/            # fr, ar, en
server/            # Plan Extraction API (Express + JSON store)
shared/            # Schéma SQL Supabase-ready
```

## UX & qualité (stabilisation)

- Toasts globaux + modales de confirmation (`ToastContext`)
- Tables avec état vide (`DataTable` + `EmptyState`)
- Exports PDF/Excel/CSV : téléchargement démo + libellé **Export prêt pour intégration**
- Routes **lazy** : bundle initial ~398 kB (Recharts isolé dans `SafeChart`)

## Évolutions prévues

### Supabase / PostgreSQL

- Schéma : `shared/plan-extraction/schema.sql`
- Remplacer `dataStore` localStorage par client Supabase + RLS par rôle
- Rôles préparés : `admin`, `project_manager`, `site_manager`, `worker`, `viewer` (`src/types/auth.ts`)

### AI Vision API

- Brancher `VISION_API_URL` sur l’API Plan Extraction (`server/`)
- Remplacer `fakeAi.ts` et simulations OCR par appels OpenAI Vision / service OCR métier

## Documentation projet

| Fichier | Contenu |
|---------|---------|
| `QA_REPORT.md` | Audit build, routes, i18n |
| `BUG_REPORT.md` | Bugs corrigés / ouverts |
| `DEPLOYMENT_CHECKLIST.md` | Déploiement SPA + API |
| `ROADMAP.md` | Jalons produit |
| `PHASE4_REPORT.md` | Livraison Business Intelligence |

## Licence

Projet privé — usage interne / démo.
