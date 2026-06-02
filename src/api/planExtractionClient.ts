/**
 * Plan Extraction API client — production REST layer (no demo fallbacks).
 */
import type {
  DevisDocument,
  MaterialChangeRequest,
  MaterialRecord,
  PlanExtractionJob,
  PlanExtractionKpis,
  PlanExtractionResult,
  PlanPhotoComparison,
  ProjectRecord,
  RoomRecord,
} from '@shared/plan-extraction/types';

/** Empty = same-origin; Vite proxies /api → API server in dev */
const BASE = import.meta.env.VITE_API_URL ?? '';
const TENANT = import.meta.env.VITE_TENANT_ID ?? 'tenant_default';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'X-Tenant-Id': TENANT,
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const planExtractionApi = {
  health: () => api<{ ok: boolean; visionConfigured: boolean }>('/api/health'),

  listProjects: () => api<{ data: ProjectRecord[] }>('/api/v1/plan-extraction/projects'),

  getKpis: (projectId: string) =>
    api<{ data: PlanExtractionKpis }>(`/api/v1/plan-extraction/projects/${projectId}/kpis`),

  uploadPlan: (projectId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api<{ data: { job: PlanExtractionJob; result: PlanExtractionResult } }>(
      `/api/v1/plan-extraction/projects/${projectId}/upload`,
      { method: 'POST', body: fd }
    );
  },

  getLatestExtraction: (projectId: string) =>
    api<{ data: { job: PlanExtractionJob; result: PlanExtractionResult } | null }>(
      `/api/v1/plan-extraction/projects/${projectId}/extractions/latest`
    ),

  getRooms: (projectId: string, extractionId?: string) =>
    api<{ data: RoomRecord[] }>(
      `/api/v1/plan-extraction/projects/${projectId}/rooms${extractionId ? `?extractionId=${extractionId}` : ''}`
    ),

  getMaterials: (projectId: string) =>
    api<{ data: MaterialRecord[] }>(`/api/v1/plan-extraction/projects/${projectId}/materials`),

  exportTable: (jobId: string, format: 'csv' | 'pdf' | 'excel') =>
    fetch(`${BASE}/api/v1/plan-extraction/extractions/${jobId}/export/${format}`, {
      headers: { 'X-Tenant-Id': TENANT },
    }),

  generateDevis: (projectId: string, extractionId: string) =>
    api<{ data: DevisDocument; purchaseList: { material: string; quantity: number; unit: string }[] }>(
      `/api/v1/plan-extraction/projects/${projectId}/devis`,
      { method: 'POST', body: JSON.stringify({ extractionId }) }
    ),

  applyMaterialChange: (projectId: string, body: {
    roomId: string;
    oldMaterialId: string;
    newMaterialId: string;
    quantity: number;
  }) =>
    api<{ data: MaterialChangeRequest; avenantPdf: string }>(
      `/api/v1/plan-extraction/projects/${projectId}/changes`,
      { method: 'POST', body: JSON.stringify(body) }
    ),

  syncFieldPhoto: (projectId: string, photo: File, photoId?: string, planJobId?: string) => {
    const fd = new FormData();
    fd.append('photo', photo);
    if (photoId) fd.append('photoId', photoId);
    if (planJobId) fd.append('planJobId', planJobId);
    return api<{ data: PlanPhotoComparison }>(
      `/api/v1/plan-extraction/projects/${projectId}/field-photo`,
      { method: 'POST', body: fd }
    );
  },

  askAssistant: (projectId: string, question: string, lang: 'fr' | 'ar' | 'en', extractionId?: string) =>
    api<{ data: { answer: string } }>('/api/v1/plan-extraction/assistant', {
      method: 'POST',
      body: JSON.stringify({ projectId, question, lang, extractionId }),
    }),

  listComparisons: (projectId: string) =>
    api<{ data: PlanPhotoComparison[] }>(`/api/v1/plan-extraction/projects/${projectId}/comparisons`),
};

/** API reached via VITE_API_URL or Vite proxy to /api */
export function isPlanApiOnline(): boolean {
  return true;
}
