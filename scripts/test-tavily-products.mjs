/**
 * Test fiches produit Tavily (Node, hors navigateur).
 * Usage: node scripts/test-tavily-products.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
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

loadEnv();
const key = process.env.VITE_TAVILY_API_KEY || process.env.TAVILY_API_KEY;
if (!key) {
  console.error('Missing VITE_TAVILY_API_KEY in .env');
  process.exit(1);
}

const query =
  'carrelage extérieur 60x60 35 €/m² Nice France fiche produit prix HT référence acheter professionnel';

const res = await fetch('https://api.tavily.com/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({
    query,
    search_depth: 'advanced',
    max_results: 10,
    include_raw_content: true,
    country: 'france',
  }),
});

if (!res.ok) {
  console.error('Tavily error', res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
console.log('Query:', query);
console.log('Raw results:', data.results?.length ?? 0);
for (const r of (data.results ?? []).slice(0, 5)) {
  console.log('---');
  console.log('Title:', r.title);
  console.log('URL:', r.url);
  console.log('Snippet:', (r.content ?? '').slice(0, 120));
}
