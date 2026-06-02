import { procurementConfig } from '@/services/procurement/config';
import type { ParsedProcurementQuery } from '@/types/procurementSearch';
import type { ProcurementCatalogProvider, ProcurementProviderResult } from './types';

/**
 * Provider OpenAI — à activer avec VITE_OPENAI_API_KEY.
 * Retourne null en démo : le moteur bascule sur le catalogue local.
 */
export const openaiProcurementProvider: ProcurementCatalogProvider = {
  source: 'openai',
  isAvailable: () => procurementConfig.openai.enabled,

  async search(_parsed: ParsedProcurementQuery): Promise<ProcurementProviderResult | null> {
    if (!procurementConfig.openai.enabled) return null;

    // TODO: POST /chat/completions avec function calling → CatalogItemDTO[]
    // const res = await fetch(`${procurementConfig.openai.baseUrl}/chat/completions`, { ... });
    return null;
  },
};
