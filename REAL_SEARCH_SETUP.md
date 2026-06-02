# Recherche web réelle — Tavily (SmartChantier AI)

L’**Assistant Achat IA** (`/assistant-achat`) et la **Recherche Globale IA** (`/recherche`) utilisent l’API [Tavily](https://tavily.com) pour interroger le web sur les fournisseurs BTP français (Point P, BigMat, Gedimat, Chausson, Leroy Merlin Pro, La Plateforme du Bâtiment, Samse, Dispano, CEDEO, Frans Bonhomme).

Marché **France uniquement** · devise **EUR HT**.

---

## 1. Créer une clé API Tavily

1. Créez un compte sur [https://tavily.com](https://tavily.com).
2. Ouvrez le tableau de bord → **API Keys**.
3. Générez une clé (format `tvly-…`).
4. Copiez la clé — elle ne sera plus affichée en entier ensuite.

---

## 2. Ajouter la clé dans le projet

À la **racine** du projet (`SmartChantierAI/`), créez ou éditez le fichier `.env` :

```env
VITE_TAVILY_API_KEY=tvly-votre-cle-ici
VITE_TAVILY_MAX_RESULTS=10
VITE_TAVILY_SEARCH_DEPTH=advanced
```

Optionnel (proxy serveur en production, sans exposer la clé au navigateur) :

```env
TAVILY_API_KEY=tvly-votre-cle-ici
VITE_API_URL=http://localhost:3001
```

> Les variables `VITE_*` sont lues par Vite au démarrage. **Redémarrage obligatoire** après modification.

Référence : `.env.example`.

---

## 3. Redémarrer l’application

```bash
# Terminal 1 — frontend
npm run dev

# Terminal 2 (optionnel) — API locale pour proxy Tavily en build preview
npm run dev:server
```

Ouvrez **Paramètres** : l’indicateur doit afficher **Recherche web réelle : Activée**.

---

## 4. Comportement

| Situation | Affichage |
|-----------|-----------|
| Clé absente | Message *« Recherche web réelle non configurée… »* + résultats **Résultat démo** (badge orange) |
| Clé OK, Tavily répond | Badge **Recherche web réelle**, lien vers le site fournisseur, confiance % |
| Tavily échoue / 0 résultat | Fallback **Résultat démo** — jamais présenté comme web |

Exemple de requête utilisateur :

`carrelage extérieur 60x60 budget 35€/m² Nice`

Requête web envoyée à Tavily (extrait) :

`Carrelage 60x60 35 €/m² Nice France Point P BigMat Gedimat …`

---

## 5. Développement vs production

- **Dev** (`npm run dev`) : proxy Vite `/tavily` → `https://api.tavily.com` (évite CORS).
- **Prod / preview** : appels vers `VITE_API_URL/api/tavily/search` (route Express dans `server/routes/tavily.routes.ts`).

---

## 6. Dépannage

- **Toujours « Non configurée »** : vérifiez le nom exact `VITE_TAVILY_API_KEY`, pas d’espace, redémarrez `npm run dev`.
- **Erreur réseau / CORS** : en dev, utilisez bien `npm run dev` (proxy). En prod, lancez le serveur API avec `TAVILY_API_KEY`.
- **Peu de résultats** : les domaines fournisseurs sont filtrés ; élargissez la requête ou vérifiez les quotas Tavily.

Documentation Tavily : [https://docs.tavily.com](https://docs.tavily.com)
