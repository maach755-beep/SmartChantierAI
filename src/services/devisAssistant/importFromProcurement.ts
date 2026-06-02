import type { ProcurementProductResult } from '@/types/procurementSearch';
import type { ProfessionalDevisLine } from '@/types/professionalDevis';
import { defaultTvaPercent } from './calculator';

export function lineFromProcurementProduct(
  product: ProcurementProductResult,
  quantity: number,
  workLot = 'Matériaux'
): ProfessionalDevisLine {
  return {
    id: crypto.randomUUID(),
    workLot,
    description: product.productName,
    productName: product.productName,
    supplier: product.supplier,
    productUrl: product.url,
    quantity: quantity > 0 ? quantity : 1,
    unit: (product.unit === 'm²' || product.unit === 'ml' || product.unit === 'm³'
      ? product.unit
      : 'unité') as ProfessionalDevisLine['unit'],
    unitPriceHt: product.priceEurHt > 0 ? product.priceEurHt : 0,
    tvaPercent: defaultTvaPercent(),
  };
}
