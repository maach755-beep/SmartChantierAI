import { procurementConfig } from '@/services/procurement/config';
import type { ParsedProcurementQuery } from '@/types/procurementSearch';
import type { ProcurementCatalogProvider, ProcurementProviderResult } from './types';

/**
 * Provider APIs réseau (Point P, BigMat, Samse, etc.) — VITE_SUPPLIER_API_URL.
 */
export const supplierApiProcurementProvider: ProcurementCatalogProvider = {
  source: 'supplier_api',
  isAvailable: () => procurementConfig.supplierApi.enabled,

  async search(_query: ParsedProcurementQuery): Promise<ProcurementProviderResult | null> {
    void _query;
    if (!procurementConfig.supplierApi.enabled) return null;

    // TODO: GET `${procurementConfig.supplierApi.baseUrl}/search?q=...&region=FR`
    return null;
  },
};
