import type { OrganizationContext } from '@/types/organization';
import { getStorage, setStorage } from '@/utils/storage';

const KEY = 'org_context_v1';

const DEFAULT_ORG: OrganizationContext = {
  company: {
    id: 'co-smartchantier-demo',
    name: 'SmartChantier Démo SARL',
    legalName: 'SmartChantier Démo',
    country: 'FR',
    plan: 'pro',
    createdAt: '2024-01-15',
  },
  users: [
    { id: 'u-admin', companyId: 'co-smartchantier-demo', email: 'admin@smartchantier.fr', displayName: 'Admin Démo', role: 'admin', projectIds: ['pr-1', 'pr-2'], active: true },
    { id: 'u-dir', companyId: 'co-smartchantier-demo', email: 'directeur@smartchantier.fr', displayName: 'Directeur Travaux', role: 'director', projectIds: ['pr-1', 'pr-2'], active: true },
    { id: 'u-pm', companyId: 'co-smartchantier-demo', email: 'chef.projet@smartchantier.fr', displayName: 'Chef de projet', role: 'project_manager', projectIds: ['pr-1'], active: true },
    { id: 'u-sm', companyId: 'co-smartchantier-demo', email: 'chantier@smartchantier.fr', displayName: 'Chef de chantier', role: 'site_manager', projectIds: ['pr-1'], active: true },
    { id: 'u-w1', companyId: 'co-smartchantier-demo', email: 'ouvrier@smartchantier.fr', displayName: 'Équipe terrain', role: 'worker', projectIds: ['pr-1'], active: true },
  ],
  projects: [
    { id: 'pr-1', companyId: 'co-smartchantier-demo', name: 'Résidence Azur', chantierIds: ['ch-1', 'ch-2'], managerUserId: 'u-pm', budgetPlanned: 4_200_000, status: 'active' },
    { id: 'pr-2', companyId: 'co-smartchantier-demo', name: 'Résidence Côte d\'Azur', chantierIds: ['ch-3'], managerUserId: 'u-pm', budgetPlanned: 1_800_000, status: 'active' },
  ],
  currentUserId: 'u-dir',
};

export function getOrganizationContext(): OrganizationContext {
  return getStorage(KEY, DEFAULT_ORG);
}

export function saveOrganizationContext(ctx: OrganizationContext): void {
  setStorage(KEY, ctx);
}

export function resetOrganizationDemo(): void {
  setStorage(KEY, DEFAULT_ORG);
}
