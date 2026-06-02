import { purchaseDemoCatalog } from '@/data/purchaseDemoProducts';
import { FRENCH_SUPPLIER_NETWORK } from '@/config/france';
import { extractQueryHints } from './languageDetect';
import type { ProductCategory, PurchaseSearchCriteria, ProductRecommendation } from '@/types/purchaseAssistant';

const frenchSupplierSet = new Set<string>(FRENCH_SUPPLIER_NETWORK);

/**
 * Demo product search — replace with web/API catalog when connected.
 */
export function searchProducts(criteria: PurchaseSearchCriteria): ProductRecommendation[] {
  const hints = extractQueryHints(criteria.query + ' ' + criteria.productSearch);
  const q = (criteria.query + ' ' + criteria.productSearch + ' ' + criteria.technicalConstraints).toLowerCase();

  let candidates = purchaseDemoCatalog.filter((p) => {
    if (!frenchSupplierSet.has(p.supplier)) return false;
    if (criteria.scope !== 'france' && criteria.scope !== 'online' && !p.scopes.includes(criteria.scope)) {
      return false;
    }
    if (criteria.category && p.category !== criteria.category) return false;
    if (criteria.maxBudget > 0 && p.estimatedPrice > criteria.maxBudget * 1.15) return false;
    return true;
  });

  const scoreProduct = (p: typeof purchaseDemoCatalog[0]) => {
    let score = p.recommendationScore;
    for (const h of hints) {
      if (p.keywords.some((k) => k.includes(h)) || p.tags.includes(h)) score += 8;
      if (p.productName.toLowerCase().includes(h)) score += 10;
    }
    if (q.split(/\s+/).some((w) => w.length > 3 && p.keywords.join(' ').includes(w))) score += 5;
    if (criteria.quality === 'economique' && p.qualityLevel === 'economique') score += 12;
    if (criteria.quality === 'premium' && p.qualityLevel === 'premium') score += 12;
    if (criteria.quality === 'standard' && p.qualityLevel === 'standard') score += 8;
    if (criteria.urgency === 'tres_urgent' && p.estimatedDeliveryDays <= 4) score += 15;
    if (criteria.urgency === 'urgent' && p.estimatedDeliveryDays <= 6) score += 8;
    if (criteria.maxBudget > 0 && p.estimatedPrice <= criteria.maxBudget) score += 10;
    return score;
  };

  if (candidates.length === 0) candidates = [...purchaseDemoCatalog];

  candidates = candidates
    .map((p) => ({ p, s: scoreProduct(p) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 6)
    .map((x) => x.p);

  return candidates.map((p, i) => toRecommendation(p, criteria, i === 0));
}

function toRecommendation(
  p: (typeof purchaseDemoCatalog)[0],
  criteria: PurchaseSearchCriteria,
  top: boolean
): ProductRecommendation {
  const overBudget = criteria.maxBudget > 0 && p.estimatedPrice > criteria.maxBudget;
  const whySuitable = buildWhySuitable(p, criteria, top);
  const whyNot = overBudget
    ? `Prix ${p.estimatedPrice} €/${p.unit} au-dessus du budget max ${criteria.maxBudget} € — négocier remise ou ajuster quantité.`
    : p.disadvantages[0];

  return {
    id: p.id,
    productName: p.productName,
    category: p.category,
    brand: p.brand,
    model: p.model,
    supplier: p.supplier,
    supplierLocation: p.supplierLocation,
    estimatedPrice: p.estimatedPrice,
    unit: p.unit,
    estimatedDeliveryDays: p.estimatedDeliveryDays,
    advantages: p.advantages,
    disadvantages: p.disadvantages,
    qualityLevel: p.qualityLevel,
    siteCompatibility: p.siteCompatibility,
    recommendationScore: Math.min(99, p.recommendationScore + (top ? 5 : 0)),
    supplierLinkPlaceholder: p.supplierLinkPlaceholder,
    cheaperAlternative: p.cheaperAlternative,
    betterQualityAlternative: p.betterQualityAlternative,
    whySuitable,
    whyNotSuitable: overBudget ? whyNot : undefined,
    decisionHint: top && !overBudget ? 'recommande' : overBudget ? 'eviter' : 'alternative',
  };
}

function buildWhySuitable(
  p: (typeof purchaseDemoCatalog)[0],
  criteria: PurchaseSearchCriteria,
  top: boolean
): string {
  const parts: string[] = [];
  if (criteria.chantierName) parts.push(`Compatible avec ${criteria.chantierName}`);
  if (criteria.location) parts.push(`Fournisseur accessible depuis ${criteria.location}`);
  if (top) parts.push('Meilleur compromis qualité/prix/délai pour votre recherche');
  parts.push(p.siteCompatibility);
  return parts.join('. ');
}

export function inferCategoryFromQuery(query: string): ProductCategory | '' {
  const hints = extractQueryHints(query);
  if (hints.includes('carrelage') || hints.includes('marbre')) return 'carrelage';
  if (hints.includes('composite') || hints.includes('plots')) return 'lames_composites';
  if (hints.includes('inox')) return 'garde_corps';
  if (hints.includes('parquet')) return 'parquet';
  if (hints.includes('colle')) return 'colle';
  if (hints.includes('joint')) return 'joint';
  if (hints.includes('peinture')) return 'peinture';
  return '';
}
