/**
 * Mobile API client — mirrors REST endpoints for Android / iOS apps.
 * In demo mode, calls dataStore directly. Point VITE_API_URL to a real server later.
 */
import { dataStore } from '@/services/dataStore';
import type { ChantierInput, Document, DocumentType, PhotoAlbum, SitePhoto } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) return localHandler(path, init) as Promise<T>;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

async function localHandler(path: string, init?: RequestInit): Promise<unknown> {
  dataStore.init();
  const method = init?.method ?? 'GET';
  const body = init?.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : {};

  if (path === '/api/v1/projects' && method === 'GET') return { data: dataStore.getChantiers() };
  if (path === '/api/v1/projects' && method === 'POST') {
    const p = dataStore.createProject(body as ChantierInput);
    return { data: p };
  }
  const projectMatch = path.match(/^\/api\/v1\/projects\/([^/]+)$/);
  if (projectMatch) {
    const id = projectMatch[1];
    if (method === 'GET') {
      const p = dataStore.getChantiers().find((c) => c.id === id);
      if (!p) throw new Error('Not found');
      return { data: p };
    }
    if (method === 'PUT') return { data: dataStore.updateProject(id, body) };
    if (method === 'DELETE') {
      dataStore.deleteProject(id);
      return { ok: true };
    }
  }
  if (path === '/api/v1/sites/active') {
    return { data: dataStore.getChantiers().filter((c) => c.status === 'active') };
  }
  if (path === '/api/v1/sites/delayed') {
    return { data: dataStore.getChantiers().filter((c) => c.status === 'delayed') };
  }
  if (path === '/api/v1/sites/at-risk') {
    return { data: dataStore.getChantiers().filter((c) => c.status === 'at_risk') };
  }
  if (path.startsWith('/api/v1/sites/') && path.endsWith('/timeline')) {
    const id = path.split('/')[4];
    return { data: dataStore.getTimeline().filter((e) => e.chantierId === id) };
  }
  if (path === '/api/v1/team') return { data: dataStore.getTeam() };
  if (path === '/api/v1/attendance') return { data: dataStore.getAttendance() };
  if (path === '/api/v1/materials') return { data: dataStore.getMaterials() };
  if (path === '/api/v1/materials/requests') return { data: dataStore.getMaterialRequests() };
  if (path === '/api/v1/materials/alerts') {
    return { data: dataStore.getMaterials().filter((m) => m.status === 'critical' || m.status === 'low') };
  }
  if (path === '/api/v1/documents' && method === 'GET') return { data: dataStore.getDocuments() };
  if (path === '/api/v1/documents' && method === 'POST') {
    const doc = dataStore.addDocument(body as Omit<Document, 'id'>);
    return { data: doc };
  }
  if (path.startsWith('/api/v1/documents/search')) {
    const q = new URL(path, 'http://x').searchParams.get('q')?.toLowerCase() ?? '';
    const docs = dataStore.getDocuments().filter(
      (d) => d.name.toLowerCase().includes(q) || d.tags.some((t) => t.includes(q))
    );
    return { data: docs };
  }
  if (path === '/api/v1/notifications') return { data: dataStore.getNotifications() };
  if (path === '/api/v1/tasks') return { data: dataStore.getTasks() };
  if (path === '/api/v1/photos' && method === 'GET') return { data: dataStore.getPhotos() };
  if (path === '/api/v1/photos' && method === 'POST') {
    const photo = dataStore.addPhoto(body as Omit<SitePhoto, 'id'>);
    return { data: photo };
  }
  if (path === '/api/v1/photos/albums' && method === 'GET') return { data: dataStore.getPhotoAlbums() };
  if (path === '/api/v1/photos/albums' && method === 'POST') {
    const album = dataStore.createPhotoAlbum(body as Omit<PhotoAlbum, 'id' | 'photoIds' | 'createdAt'>);
    return { data: album };
  }
  const photoTimelineMatch = path.match(/^\/api\/v1\/photos\/timeline\/([^/]+)$/);
  if (photoTimelineMatch && method === 'GET') {
    return { data: dataStore.getPhotoTimeline(photoTimelineMatch[1]) };
  }
  if (path === '/api/v1/photos/compare' && method === 'POST') {
    const record = dataStore.savePhotoComparison(
      body as Omit<import('@/types').PhotoComparisonRecord, 'id' | 'date'>
    );
    return { data: record };
  }
  const photosByProject = path.match(/^\/api\/v1\/photos\/project\/([^/]+)$/);
  if (photosByProject && method === 'GET') {
    return { data: dataStore.getPhotos().filter((p) => p.chantierId === photosByProject[1]) };
  }
  if (path === '/api/v1/photos/comparisons') return { data: dataStore.getPhotoComparisons() };
  const photoReportMatch = path.match(/^\/api\/v1\/photos\/reports\/([^/]+)\/pdf$/);
  if (photoReportMatch && method === 'GET') {
    const ch = dataStore.getChantiers().find((c) => c.id === photoReportMatch[1]);
    return { data: { ok: true, chantierId: photoReportMatch[1], progress: ch?.progress ?? 0 } };
  }
  if (path === '/api/v1/risks') return { data: dataStore.getRisks() };
  if (path === '/api/v1/reports/daily') return { data: { type: 'daily', generated: new Date().toISOString() } };
  if (path === '/api/v1/reports/weekly') return { data: { type: 'weekly', generated: new Date().toISOString() } };
  if (path === '/api/v1/reports/monthly') return { data: { type: 'monthly', generated: new Date().toISOString() } };

  throw new Error(`Unknown route: ${path}`);
}

export const mobileApi = {
  getProjects: () => request<{ data: ReturnType<typeof dataStore.getChantiers> }>('/api/v1/projects'),
  createProject: (body: ChantierInput) =>
    request<{ data: ReturnType<typeof dataStore.createProject> }>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateProject: (id: string, body: Partial<ChantierInput>) =>
    request<{ data: ReturnType<typeof dataStore.updateProject> }>(`/api/v1/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteProject: (id: string) =>
    request<{ ok: boolean }>(`/api/v1/projects/${id}`, { method: 'DELETE' }),
  getActiveSites: () => request<{ data: ReturnType<typeof dataStore.getChantiers> }>('/api/v1/sites/active'),
  getDelayedSites: () => request<{ data: ReturnType<typeof dataStore.getChantiers> }>('/api/v1/sites/delayed'),
  getRiskSites: () => request<{ data: ReturnType<typeof dataStore.getChantiers> }>('/api/v1/sites/at-risk'),
  getSiteTimeline: (chantierId: string) =>
    request<{ data: ReturnType<typeof dataStore.getTimeline> }>(`/api/v1/sites/${chantierId}/timeline`),
  getTeam: () => request<{ data: ReturnType<typeof dataStore.getTeam> }>('/api/v1/team'),
  getAttendance: () => request<{ data: ReturnType<typeof dataStore.getAttendance> }>('/api/v1/attendance'),
  getMaterials: () => request<{ data: ReturnType<typeof dataStore.getMaterials> }>('/api/v1/materials'),
  getMaterialRequests: () =>
    request<{ data: ReturnType<typeof dataStore.getMaterialRequests> }>('/api/v1/materials/requests'),
  getStockAlerts: () =>
    request<{ data: ReturnType<typeof dataStore.getMaterials> }>('/api/v1/materials/alerts'),
  getDocuments: () => request<{ data: ReturnType<typeof dataStore.getDocuments> }>('/api/v1/documents'),
  uploadDocument: (doc: Omit<Document, 'id'>) =>
    request<{ data: Document }>('/api/v1/documents', { method: 'POST', body: JSON.stringify(doc) }),
  searchDocuments: (q: string) =>
    request<{ data: Document[] }>(`/api/v1/documents/search?q=${encodeURIComponent(q)}`),
  getNotifications: () => request<{ data: ReturnType<typeof dataStore.getNotifications> }>('/api/v1/notifications'),
  getTasks: () => request<{ data: ReturnType<typeof dataStore.getTasks> }>('/api/v1/tasks'),
  getPhotos: () => request<{ data: ReturnType<typeof dataStore.getPhotos> }>('/api/v1/photos'),
  uploadPhoto: (body: Omit<SitePhoto, 'id'>) =>
    request<{ data: SitePhoto }>('/api/v1/photos', { method: 'POST', body: JSON.stringify(body) }),
  getPhotosByProject: (chantierId: string) =>
    request<{ data: ReturnType<typeof dataStore.getPhotos> }>(`/api/v1/photos/project/${chantierId}`),
  getPhotoAlbums: () => request<{ data: ReturnType<typeof dataStore.getPhotoAlbums> }>('/api/v1/photos/albums'),
  createPhotoAlbum: (body: Omit<PhotoAlbum, 'id' | 'photoIds' | 'createdAt'>) =>
    request<{ data: PhotoAlbum }>('/api/v1/photos/albums', { method: 'POST', body: JSON.stringify(body) }),
  getPhotoTimeline: (chantierId: string) =>
    request<{ data: ReturnType<typeof dataStore.getPhotoTimeline> }>(`/api/v1/photos/timeline/${chantierId}`),
  savePhotoComparison: (body: Omit<import('@/types').PhotoComparisonRecord, 'id' | 'date'>) =>
    request<{ data: import('@/types').PhotoComparisonRecord }>('/api/v1/photos/compare', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getPhotoComparisons: () =>
    request<{ data: ReturnType<typeof dataStore.getPhotoComparisons> }>('/api/v1/photos/comparisons'),
};

export type MobileUploadPayload = {
  name: string;
  type: DocumentType;
  chantierId: string;
  chantierName: string;
  uploadedBy: string;
  size: string;
  tags: string[];
};
