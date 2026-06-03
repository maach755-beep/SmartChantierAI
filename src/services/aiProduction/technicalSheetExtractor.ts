import type { TechnicalSheetExtractionResult } from './types';
import { searchTechnicalProduct } from '@/services/ficheTechnique/ficheTechniqueSearch';

export async function extractTechnicalSheet(query: {
  productName: string;
  reference?: string;
  supplierUrl?: string;
}): Promise<TechnicalSheetExtractionResult> {
  const { products } = await searchTechnicalProduct({
    productName: query.productName,
    reference: query.reference ?? '',
    supplierUrl: query.supplierUrl ?? '',
    manufacturerUrl: '',
    brand: '',
    category: '',
    useCase: '',
    city: '',
  });
  const best = products[0];
  if (!best) {
    return {
      productName: query.productName,
      reference: query.reference ?? '—',
      brand: '—',
      specifications: {},
      confidence: 'estime',
      source: 'demo',
    };
  }
  return {
    productName: best.productName,
    reference: best.reference,
    brand: best.brand,
    specifications: {
      dimensions: best.dimensions,
      material: best.material,
      slipResistance: best.slipResistance ?? '—',
      normes: best.normes,
    },
    confidence: best.confidence === 'estimee' ? 'estime' : best.confidence,
    source: best.isProvisional ? 'provisional' : 'web',
  };
}
