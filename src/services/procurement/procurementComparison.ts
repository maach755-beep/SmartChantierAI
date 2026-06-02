import type { ComparisonPdfRow } from '@/services/pdf/devisPdfGenerator';
import type { ProcurementSearchResponse } from '@/types/procurementSearch';
import { formatCurrency } from '@/utils/format';

/** Construit les lignes de comparaison à partir des résultats actuels (sans relancer la recherche). */
export function buildComparisonRowsFromProcurement(
  proc: ProcurementSearchResponse
): ComparisonPdfRow[] {
  if (!proc.results.length) return [];

  return proc.results.map((item) => ({
    product: item.productName,
    brand: item.brand,
    supplier: item.supplier,
    priceLabel:
      item.priceEurHt > 0
        ? `${formatCurrency(item.priceEurHt)} HT/${item.unit}`
        : 'Prix sur fiche',
    delay: item.deliveryLabel,
    score: item.scores.composite,
    decision: item.isBestProduct
      ? 'Recommandé'
      : item.isBestPrice
        ? 'Meilleur prix'
        : item.isBestValue
          ? 'Meilleur rapport'
          : 'Alternative',
  }));
}
