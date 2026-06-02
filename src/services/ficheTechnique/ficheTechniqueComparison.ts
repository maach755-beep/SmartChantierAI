import type { TechnicalSheetComparison, TechnicalSheetProduct } from '@/types/ficheTechnique';

function completenessScore(p: TechnicalSheetProduct): number {
  let score = 0;
  const fields: (keyof TechnicalSheetProduct)[] = [
    'reference',
    'brand',
    'dimensions',
    'material',
    'normes',
    'warranty',
    'slipResistance',
    'fireClassification',
  ];
  for (const f of fields) {
    const v = p[f];
    if (typeof v === 'string' && v.trim() && v !== '—') score += 1;
  }
  if (p.confidence === 'confirme') score += 4;
  else if (p.confidence === 'a_verifier') score += 2;
  if (!p.isProvisional) score += 2;
  if (p.priceLabel && !p.priceLabel.includes('confirmer')) score += 1;
  return score;
}

function suitabilityLabel(p: TechnicalSheetProduct): string {
  if (p.isProvisional) return 'Provisoire — à valider';
  if (p.confidence === 'confirme') return 'Adapté — données confirmées';
  if (p.confidence === 'a_verifier') return 'Adapté avec réserves — vérifier fiche fabricant';
  return 'Estimation — données partielles';
}

export function compareTechnicalSheets(products: TechnicalSheetProduct[]): TechnicalSheetComparison {
  if (products.length < 2) {
    throw new Error('Sélectionnez au moins 2 produits pour comparer.');
  }
  if (products.length > 3) {
    throw new Error('Maximum 3 produits pour le comparatif.');
  }

  const advantages: Record<string, string[]> = {};
  const disadvantages: Record<string, string[]> = {};
  const suitability: Record<string, string> = {};

  for (const p of products) {
    advantages[p.id] = [];
    disadvantages[p.id] = [];
    suitability[p.id] = suitabilityLabel(p);

    if (p.confidence === 'confirme') advantages[p.id].push('Données confirmées (source web)');
    if (p.normes && p.normes !== '—') advantages[p.id].push(`Normes : ${p.normes}`);
    if (p.slipResistance && p.slipResistance !== '—') advantages[p.id].push(`Antidérapant ${p.slipResistance}`);
    if (p.priceLabel && !p.priceLabel.includes('confirmer')) advantages[p.id].push(`Prix : ${p.priceLabel}`);

    if (p.isProvisional) disadvantages[p.id].push('Fiche provisoire');
    if (p.confidence === 'estimee') disadvantages[p.id].push('Données estimées');
    if (!p.reference || p.reference === 'REF-À-VÉRIFIER') disadvantages[p.id].push('Référence à confirmer');
  }

  const ranked = [...products].sort((a, b) => completenessScore(b) - completenessScore(a));
  const recommended = ranked[0];

  const reasonParts = [
    `Meilleur score de complétude (${completenessScore(recommended)}/${products.length} produits comparés).`,
    recommended.confidence === 'confirme' ? 'Données web confirmées.' : 'Vérifier avant commande.',
    recommended.supplier !== '—' ? `Fournisseur : ${recommended.supplier}.` : '',
  ].filter(Boolean);

  return {
    products,
    advantages,
    disadvantages,
    suitability,
    recommendedProductId: recommended.id,
    recommendationReason: reasonParts.join(' '),
    generatedAt: new Date().toISOString(),
  };
}
