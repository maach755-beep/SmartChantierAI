import { purchaseDemoCatalog } from '@/data/purchaseDemoProducts';
import { FRENCH_SUPPLIER_NETWORK } from '@/config/france';
import { DEMO_SOURCE_LABEL } from '@/services/realSearch/config';
import { extractQueryHints } from '@/services/purchaseAssistant/languageDetect';
import type { ParsedProcurementQuery } from '@/types/procurementSearch';
import type { CatalogItemDTO, ProcurementCatalogProvider, ProcurementProviderResult } from './types';

const allowedSuppliers = new Set<string>(FRENCH_SUPPLIER_NETWORK);

function stockFromIndex(i: number): CatalogItemDTO['stockStatus'] {
  if (i % 5 === 0) return 'stock_faible';
  if (i % 11 === 0) return 'sur_commande';
  return 'en_stock';
}

function stockLabel(status: CatalogItemDTO['stockStatus'], price: number): string {
  if (status === 'en_stock') return `En stock — ${Math.round(120 + (price % 80))} unités dispo`;
  if (status === 'stock_faible') return 'Stock faible — commander sous 48h';
  return 'Sur commande — délai à confirmer';
}

function buildSpecs(p: (typeof purchaseDemoCatalog)[0], parsed: ParsedProcurementQuery): string[] {
  const specs = [
    `${p.brand} — ${p.model}`,
    ...p.advantages.slice(0, 2),
    p.siteCompatibility,
  ];
  if (parsed.formatHint) specs.push(`Format ${parsed.formatHint}`);
  if (parsed.usageHint === 'extérieur') specs.push('Usage extérieur — résistance gel / UV');
  if (parsed.usageHint === 'intérieur') specs.push('Usage intérieur — conformité RE2020');
  return specs;
}

export const demoProcurementProvider: ProcurementCatalogProvider = {
  source: 'demo',
  isAvailable: () => true,

  async search(parsed: ParsedProcurementQuery): Promise<ProcurementProviderResult> {
    const hints = extractQueryHints(parsed.rawQuery);
    const q = parsed.rawQuery.toLowerCase();

    let candidates = purchaseDemoCatalog.filter((p) => allowedSuppliers.has(p.supplier));

    if (parsed.category) {
      candidates = candidates.filter((p) => p.category === parsed.category);
    }

    if (parsed.maxBudgetPerUnit > 0) {
      candidates = candidates.filter((p) => p.estimatedPrice <= parsed.maxBudgetPerUnit * 1.2);
    }

    const score = (p: (typeof purchaseDemoCatalog)[0], idx: number) => {
      let s = p.recommendationScore;
      for (const h of hints) {
        if (p.keywords.some((k) => k.includes(h)) || p.tags.includes(h)) s += 8;
        if (p.productName.toLowerCase().includes(h)) s += 10;
      }
      if (parsed.formatHint && p.model.includes(parsed.formatHint.replace('x', 'x'))) s += 12;
      if (parsed.usageHint === 'extérieur' && p.tags.includes('terrasse')) s += 10;
      if (q.includes('extérieur') || q.includes('exterieur')) {
        if (p.tags.includes('terrasse') || p.keywords.includes('extérieur')) s += 15;
      }
      if (parsed.maxBudgetPerUnit > 0 && p.estimatedPrice <= parsed.maxBudgetPerUnit) s += 14;
      return s - idx * 0.5;
    };

    if (candidates.length === 0) candidates = [...purchaseDemoCatalog].filter((p) => allowedSuppliers.has(p.supplier));

    const ranked = candidates
      .map((p, idx) => ({ p, s: score(p, idx) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 8);

    const items: CatalogItemDTO[] = ranked.map(({ p }, i) => {
      const stockStatus = stockFromIndex(i + p.estimatedPrice);
      return {
        id: p.id,
        productName: p.productName,
        brand: p.brand,
        model: p.model,
        supplier: p.supplier,
        priceEurHt: p.estimatedPrice,
        unit: p.unit,
        deliveryDays: p.estimatedDeliveryDays,
        qualityLevel: p.qualityLevel,
        recommendationScore: p.recommendationScore,
        technicalSpecs: buildSpecs(p, parsed),
        stockStatus,
        stockQuantityLabel: stockLabel(stockStatus, p.estimatedPrice),
        cheaperAlternative: p.cheaperAlternative,
        betterQualityAlternative: p.betterQualityAlternative,
        keywords: p.keywords,
        resultOrigin: 'demo',
        sourceLabel: DEMO_SOURCE_LABEL,
      };
    });

    return {
      source: 'demo',
      items,
      note: 'Catalogue démo France — connectez VITE_TAVILY_API_KEY pour la recherche web réelle',
      resultOrigin: 'demo',
    };
  },
};
