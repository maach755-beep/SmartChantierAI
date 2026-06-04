/** Configuration recherche web Tavily (Vite + proxy dev / API serveur). */

export const TAVILY_UNCONFIGURED_MESSAGE =
  'Recherche web réelle non configurée. Ajoutez VITE_TAVILY_API_KEY dans .env';

export const TAVILY_SOURCE_LABEL = 'Recherche web réelle';
export const DEMO_SOURCE_LABEL = 'Résultat démo';

import { isViteDevMode, readAppEnv } from '@/utils/env';

export const realSearchConfig = {
  country: 'France' as const,
  currency: 'EUR' as const,
  tavily: {
    enabled: Boolean(readAppEnv('VITE_TAVILY_API_KEY')),
    apiKey: readAppEnv('VITE_TAVILY_API_KEY'),
    maxResults: Number(readAppEnv('VITE_TAVILY_MAX_RESULTS', '10')),
    searchDepth: (readAppEnv('VITE_TAVILY_SEARCH_DEPTH', 'advanced')) as 'basic' | 'advanced',
    get searchUrl(): string {
      if (isViteDevMode()) return '/tavily/search';
      const api = readAppEnv('VITE_API_URL', 'http://localhost:3001');
      return `${api.replace(/\/$/, '')}/api/tavily/search`;
    },
  },
} as const;

export function isRealWebSearchEnabled(): boolean {
  return realSearchConfig.tavily.enabled;
}

export function getRealWebSearchStatusLabel(t: (key: string) => string): string {
  return isRealWebSearchEnabled() ? t('settings.realSearchEnabled') : t('settings.realSearchDisabled');
}
