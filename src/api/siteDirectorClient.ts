import type { Lang, SiteDirectorAnalysis, SiteDirectorSnapshot } from '@shared/site-director/types';

const BASE = import.meta.env.VITE_API_URL ?? '';
const TENANT = import.meta.env.VITE_TENANT_ID ?? 'tenant_default';

export const siteDirectorApi = {
  analyze: (snapshot: SiteDirectorSnapshot, focusProjectId?: string, lang: Lang = 'fr') =>
    fetch(`${BASE}/api/v1/site-director/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT },
      body: JSON.stringify({ snapshot, focusProjectId, lang }),
    }).then(async (r) => {
      if (!r.ok) throw new Error((await r.json()).error ?? 'API error');
      return r.json() as Promise<{ data: SiteDirectorAnalysis }>;
    }),

  ask: (question: string, snapshot: SiteDirectorSnapshot, focusProjectId?: string, lang: Lang = 'fr') =>
    fetch(`${BASE}/api/v1/site-director/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT },
      body: JSON.stringify({ question, snapshot, focusProjectId, lang }),
    }).then(async (r) => {
      if (!r.ok) throw new Error((await r.json()).error ?? 'API error');
      return r.json() as Promise<{ data: { answer: string } }>;
    }),
};
