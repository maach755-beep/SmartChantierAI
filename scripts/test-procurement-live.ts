/**
 * Live procurement test (Tavily + product filter).
 * Usage: npx tsx scripts/test-procurement-live.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseProcurementQuery } from '../src/services/procurement/queryParser.ts';
import { runProcurementSearch } from '../src/services/procurement/procurementSearchEngine.ts';
import { isRealWebSearchEnabled } from '../src/services/realSearch/config.ts';

function loadDotEnv(): void {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

const QUERY =
  'Carrelage extérieur 60x60 terrasse 80m² budget 35€/m² Nice';

async function main() {
  loadDotEnv();
  process.env.NODE_ENV = 'development';

  console.log('=== SmartChantier — test achat IA ===\n');
  console.log('Recherche:', QUERY);
  console.log('Tavily configuré:', isRealWebSearchEnabled() ? 'OUI' : 'NON');
  if (!isRealWebSearchEnabled()) {
    console.error('\nAjoutez VITE_TAVILY_API_KEY dans .env');
    process.exit(1);
  }

  const parsed = parseProcurementQuery(QUERY);
  console.log('\nCompris:', {
    material: parsed.materialType,
    qty: `${parsed.quantity} ${parsed.unit}`,
    budget: parsed.maxBudgetPerUnit,
    city: parsed.location,
    project: parsed.projectType,
  });

  console.log('\nAppel moteur (Tavily direct API)...\n');
  const result = await runProcurementSearch(QUERY);

  console.log('Source:', result.resultOrigin, '|', result.providerNote);
  console.log('Produits:', result.results.length, '\n');

  if (result.results.length === 0) {
    process.exit(2);
  }

  const top = result.results.slice(0, 5);
  for (const [i, p] of top.entries()) {
    console.log(`--- #${i + 1} ---`);
    console.log('Produit:', p.productName);
    console.log('Prix:', p.priceEurHt > 0 ? `${p.priceEurHt} € HT/${p.unit}` : 'À confirmer sur fiche');
    console.log('Fournisseur:', p.supplier);
    console.log('URL:', p.url ?? '(aucune)');
    console.log('Bouton UI: « Ouvrir dans navigateur externe » (pas d\'ouverture auto)');
    console.log('Score:', p.scores.composite, '|', p.sourceLabel);
    console.log('');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
