import { delayMs, formatCurrency } from '@/utils/format';
import type {
  ParsedProcurementQuery,
  ProcurementCostEstimate,
  ProcurementDeliveryEstimate,
  ProcurementProductResult,
  ProcurementSearchInsight,
  ProcurementSearchResponse,
  SupplierRanking,
} from '@/types/procurementSearch';
import { procurementConfig } from './config';
import { DEMO_SOURCE_LABEL } from '@/services/realSearch/config';
import { resolveParsedQuery, generateOpenAiProcurementSummary } from './openaiAnalysis';
import { computeCompositeScore } from './scoring';
import { formatDistance, getDistanceKm } from './supplierMeta';
import { fetchCatalogFromProviders } from './providers';
import type { CatalogItemDTO } from './providers/types';
import { WEB_PRODUCT_RESULTS_LIMIT } from '@/services/realSearch/types';

let searchCounter = 0;
function newSearchId() {
  searchCounter += 1;
  return `proc-${Date.now()}-${searchCounter}`;
}

function deliveryLabel(days: number): string {
  if (days <= 2) return `${days} j — express`;
  if (days <= 5) return `${days} j ouvrés`;
  return `${days} j — planifier livraison`;
}

function effectiveQuantity(parsed: ParsedProcurementQuery): number {
  return parsed.quantity > 0 ? parsed.quantity : 1;
}

function mapItem(dto: CatalogItemDTO, parsed: ParsedProcurementQuery): ProcurementProductResult {
  const distanceKm = getDistanceKm(dto.supplier, parsed.location);
  const qty = effectiveQuantity(parsed);
  const unitPrice =
    dto.priceEurHt > 0 ? dto.priceEurHt : parsed.maxBudgetPerUnit > 0 ? parsed.maxBudgetPerUnit : 0;
  const scores = computeCompositeScore(
    unitPrice,
    parsed.maxBudgetPerUnit,
    dto.qualityLevel,
    dto.recommendationScore,
    dto.deliveryDays,
    dto.stockStatus
  );

  return {
    id: dto.id,
    productName: dto.productName,
    brand: dto.brand,
    model: dto.model,
    supplier: dto.supplier,
    priceEurHt: unitPrice,
    unit: dto.unit,
    estimatedLineTotalHt: Math.round(unitPrice * qty * 100) / 100,
    stockStatus: dto.stockStatus,
    stockLabel: dto.stockQuantityLabel,
    deliveryDays: dto.deliveryDays,
    deliveryLabel:
      dto.resultOrigin === 'real_web' && dto.summary
        ? dto.technicalSpecs.find((s) => /livraison|agence|zone/i.test(s))?.slice(0, 80) ??
          deliveryLabel(dto.deliveryDays)
        : deliveryLabel(dto.deliveryDays),
    distanceKm,
    distanceLabel: formatDistance(distanceKm),
    technicalSpecs: dto.technicalSpecs,
    qualityLevel: dto.qualityLevel,
    scores,
    isBestProduct: false,
    isBestPrice: false,
    isBestValue: false,
    cheaperAlternative: dto.cheaperAlternative,
    betterQualityAlternative: dto.betterQualityAlternative,
    resultOrigin: dto.resultOrigin ?? 'demo',
    sourceLabel: dto.sourceLabel ?? DEMO_SOURCE_LABEL,
    url: dto.url,
    summary: dto.summary,
    confidence: dto.confidence,
  };
}

function assignBadges(results: ProcurementProductResult[]): void {
  if (!results.length) return;
  const byComposite = [...results].sort((a, b) => b.scores.composite - a.scores.composite);
  const byPrice = [...results].sort((a, b) => a.priceEurHt - b.priceEurHt);
  const byValue = [...results].sort(
    (a, b) => b.scores.composite / Math.max(a.priceEurHt, 1) - a.scores.composite / Math.max(b.priceEurHt, 1)
  );

  byComposite[0]!.isBestProduct = true;
  byPrice[0]!.isBestPrice = true;
  byValue[0]!.isBestValue = true;
}

function buildInsight(results: ProcurementProductResult[]): ProcurementSearchInsight {
  const bestProduct = results.find((r) => r.isBestProduct) ?? results[0] ?? null;
  const bestPrice = results.find((r) => r.isBestPrice) ?? null;
  const bestValue = results.find((r) => r.isBestValue) ?? null;
  const alternatives = results
    .filter((r) => !r.isBestProduct && !r.isBestPrice)
    .slice(0, 4);

  return { bestProduct, bestPrice, bestValue, alternatives };
}

function buildSupplierRankings(results: ProcurementProductResult[]): SupplierRanking[] {
  const map = new Map<string, ProcurementProductResult[]>();
  for (const r of results) {
    const list = map.get(r.supplier) ?? [];
    list.push(r);
    map.set(r.supplier, list);
  }

  return [...map.entries()]
    .map(([supplier, items]) => ({
      supplier,
      rank: 0,
      averageScore: Math.round(items.reduce((s, i) => s + i.scores.composite, 0) / items.length),
      productCount: items.length,
      bestPriceEur: Math.min(...items.map((i) => i.priceEurHt)),
      avgDeliveryDays: Math.round(items.reduce((s, i) => s + i.deliveryDays, 0) / items.length),
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

function buildCostEstimate(
  parsed: ParsedProcurementQuery,
  best: ProcurementProductResult | null
): ProcurementCostEstimate {
  const quantity = effectiveQuantity(parsed);
  const unitPriceHt = best?.priceEurHt ?? 0;
  const totalMaterialsHt = Math.round(unitPriceHt * quantity * 100) / 100;
  const budgetTotalHt =
    parsed.maxBudgetPerUnit > 0 ? Math.round(parsed.maxBudgetPerUnit * quantity * 100) / 100 : 0;
  const varianceHt = budgetTotalHt > 0 ? totalMaterialsHt - budgetTotalHt : 0;

  return {
    quantity,
    unit: parsed.unit,
    unitPriceHt,
    totalMaterialsHt,
    budgetTotalHt,
    varianceHt,
    withinBudget: budgetTotalHt <= 0 || totalMaterialsHt <= budgetTotalHt,
  };
}

function buildDeliveryEstimate(results: ProcurementProductResult[]): ProcurementDeliveryEstimate {
  if (!results.length) {
    return { minDays: 5, maxDays: 10, label: '5–10 j ouvrés (estimation)' };
  }
  const days = results.map((r) => r.deliveryDays);
  const minDays = Math.min(...days);
  const maxDays = Math.max(...days);
  return {
    minDays,
    maxDays,
    label: minDays === maxDays ? `${minDays} j ouvrés` : `${minDays}–${maxDays} j ouvrés`,
  };
}

function buildLocalSummary(
  parsed: ParsedProcurementQuery,
  insight: ProcurementSearchInsight,
  cost: ProcurementCostEstimate,
  delivery: ProcurementDeliveryEstimate
): string {
  const bp = insight.bestProduct;
  if (!bp) {
    return `Aucune offre trouvée pour ${parsed.materialType} à ${parsed.location}. Ajustez le budget ou le format.`;
  }
  const qtyLine =
    parsed.quantity > 0
      ? `Quantité estimée : ${parsed.quantity} ${parsed.unit}. Coût matériaux : ${formatCurrency(cost.totalMaterialsHt)} HT. `
      : '';
  const budgetLine =
    parsed.maxBudgetPerUnit > 0
      ? `Budget cible : ${parsed.maxBudgetPerUnit} € HT/${parsed.unit} (${cost.withinBudget ? 'respecté' : 'dépassé'}). `
      : '';

  return (
    `${parsed.materialType} — projet ${parsed.projectType} (${parsed.location}). ${qtyLine}${budgetLine}` +
    `Recommandation : ${bp.productName} chez ${bp.supplier} à ${formatCurrency(bp.priceEurHt)} HT/${bp.unit}, ` +
    `score ${bp.scores.composite}/100. Livraison : ${delivery.label}. ` +
    `Alternatives : ${insight.alternatives.length} produit(s) comparables. France · EUR HT.`
  );
}

export async function runProcurementSearch(rawQuery: string): Promise<ProcurementSearchResponse> {
  const parsed = await resolveParsedQuery(rawQuery);
  await delayMs(procurementConfig.simulateNetworkMs);

  const providerResult = await fetchCatalogFromProviders(parsed);
  const source =
    providerResult.resultOrigin === 'real_web'
      ? 'web'
      : parsed.parsedByAi
        ? 'openai'
        : providerResult.source;

  let results = providerResult.items
    .map((dto) => mapItem(dto, parsed))
    .sort((a, b) => b.scores.composite - a.scores.composite)
    .slice(0, providerResult.resultOrigin === 'real_web' ? WEB_PRODUCT_RESULTS_LIMIT : 12);

  assignBadges(results);

  const insight = buildInsight(results);
  const supplierRankings = buildSupplierRankings(results);
  const pricedBest =
    results.find((r) => r.priceEurHt > 0) ?? insight.bestProduct;
  const costEstimate = buildCostEstimate(parsed, pricedBest);
  const deliveryEstimate = buildDeliveryEstimate(results);

  const localSummary = buildLocalSummary(parsed, insight, costEstimate, deliveryEstimate);
  const aiSummary =
    (await generateOpenAiProcurementSummary(parsed, results, localSummary)) ?? localSummary;

  const providerNote =
    providerResult.resultOrigin === 'real_web'
      ? providerResult.note
      : parsed.parsedByAi
        ? `Analyse OpenAI — ${providerResult.note}`
        : providerResult.note;

  return {
    id: newSearchId(),
    generatedAt: new Date().toISOString(),
    parsed,
    source,
    resultOrigin: providerResult.resultOrigin,
    providerNote,
    webQuery: providerResult.webQuery,
    results,
    insight,
    supplierRankings,
    costEstimate,
    deliveryEstimate,
    aiSummary,
  };
}
