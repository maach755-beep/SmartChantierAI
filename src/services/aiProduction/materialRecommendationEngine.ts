import type { MaterialRecommendation } from './types';
import { runProcurementSearch } from '@/services/procurement/procurementSearchEngine';

export async function recommendMaterials(query: string, budgetPerUnit?: number): Promise<MaterialRecommendation[]> {
  const q = budgetPerUnit ? `${query} budget ${budgetPerUnit}€` : query;
  const result = await runProcurementSearch(q);
  return result.results.slice(0, 6).map((item) => ({
    materialName: item.productName,
    reason: item.sourceLabel ?? item.brand ?? 'Recommandation IA',
    score: Math.round(item.scores.composite),
    supplierHint: item.supplier,
  }));
}
