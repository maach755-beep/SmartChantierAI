import type { ParsedProcurementQuery } from '@/types/procurementSearch';
import { DEMO_SOURCE_LABEL, TAVILY_UNCONFIGURED_MESSAGE } from '@/services/realSearch/config';
import { isRealWebSearchEnabled } from '@/services/realSearch/config';
import { demoFallbackNote } from '@/services/realSearch/tavilyProvider';
import type { ProcurementProviderResult } from './types';
import { tavilyProcurementProvider } from './tavilyProcurementProvider';
import { demoProcurementProvider } from './demoProvider';

/**
 * Tavily (web réel) en premier, catalogue démo en secours — jamais présenté comme web.
 */
export async function fetchCatalogFromProviders(
  parsed: ParsedProcurementQuery
): Promise<ProcurementProviderResult> {
  if (isRealWebSearchEnabled()) {
    try {
      const web = await tavilyProcurementProvider.search(parsed);
      if (web && web.items.length > 0) return web;
    } catch {
      /* fallback démo */
    }
  }

  const demo = await demoProcurementProvider.search(parsed);
  const items = (demo?.items ?? []).map((item) => ({
    ...item,
    resultOrigin: 'demo' as const,
    sourceLabel: DEMO_SOURCE_LABEL,
    technicalSpecs: [
      DEMO_SOURCE_LABEL,
      ...item.technicalSpecs.filter((s) => s !== DEMO_SOURCE_LABEL),
    ],
  }));

  let note: string;
  if (!isRealWebSearchEnabled()) {
    note = `${TAVILY_UNCONFIGURED_MESSAGE} — ${DEMO_SOURCE_LABEL}.`;
  } else {
    note = demoFallbackNote();
  }

  return {
    source: 'demo',
    items,
    note,
    resultOrigin: 'demo',
  };
}
