/** Future auth — not enforced in demo mode. */

export type UserRole =
  | 'admin'
  | 'director'
  | 'project_manager'
  | 'site_manager'
  | 'worker'
  | 'viewer';

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
  companyId: string;
  chantierIds?: string[];
}

export const ROLE_LABELS: Record<UserRole, { fr: string; ar: string }> = {
  admin: { fr: 'Administrateur', ar: 'مدير النظام' },
  director: { fr: 'Directeur', ar: 'المدير العام' },
  project_manager: { fr: 'Chef de projet', ar: 'مدير المشروع' },
  site_manager: { fr: 'Chef de chantier', ar: 'رئيس الورشة' },
  worker: { fr: 'Ouvrier / terrain', ar: 'عامل ميداني' },
  viewer: { fr: 'Lecture seule', ar: 'قراءة فقط' },
};
