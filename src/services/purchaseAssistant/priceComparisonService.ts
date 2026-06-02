import type { BudgetOption, ComparisonRow, ProductRecommendation } from '@/types/purchaseAssistant';
import { FUTURE_SUPPLIER_PARTNERS, partnerForCategory } from '@/data/supplierPartners';

export function buildComparisonTable(products: ProductRecommendation[]): ComparisonRow[] {
  return products.map((p) => ({
    id: p.id,
    product: p.productName,
    brand: p.brand,
    supplier: p.supplier,
    price: p.estimatedPrice,
    delayDays: p.estimatedDeliveryDays,
    quality: p.qualityLevel,
    availability: p.estimatedDeliveryDays <= 4 ? 'Stock rapide' : 'Sur commande',
    siteFit: p.siteCompatibility.slice(0, 60) + (p.siteCompatibility.length > 60 ? '…' : ''),
    aiScore: p.recommendationScore,
    decision:
      p.decisionHint === 'recommande'
        ? 'Recommandé'
        : p.decisionHint === 'eviter'
          ? 'À éviter (budget)'
          : 'Alternative',
  }));
}

export function buildBudgetOptions(products: ProductRecommendation[]): BudgetOption[] {
  const sorted = [...products].sort((a, b) => a.estimatedPrice - b.estimatedPrice);
  const eco = sorted.find((p) => p.qualityLevel === 'economique') ?? sorted[0];
  const balanced =
    products.find((p) => p.decisionHint === 'recommande') ??
    sorted.find((p) => p.qualityLevel === 'standard') ??
    sorted[Math.floor(sorted.length / 2)] ??
    eco;
  const premium = [...sorted].reverse().find((p) => p.qualityLevel === 'premium') ?? sorted[sorted.length - 1] ?? eco;

  const premiumPrice = premium.estimatedPrice;
  const supplierType = (p: ProductRecommendation): BudgetOption['supplierType'] => {
    const loc = p.supplierLocation.toLowerCase();
    if (loc.includes('ligne') || loc.includes('online')) return 'online';
    if (loc.includes('national') || loc.includes('lyon')) return 'national';
    return 'local';
  };
  const deliveryRisk = (p: ProductRecommendation): BudgetOption['deliveryRisk'] => {
    if (p.estimatedDeliveryDays <= 4) return 'faible';
    if (p.estimatedDeliveryDays <= 8) return 'moyen';
    return 'eleve';
  };

  const partnerLabel = (p: ProductRecommendation) => {
    const name = FUTURE_SUPPLIER_PARTNERS.find((s) => s.id === partnerForCategory(p.category))?.name ?? p.supplier;
    return `${p.whySuitable} — Fournisseur France : ${name} (DTU / NF)`;
  };

  const make = (tier: BudgetOption['tier'], p: ProductRecommendation): BudgetOption => ({
    tier,
    productId: p.id,
    productName: `${p.brand} ${p.model}`,
    price: p.estimatedPrice,
    possibleSaving: Math.max(0, Math.round((premiumPrice - p.estimatedPrice) * 10) / 10),
    supplierType: supplierType(p),
    deliveryRisk: deliveryRisk(p),
    whyRecommended: partnerLabel(p),
    whyAvoided: tier === 'economique' ? p.whyNotSuitable : undefined,
    qualityRisk:
      tier === 'economique'
        ? 'Vérifier durabilité et garantie — acceptable second œuvre standard'
        : tier === 'premium'
          ? 'Faible — surqualification possible si budget serré'
          : 'Modéré — bon choix PME BTP',
    delayImpact:
      p.estimatedDeliveryDays <= 4
        ? 'Délai court — limite risque retard chantier'
        : `Prévoir ${p.estimatedDeliveryDays} j — anticiper dans planning`,
    siteImpact:
      tier === 'economique'
        ? 'OK zones peu exposées / budget serré'
        : tier === 'premium'
          ? 'Idéal client exigeant / littoral / image'
          : 'Adapté chantier courant avec contraintes réelles',
  });

  return [make('economique', eco), make('equilibree', balanced), make('premium', premium)];
}

export function estimatePotentialSavings(options: BudgetOption[]): number {
  const eco = options.find((o) => o.tier === 'economique');
  const prem = options.find((o) => o.tier === 'premium');
  if (!eco || !prem) return 0;
  return Math.round((prem.price - eco.price) * 100) / 100;
}
