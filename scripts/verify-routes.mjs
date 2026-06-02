const port = process.argv[2] || '5173';
const base = `http://localhost:${port}`;
const routes = [
  '/',
  '/projets',
  '/taches',
  '/equipe',
  '/materiaux',
  '/analyse-ia',
  '/photos',
  '/plans',
  '/suivi',
  '/suivi/ch_1',
  '/modifications',
  '/risques',
  '/contrat',
  '/pointage',
  '/fournisseurs',
  '/finances',
  '/planning',
  '/terrain',
  '/photo-comparison',
  '/rapports',
  '/assistant',
  '/recherche',
  '/pilotage',
  '/parametres',
];

let failed = 0;
for (const route of routes) {
  try {
    const res = await fetch(`${base}${route}`);
    const html = await res.text();
    if (!res.ok || !html.includes('root')) {
      console.error(`FAIL ${route}`);
      failed++;
    } else {
      console.log(`OK   ${route}`);
    }
  } catch (e) {
    console.error(`FAIL ${route} → ${e.message}`);
    failed++;
  }
}
process.exit(failed > 0 ? 1 : 0);
