/** Configuration recherche web Tavily (Vite + proxy dev / API serveur). */

export const TAVILY_UNCONFIGURED_MESSAGE =
  'Recherche web réelle non configurée. Ajoutez VITE_TAVILY_API_KEY dans .env';

export const TAVILY_SOURCE_LABEL = 'Recherche web réelle';
export const DEMO_SOURCE_LABEL = 'Résultat démo';

function readEnv(key: string): string {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
}

export const realSearchConfig = {
  country: 'France' as const,
  currency: 'EUR' as const,
  tavily: {
    enabled: Boolean(readEnv('VITE_TAVILY_API_KEY')),
    apiKey: readEnv('VITE_TAVILY_API_KEY'),
    maxResults: Number(readEnv('VITE_TAVILY_MAX_RESULTS') || 10),
    searchDepth: (readEnv('VITE_TAVILY_SEARCH_DEPTH') || 'advanced') as 'basic' | 'advanced',
    get searchUrl(): string {
      if (import.meta.env.DEV) return '/tavily/search';
      const api = readEnv('VITE_API_URL') || 'http://localhost:3001';
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
