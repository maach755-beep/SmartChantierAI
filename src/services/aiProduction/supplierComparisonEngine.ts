import type { SupplierComparisonRow } from './types';
import { runProcurementSearch } from '@/services/procurement/procurementSearchEngine';
import { formatCurrency } from '@/utils/format';

export async function compareSuppliers(query: string): Promise<SupplierComparisonRow[]> {
  const result = await runProcurementSearch(query);
  return result.results.slice(0, 5).map((item, i) => ({
    supplier: item.supplier,
    product: item.productName,
    priceLabel: formatCurrency(item.priceEurHt) + ' HT',
    score: Math.round(item.scores.composite),
    decision:
      i === 0
        ? 'Recommandé'
        : item.scores.composite >= 75
          ? 'Alternative'
          : 'À comparer',
  }));
}
