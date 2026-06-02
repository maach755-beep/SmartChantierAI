import type { ProcurementStockStatus } from '@/types/procurementSearch';

export interface ExtractedProductFields {
  productName: string;
  priceEurHt: number | null;
  priceLabel: string;
  unit: string;
  availability: ProcurementStockStatus;
  availabilityLabel: string;
  reference?: string;
}

const PRICE_PATTERNS: { re: RegExp; unitGroup?: number }[] = [
  { re: /(\d{1,4}(?:[.,]\d{1,2})?)\s*€\s*(?:\/?\s*(m²|m2|ml|u|kg|sac|unité))?/gi, unitGroup: 2 },
  { re: /prix(?:\s+public)?[:\s]+(\d{1,4}(?:[.,]\d{1,2})?)\s*€/gi },
  { re: /(\d{1,4}(?:[.,]\d{1,2})?)\s*eur(?:os)?(?:\s*\/\s*(m²|m2))?/gi, unitGroup: 2 },
  { re: /(\d{1,4}(?:[.,]\d{1,2})?)\s*€\s*ht/gi },
  { re: /"price"\s*:\s*"?(\d+(?:[.,]\d+)?)/gi },
];

const REF_PATTERN = /\b(?:ref|réf(?:érence)?|sku|art\.?|code)\s*[:.]?\s*([A-Z0-9][\w./-]{3,24})/i;

function parseUnit(raw?: string, fallback = 'm²'): string {
  if (!raw) return fallback;
  const u = raw.toLowerCase().replace('m2', 'm²');
  return u === 'u' || u === 'unité' ? 'unité' : u;
}

export function extractPriceEur(text: string, defaultUnit = 'm²'): Pick<ExtractedProductFields, 'priceEurHt' | 'priceLabel' | 'unit'> {
  for (const { re, unitGroup } of PRICE_PATTERNS) {
    re.lastIndex = 0;
    const matches = [...text.matchAll(re)];
    for (const m of matches) {
      const price = parseFloat(m[1].replace(',', '.'));
      if (price > 0.5 && price < 5000) {
        const unit = parseUnit(unitGroup ? m[unitGroup] : undefined, defaultUnit);
        return {
          priceEurHt: price,
          priceLabel: `${price} € HT/${unit}`,
          unit,
        };
      }
    }
  }
  return {
    priceEurHt: null,
    priceLabel: 'Prix à confirmer sur la fiche produit',
    unit: defaultUnit,
  };
}

export function extractAvailability(text: string): Pick<ExtractedProductFields, 'availability' | 'availabilityLabel'> {
  const t = text.toLowerCase();
  if (/(?:rupture|indisponible|épuisé|epuise|non disponible)/i.test(t)) {
    return { availability: 'sur_commande', availabilityLabel: 'Indisponible — sur commande' };
  }
  if (/(?:stock faible|dernières unités|dernier)/i.test(t)) {
    return { availability: 'stock_faible', availabilityLabel: 'Stock faible' };
  }
  if (/(?:en stock|disponible|en magasin|ajouter au panier|click\s*&\s*collect)/i.test(t)) {
    return { availability: 'en_stock', availabilityLabel: 'Disponible (selon fiche produit)' };
  }
  if (/(?:sur commande|délai|semaines?|jours? ouvrés)/i.test(t)) {
    return { availability: 'sur_commande', availabilityLabel: 'Sur commande — délai à confirmer' };
  }
  return { availability: 'sur_commande', availabilityLabel: 'Disponibilité à vérifier sur la fiche' };
}

export function extractReference(text: string): string | undefined {
  const m = text.match(REF_PATTERN);
  return m?.[1];
}

export function extractProductFields(
  title: string,
  content: string,
  defaultUnit = 'm²'
): ExtractedProductFields {
  const blob = `${title} ${content}`;
  const price = extractPriceEur(blob, defaultUnit);
  const avail = extractAvailability(blob);
  const reference = extractReference(blob);

  return {
    productName: title,
    ...price,
    ...avail,
    reference,
  };
}
