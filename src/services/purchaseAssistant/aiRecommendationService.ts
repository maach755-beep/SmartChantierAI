import { detectPurchaseLanguage } from './languageDetect';
import { inferCategoryFromQuery, searchProducts } from './productSearchService';
import { searchSuppliers } from './supplierSearchService';
import {
  buildBudgetOptions,
  buildComparisonTable,
  estimatePotentialSavings,
} from './priceComparisonService';
import type {
  ContextualAdvice,
  PurchaseDashboardSummary,
  PurchaseSearchCriteria,
  PurchaseSearchResult,
} from '@/types/purchaseAssistant';
import { getRecentSearches } from './purchaseStorage';

let idCounter = 0;
function uid(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function buildSearchCriteria(
  partial: Partial<PurchaseSearchCriteria> & { query: string }
): PurchaseSearchCriteria {
  const query = partial.query.trim();
  const detected = detectPurchaseLanguage(query);
  const category = partial.category || inferCategoryFromQuery(query) || '';

  return {
    query,
    detectedLanguage: detected,
    productSearch: partial.productSearch ?? query,
    location: partial.location ?? 'Paris',
    maxBudget: partial.maxBudget ?? 0,
    quality: partial.quality ?? 'standard',
    deliveryDeadline: partial.deliveryDeadline ?? '',
    chantierId: partial.chantierId ?? '',
    chantierName: partial.chantierName ?? '',
    technicalConstraints: partial.technicalConstraints ?? '',
    estimatedQuantity: partial.estimatedQuantity ?? '',
    category,
    scope: partial.scope ?? 'france',
    urgency: partial.urgency ?? 'normal',
  };
}

export function runPurchaseSearch(criteria: PurchaseSearchCriteria): PurchaseSearchResult {
  const products = searchProducts(criteria);
  const comparison = buildComparisonTable(products);
  const suppliers = searchSuppliers(criteria, products);
  const budgetOptions = buildBudgetOptions(products);
  const contextual = buildContextualAdvice(products, criteria);
  const potentialSavingsEur = estimatePotentialSavings(budgetOptions);
  const balanced = budgetOptions.find((b) => b.tier === 'equilibree');

  return {
    id: uid('purchase'),
    generatedAt: new Date().toISOString(),
    criteria,
    products,
    comparison,
    suppliers,
    budgetOptions,
    contextual,
    finalRecommendation: buildFinalRecommendation(criteria, balanced, products),
    supplierRequestText: buildSupplierRequest(criteria, products[0]),
    productsToAvoid: products.filter((p) => p.decisionHint === 'eviter').map((p) => p.productName),
    potentialSavingsEur,
  };
}

function buildContextualAdvice(
  products: PurchaseSearchResult['products'],
  criteria: PurchaseSearchCriteria
): ContextualAdvice {
  const top = products.find((p) => p.decisionHint === 'recommande') ?? products[0];
  const avoid = products.filter((p) => p.decisionHint === 'eviter');

  return {
    whySuitable: top
      ? [
          top.whySuitable,
          ...top.advantages.slice(0, 2),
          criteria.chantierName
            ? `Aligné avec le contexte chantier ${criteria.chantierName}`
            : 'Répond aux critères zone PACA / livraison',
        ]
      : [],
    whyNotSuitable: [
      ...avoid.map((p) => `${p.productName}: ${p.whyNotSuitable ?? p.disadvantages[0]}`),
      ...(products[1]?.disadvantages.slice(0, 1) ?? []),
    ],
    bestChoiceForSituation: top
      ? `Pour cette recherche, privilégier **${top.productName}** (${top.brand}) chez ${top.supplier} — score IA ${top.recommendationScore}/100.`
      : 'Affiner la recherche (catégorie, budget, zone).',
    productsToAvoid: avoid.map((p) => p.productName),
    whereToSave: [
      'Colles et joints en gamme pro standard si DTU respecté',
      'Alternatives économiques sur terrasses secondaires',
      'Regrouper commandes même fournisseur pour frais port',
    ],
    whereNotToSave: [
      'Inox extérieur littoral (préférer 316 vs 304)',
      'Carrelage zones humides / piscine (ne pas sous-dimensionner classe usure)',
      'Colle grand format 60x120 (C2S1 minimum)',
    ],
  };
}

function buildFinalRecommendation(
  criteria: PurchaseSearchCriteria,
  balanced: PurchaseSearchResult['budgetOptions'][0] | undefined,
  products: PurchaseSearchResult['products']
): string {
  const lang = criteria.detectedLanguage;
  const name = balanced?.productName ?? products[0]?.productName ?? 'le produit analysé';
  const fr =
    `Pour ${criteria.chantierName || 'ce chantier'}, je recommande l'option équilibrée **${name}** car elle respecte ${
      criteria.maxBudget > 0 ? `un budget cible ~${criteria.maxBudget} €/${products[0]?.unit ?? 'unité'}` : 'votre cahier des charges'
    }, limite le risque de retard (délai ${products[0]?.estimatedDeliveryDays ?? '—'} j) et offre une qualité suffisante pour une PME BTP en ${criteria.location || 'PACA'}.`;
  const ar =
    `لبناء ${criteria.chantierName || 'هذا الورش'}، أنصح بالخيار المتوازن **${name}** لأنه يناسب الميزانية، يقلل خطر التأخير، ويضمن جودة كافية لشركة BTP.`;
  if (lang === 'ar') return ar;
  if (lang === 'mixed') return `${fr}\n\n${ar}`;
  return fr;
}

function buildSupplierRequest(
  criteria: PurchaseSearchCriteria,
  product?: PurchaseSearchResult['products'][0]
): string {
  const p = product?.productName ?? criteria.productSearch;
  return [
    'Demande de prix fournisseur',
    '',
    `Objet : Devis — ${p}`,
    '',
    `Produit recherché : ${p}`,
    criteria.estimatedQuantity ? `Quantité estimée : ${criteria.estimatedQuantity}` : 'Quantité : à confirmer sur métré',
    criteria.chantierName ? `Chantier : ${criteria.chantierName}` : '',
    criteria.location ? `Lieu livraison : ${criteria.location}` : '',
    criteria.deliveryDeadline ? `Délai souhaité : ${criteria.deliveryDeadline}` : 'Délai : selon disponibilité stock',
    criteria.technicalConstraints ? `Contraintes techniques : ${criteria.technicalConstraints}` : '',
    '',
    'Merci de nous indiquer :',
    '- Disponibilité stock et délai livraison',
    '- Prix unitaire HT et remise volume',
    '- Conditions de paiement et franco de port',
    '- Fiche technique et avis de conformité si applicable',
    '',
    'Cordialement,',
    'Service Achats — SmartChantier AI (démo)',
  ]
    .filter(Boolean)
    .join('\n');
}

export function getPurchaseDashboardSummary(): PurchaseDashboardSummary {
  const recent = getRecentSearches();
  const last = recent[0];
  return {
    recentSearches: recent.length,
    recommendedProducts: last?.products.filter((p) => p.decisionHint === 'recommande').length ?? 3,
    potentialSavings: last?.potentialSavingsEur ?? 24,
    reliableSuppliers: last?.suppliers.filter((s) => s.reliability === 'haute').length ?? 4,
    productsToAvoid: last?.productsToAvoid.length ?? 1,
    topRecommendation:
      last?.finalRecommendation.slice(0, 120) ??
      'Lancez une recherche achat (carrelage, composite, inox…) pour gagner des heures.',
  };
}
