/**
 * Live procurement test — Tavily direct API + product page filter.
 * Usage: node scripts/test-procurement-live.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const QUERY =
  'Carrelage extérieur 60x60 terrasse 80m² budget 35€/m² Nice';

const BTP_DOMAINS = [
  'pointp.fr', 'bigmat.fr', 'gedimat.fr', 'chausson.fr', 'leroymerlin.fr',
  'lpb.fr', 'samse.fr', 'dispano.fr', 'cedeo.fr', 'fransbonhomme.fr',
];

const PRODUCT_PATH = [
  /\/produit[s]?\/[^/]+/i, /\/p\/[^/]+/i, /\/\d{5,}/i, /\/catalogue\/[^/]+\/[^/]+/i,
];

const NON_PRODUCT = [
  /^\/$/i, /\/catalogue\/?$/i, /\/categor/i, /\/magasin/i, /\/agence/i, /\/recherche/i,
];

function loadEnv() {
  const p = resolve(process.cwd(), '.env');
  if (!existsSync(p)) return '';
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (k === 'VITE_TAVILY_API_KEY') return v;
  }
  return process.env.VITE_TAVILY_API_KEY ?? '';
}

function isProductUrl(url, title, content) {
  let path = '';
  try { path = new URL(url).pathname.toLowerCase(); } catch { return false; }
  if (NON_PRODUCT.some((r) => r.test(path))) return false;
  if (/^accueil|^catalogue/i.test(title)) return false;
  if (PRODUCT_PATH.some((r) => r.test(path))) return true;
  const segs = path.split('/').filter(Boolean);
  return segs.length >= 3 && /\d/.test(path);
}

function detectSupplier(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    const map = {
      'pointp.fr': 'Point P', 'bigmat.fr': 'BigMat', 'gedimat.fr': 'Gedimat',
      'chausson.fr': 'Chausson Matériaux', 'leroymerlin.fr': 'Leroy Merlin Pro',
      'samse.fr': 'Samse', 'dispano.fr': 'Dispano', 'cedeo.fr': 'CEDEO',
      'fransbonhomme.fr': 'Frans Bonhomme', 'lpb.fr': 'La Plateforme du Bâtiment',
    };
    for (const [d, name] of Object.entries(map)) {
      if (h === d || h.endsWith('.' + d)) return name;
    }
  } catch { /* */ }
  return null;
}

function parsePrice(text) {
  const m = text.match(/(\d{1,4}(?:[.,]\d+)?)\s*€/i);
  if (m) {
    const p = parseFloat(m[1].replace(',', '.'));
    if (p > 0 && p < 5000) return p;
  }
  return null;
}

const key = loadEnv();
if (!key) {
  console.error('VITE_TAVILY_API_KEY missing in .env');
  process.exit(1);
}

const webQuery =
  'Carrelage extérieur 60x60 80 m² 35 €/m² Nice France fiche produit prix HT référence acheter professionnel';

const res = await fetch('https://api.tavily.com/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
  body: JSON.stringify({
    query: webQuery,
    search_depth: 'advanced',
    max_results: 20,
    include_raw_content: true,
    include_domains: BTP_DOMAINS,
    country: 'france',
  }),
});

if (!res.ok) {
  console.error('Tavily error', res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
const products = [];

for (const r of data.results ?? []) {
  if (!r.url || !r.title) continue;
  const content = `${r.content ?? ''} ${r.raw_content ?? ''}`;
  if (!isProductUrl(r.url, r.title, content)) continue;
  const supplier = detectSupplier(r.url);
  if (!supplier) continue;
  products.push({
    productName: r.title,
    supplier,
    priceEurHt: parsePrice(`${r.title} ${content}`),
    url: r.url,
    score: r.score,
  });
}

console.log('=== Test achat IA ===\n');
console.log('Requête utilisateur:', QUERY);
console.log('Requête Tavily:', webQuery);
console.log('Résultats bruts:', data.results?.length ?? 0);
console.log('Fiches produit:', products.length);
console.log('Ouverture auto: NON (bouton uniquement dans l\'UI)\n');

if (!products.length) {
  console.log('Aucune fiche produit — relancez depuis /recherche dans le navigateur.');
  process.exit(2);
}

for (const [i, p] of products.slice(0, 5).entries()) {
  console.log(`--- #${i + 1} ---`);
  console.log('Produit:', p.productName);
  console.log('Prix:', p.priceEurHt != null ? `${p.priceEurHt} € HT/m²` : 'À confirmer sur fiche');
  console.log('Fournisseur:', p.supplier);
  console.log('URL:', p.url);
  console.log('UI: bouton « Ouvrir dans navigateur externe » + copie URL');
  console.log('');
}
