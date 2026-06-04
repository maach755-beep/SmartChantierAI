/**
 * Client-side Ollama AI tests (procurement, no API server required).
 * Run: npx tsx --tsconfig tsconfig.app.json scripts/test-ai-client.ts
 */
import { writeFileSync } from 'node:fs';

const out = { passed: [], failed: [] };

async function run() {
  const { resolveParsedQuery, generateLlmProcurementSummary } = await import(
    '../src/services/procurement/llmAnalysis.ts'
  );
  const { runProcurementSearch } = await import('../src/services/procurement/procurementSearchEngine.ts');

  try {
    const parsed = await resolveParsedQuery('carrelage 60x60 terrasse Paris 120 m2 budget 35 euros');
    if (!parsed.materialType && !parsed.parsedByAi) throw new Error('parse failed');
    out.passed.push(`AI purchase assistant — query parse (provider: ${parsed.llmProvider ?? 'rules'})`);

    const search = await runProcurementSearch('carrelage 60x60 terrasse Paris 120 m2 budget 35 euros');
    if (!search.results.length) throw new Error('no procurement results');
    out.passed.push(`AI purchase assistant — search (${search.results.length} products)`);

    const llm = await generateLlmProcurementSummary(parsed, search.results, search.insightText);
    if (!llm.summary) throw new Error('empty summary');
    out.passed.push(`AI purchase assistant — summary (provider: ${llm.provider ?? 'rules'})`);

    const suppliers = search.supplierRankings?.length ?? 0;
    if (suppliers < 1) throw new Error('no supplier rankings');
    out.passed.push(`Supplier recommendations — ${suppliers} ranked suppliers`);
  } catch (e) {
    out.failed.push({
      name: 'AI purchase / suppliers',
      error: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    const { generateTechnicalSheet } = await import('../src/services/technicalSheet/engine.ts');
    const sheet = await generateTechnicalSheet({
      productName: 'Carrelage grès cérame',
      reference: 'TEST-001',
      manufacturer: 'Test',
      supplierUrl: 'https://example.com',
      category: 'carrelage',
      useCase: 'terrasse',
      city: 'Paris',
    });
    if (!sheet.productName) throw new Error('empty sheet');
    out.passed.push('Technical sheet generator — demo engine');
  } catch (e) {
    out.failed.push({ name: 'Technical sheet', error: e instanceof Error ? e.message : String(e) });
  }

  try {
    const { runSituationAnalysis } = await import('../src/services/situationAnalysis/engine.ts');
    const r = runSituationAnalysis({
      siteName: 'Résidence Test',
      siteType: 'renovation',
      startDate: '2025-01-01',
      plannedEndDate: '2026-12-31',
      progressPercent: 40,
      budgetPlanned: 200000,
      budgetConsumed: 95000,
      workerCount: 12,
      tasksCompleted: 30,
      tasksDelayed: 4,
      missingMaterials: 'Carrelage palette 2',
      problemsEncountered: 'Pluie semaine 12',
      clientModifications: 'Aucune',
      supplierDelays: 'Livraison carrelage J+5',
      siteConstraints: 'Accès rue étroite',
    });
    if (!r.directorReport?.situationSummary) throw new Error('no analysis');
    out.passed.push('Project analysis (situation engine)');
  } catch (e) {
    out.failed.push({ name: 'Project analysis', error: e instanceof Error ? e.message : String(e) });
  }

  writeFileSync('scripts/.test-ai-client-result.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  if (out.failed.length) process.exit(1);
}

run();
