/** Authentication & role-based access */

export type UserRole = 'admin' | 'project_manager' | 'site_manager' | 'client';

export interface CompanyAccount {
  id: string;
  name: string;
  plan: 'trial' | 'pro' | 'enterprise';
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId?: string;
  projectIds?: string[];
}

export const ROLE_LABELS: Record<UserRole, { fr: string; ar: string; en: string }> = {
  admin: { fr: 'Administrateur', ar: 'مدير النظام', en: 'Administrator' },
  project_manager: { fr: 'Chef de projet', ar: 'مدير المشروع', en: 'Project Manager' },
  site_manager: { fr: 'Chef de chantier', ar: 'رئيس الورشة', en: 'Site Manager' },
  client: { fr: 'Client', ar: 'العميل', en: 'Client' },
};

/** Routes restricted by role (path prefix → allowed roles) */
export const ROLE_ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/parametres': ['admin', 'project_manager'],
  '/finances': ['admin', 'project_manager', 'site_manager'],
  '/assistant-directeur-ia': ['admin', 'project_manager'],
  '/centre-rentabilite': ['admin', 'project_manager'],
};

export function roleCanAccess(role: UserRole, path: string): boolean {
  const entry = Object.entries(ROLE_ROUTE_ACCESS).find(([prefix]) => path.startsWith(prefix));
  if (!entry) return true;
  return entry[1].includes(role);
}
