import { loadDb, saveDb } from './jsonStore.js';
import type { ProjectRecord, Tenant } from '../../shared/plan-extraction/types.js';

export function ensureSeed(): void {
  const db = loadDb();
  if (db.tenants.length > 0) return;

  const tenant: Tenant = {
    id: 'tenant_default',
    name: 'SmartChantier Demo Org',
    slug: 'smartchantier',
    plan: 'pro',
    createdAt: new Date().toISOString(),
  };

  const project: ProjectRecord = {
    id: 'proj_default',
    tenantId: tenant.id,
    name: 'Résidence Anfa — Plan extraction',
    client: 'Promoteur Anfa',
    address: 'Casablanca, Maroc',
    progressPercent: 42,
    budgetPercent: 68,
    delayPercent: 12,
    currency: 'MAD',
    vatRate: 20,
    marginRate: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.tenants.push(tenant);
  db.projects.push(project);
  saveDb();
}
