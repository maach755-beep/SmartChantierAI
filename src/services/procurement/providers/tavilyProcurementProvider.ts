import type { ParsedProcurementQuery } from '@/types/procurementSearch';
import { searchTavilyWeb } from '@/services/realSearch/tavilyProvider';
import { realSearchConfig } from '@/services/realSearch/config';
import type { CatalogItemDTO, ProcurementCatalogProvider, ProcurementProviderResult } from './types';

function hitToCatalogItem(
  hit: Awaited<ReturnType<typeof searchTavilyWeb>>['results'][0],
  parsed: ParsedProcurementQuery
): CatalogItemDTO {
  const price = hit.priceEurHt ?? 0;
  const unit = hit.unit || parsed.unit || 'm²';

  const specs = [
    hit.priceLabel,
    hit.availabilityLabel,
    hit.reference ? `Réf. ${hit.reference}` : '',
    hit.deliveryOrLocation,
    hit.summary,
    `Lien direct : ${hit.url}`,
  ].filter(Boolean);

  return {
    id: hit.id,
    productName: hit.productTitle,
    brand: hit.supplierName,
    model: hit.reference ?? 'Fiche produit web',
    supplier: hit.supplierName,
    priceEurHt: price,
    unit,
    deliveryDays: hit.availability === 'en_stock' ? 3 : hit.availability === 'stock_faible' ? 5 : 8,
    qualityLevel: hit.productPageScore >= 70 ? 'standard' : 'economique',
    recommendationScore: hit.confidence,
    technicalSpecs: specs,
    stockStatus: hit.availability,
    stockQuantityLabel: hit.availabilityLabel,
    keywords: [parsed.materialType, parsed.location, hit.reference ?? ''].filter(Boolean),
    url: hit.url,
    summary: hit.summary,
    confidence: hit.confidence,
    resultOrigin: 'real_web',
    sourceLabel: hit.sourceLabel,
  };
}

export const tavilyProcurementProvider: ProcurementCatalogProvider = {
  source: 'web',
  isAvailable: () => realSearchConfig.tavily.enabled,

  async search(parsed: ParsedProcurementQuery): Promise<ProcurementProviderResult | null> {
    if (!realSearchConfig.tavily.enabled) return null;

    try {
      const web = await searchTavilyWeb(parsed);
      if (web.results.length === 0) return null;

      return {
        source: 'web',
        items: web.results.map((h) => hitToCatalogItem(h, parsed)),
        note: web.providerNote,
        resultOrigin: 'real_web',
        webQuery: web.query,
      };
    } catch {
      return null;
    }
  },
};
