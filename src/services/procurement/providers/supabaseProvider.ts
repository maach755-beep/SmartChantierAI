import { procurementConfig } from '@/services/procurement/config';
import type { ParsedProcurementQuery } from '@/types/procurementSearch';
import type { ProcurementCatalogProvider, ProcurementProviderResult } from './types';

/**
 * Provider Supabase — catalogue matériaux synchronisé (VITE_SUPABASE_URL).
 */
export const supabaseProcurementProvider: ProcurementCatalogProvider = {
  source: 'supabase',
  isAvailable: () => procurementConfig.supabase.enabled,

  async search(_query: ParsedProcurementQuery): Promise<ProcurementProviderResult | null> {
    void _query;
    if (!procurementConfig.supabase.enabled) return null;

    // TODO: supabase.from(procurementConfig.supabase.catalogTable).select().textSearch(...)
    return null;
  },
};
